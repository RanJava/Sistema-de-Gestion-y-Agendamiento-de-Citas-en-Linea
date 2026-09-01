using System.Security.Claims;
using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberLosPeluchitos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CuentasController : ControllerBase
{
    private readonly IClienteRepository _clienteRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IAuditoriaService _auditoriaService;
    private readonly IEncryptionService _encryptionService;
    private readonly ILogger<CuentasController> _logger;

    public CuentasController(
        IClienteRepository clienteRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IAuditoriaService auditoriaService,
        IEncryptionService encryptionService,
        ILogger<CuentasController> logger)
    {
        _clienteRepository = clienteRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _auditoriaService = auditoriaService;
        _encryptionService = encryptionService;
        _logger = logger;
    }

    /// <summary>
    /// HU-01: Registro de una nueva cuenta de cliente.
    /// Valida campos requeridos, unicidad y hash de contraseña (Ley 164 / D.S. 1793).
    /// </summary>
    [HttpPost("registro")]
    [ProducesResponseType(typeof(ClienteResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Registrar([FromBody] RegistroClienteDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var correoNormalizado = dto.Correo.Trim().ToLowerInvariant();

        // Validación de correo duplicado (RN-01 / HU-01 Criterio 2)
        var correoExiste = await _clienteRepository.ExisteCorreoAsync(correoNormalizado, cancellationToken);
        if (correoExiste)
        {
            _logger.LogWarning("Intento de registro con correo ya existente: {Correo}", correoNormalizado);
            return Conflict(new
            {
                mensaje = "El correo electrónico ya se encuentra registrado en el sistema.",
                campo = "correo"
            });
        }

        // Hasheo irreversible con BCrypt (Ley 164 / D.S. 1793 Art. 56)
        var hashContrasena = _passwordHasher.HashPassword(dto.Contrasena);

        var cliente = new Cliente
        {
            Nombre = dto.Nombre.Trim(),
            Telefono = dto.Telefono.Trim(),
            Correo = correoNormalizado,
            ContrasenaHash = hashContrasena,
            FechaRegistro = DateOnly.FromDateTime(DateTime.UtcNow),
            Activo = true
        };

        await _clienteRepository.GuardarAsync(cliente, cancellationToken);

        _logger.LogInformation("Cliente registrado exitosamente con ID {IdCliente}", cliente.IdCliente);

        var responseDto = new ClienteResponseDto
        {
            IdCliente = cliente.IdCliente,
            Nombre = cliente.Nombre,
            Telefono = cliente.Telefono,
            Correo = cliente.Correo,
            FechaRegistro = cliente.FechaRegistro
        };

        // Generar token JWT automático tras el registro
        var token = _jwtTokenService.GenerarToken(cliente.IdCliente, cliente.Nombre, cliente.Correo, "Cliente");

        return CreatedAtAction(nameof(ObtenerPorId), new { id = cliente.IdCliente }, new
        {
            mensaje = "Cuenta registrada exitosamente.",
            cliente = responseDto,
            token,
            rol = "Cliente"
        });
    }

    /// <summary>
    /// Inicio de sesión para clientes registrados.
    /// Valida correo y contraseña mediante BCrypt, estado activo y entrega token JWT.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginClienteDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var correoNormalizado = dto.Correo.Trim().ToLowerInvariant();
        var cliente = await _clienteRepository.BuscarPorCorreoAsync(correoNormalizado, cancellationToken);

        if (cliente == null || !_passwordHasher.VerifyPassword(dto.Contrasena, cliente.ContrasenaHash))
        {
            _logger.LogWarning("Intento de login fallido para correo: {Correo}", correoNormalizado);
            return Unauthorized(new { mensaje = "Correo electrónico o contraseña incorrectos." });
        }

        if (!cliente.Activo)
        {
            _logger.LogWarning("Intento de login para cuenta anonimizada #{IdCliente}", cliente.IdCliente);
            return Unauthorized(new { mensaje = "Esta cuenta ya no está activa. Los datos asociados han sido eliminados conforme al derecho de supresión (Habeas Data)." });
        }

        var token = _jwtTokenService.GenerarToken(cliente.IdCliente, cliente.Nombre, cliente.Correo, "Cliente");

        _logger.LogInformation("Login exitoso para cliente #{IdCliente} ({Correo})", cliente.IdCliente, cliente.Correo);

        return Ok(new AuthResponseDto
        {
            Token = token,
            IdUsuario = cliente.IdCliente,
            Nombre = cliente.Nombre,
            Correo = cliente.Correo,
            Rol = "Cliente",
            Expiracion = DateTime.UtcNow.AddHours(24)
        });
    }

    /// <summary>
    /// Consulta si un correo ya se encuentra registrado para validación reactiva en el frontend.
    /// </summary>
    [HttpGet("verificar-correo")]
    public async Task<IActionResult> VerificarCorreo([FromQuery] string correo, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(correo))
        {
            return BadRequest(new { mensaje = "El parámetro correo es requerido." });
        }

        var existe = await _clienteRepository.ExisteCorreoAsync(correo.Trim().ToLowerInvariant(), cancellationToken);
        return Ok(new
        {
            correo = correo.Trim(),
            disponible = !existe
        });
    }

    /// <summary>
    /// Obtiene los datos públicos de un cliente por su ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ClienteResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var cliente = await _clienteRepository.BuscarPorIdAsync(id, cancellationToken);
        if (cliente == null)
        {
            return NotFound(new { mensaje = $"Cliente con ID {id} no encontrado." });
        }

        var responseDto = new ClienteResponseDto
        {
            IdCliente = cliente.IdCliente,
            Nombre = cliente.Nombre,
            Telefono = cliente.Telefono,
            Correo = cliente.Correo,
            FechaRegistro = cliente.FechaRegistro
        };

        return Ok(responseDto);
    }

    /// <summary>
    /// Habeas Data - Rectificación de datos personales (CPE Art. 130).
    /// Permite al titular o a un administrador corregir datos inexactos o desactualizados.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(HabeasDataResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RectificarDatos(int id, [FromBody] RectificarCuentaDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!ValidarAccesoPropietarioOAdmin(id, out var idAdmin, out var esAdmin))
        {
            return Forbid();
        }

        var cliente = await _clienteRepository.BuscarPorIdAsync(id, cancellationToken);
        if (cliente == null)
        {
            return NotFound(new { mensaje = $"Cliente con ID {id} no encontrado." });
        }

        // Bloquear rectificación sobre cuentas ya anonimizadas
        if (!cliente.Activo)
        {
            return Conflict(new { mensaje = "Esta cuenta ya no está activa. No es posible rectificar datos de una cuenta dada de baja." });
        }

        var nuevoCorreoNormalizado = dto.Correo.Trim().ToLowerInvariant();

        // Validar unicidad del correo comparando contra el blind-index HMAC (no contra texto plano)
        var nuevoCorreoHmac = _encryptionService.ComputeHmacSha256(nuevoCorreoNormalizado);
        if (!string.Equals(cliente.CorreoHash, nuevoCorreoHmac, StringComparison.Ordinal))
        {
            var correoExiste = await _clienteRepository.ExisteCorreoAsync(nuevoCorreoNormalizado, cancellationToken);
            if (correoExiste)
            {
                return Conflict(new { mensaje = "El nuevo correo electrónico ya está registrado por otra cuenta.", campo = "correo" });
            }
        }

        // Cifrar datos PII antes de persistir (Ley 164 / D.S. 1793 Art. 56)
        cliente.Nombre = dto.Nombre.Trim();
        cliente.Telefono = dto.Telefono.Trim();  // ActualizarAsync aplica el AES ValueConverter
        cliente.Correo = nuevoCorreoNormalizado;  // ActualizarAsync recalcula el CorreoHash HMAC

        await _clienteRepository.ActualizarAsync(cliente, cancellationToken);

        // Registrar auditoría siempre (propietario o admin) — Ley 164 / Código Penal Art. 363 ter
        var ipOrigen = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var ejecutorId = esAdmin ? idAdmin : id;
        var detalle = esAdmin
            ? $"Admin #{idAdmin} rectificó datos personales de cliente #{id} (Habeas Data)"
            : $"Cliente #{id} rectificó sus propios datos personales (Habeas Data — autoservicio)";

        await _auditoriaService.RegistrarAccesoAsync(
            ejecutorId,
            "cliente",
            id.ToString(),
            "UPDATE",
            ipOrigen,
            detalle,
            cancellationToken);

        _logger.LogInformation("Habeas Data: Datos rectificados para el cliente #{IdCliente}.", id);

        return Ok(new HabeasDataResponseDto
        {
            Exitoso = true,
            Mensaje = "Datos personales actualizados y rectificados correctamente.",
            IdCliente = cliente.IdCliente,
            Activo = cliente.Activo,
            FechaOperacion = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Habeas Data - Derecho de Supresión / Cancelación (Baja Lógica - CPE Art. 130).
    /// Desactiva la cuenta del cliente preservando el histórico de citas para integridad transaccional.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(HabeasDataResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BajaLogica(int id, CancellationToken cancellationToken)
    {
        if (!ValidarAccesoPropietarioOAdmin(id, out var idAdmin, out var esAdmin))
        {
            return Forbid();
        }

        var cliente = await _clienteRepository.BuscarPorIdAsync(id, cancellationToken);
        if (cliente == null)
        {
            return NotFound(new { mensaje = $"Cliente con ID {id} no encontrado." });
        }

        if (!cliente.Activo)
        {
            return Conflict(new { mensaje = "Esta cuenta ya fue dada de baja previamente." });
        }

        // Anonimización real de PII (BajaLogicaAsync sobrescribe nombre, correo, teléfono, hash y contraseña)
        await _clienteRepository.BajaLogicaAsync(id, cancellationToken);

        // Registrar auditoría siempre — Ley 164 / Código Penal Art. 363 ter
        var ipOrigen = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var ejecutorId = esAdmin ? idAdmin : id;
        var detalle = esAdmin
            ? $"Admin #{idAdmin} ejecutó baja lógica / derecho de supresión para cliente #{id} (Habeas Data)"
            : $"Cliente #{id} ejerció su derecho de supresión / baja de cuenta (Habeas Data — autoservicio)";

        await _auditoriaService.RegistrarAccesoAsync(
            ejecutorId,
            "cliente",
            id.ToString(),
            "DELETE",
            ipOrigen,
            detalle,
            cancellationToken);

        _logger.LogInformation("Habeas Data: Baja lógica y anonimización procesadas para cliente #{IdCliente}.", id);

        return Ok(new HabeasDataResponseDto
        {
            Exitoso = true,
            Mensaje = "Cuenta dada de baja y datos personales anonimizados exitosamente. El historial de citas se conserva de forma anónima conforme al Código de Comercio Art. 36.",
            IdCliente = id,
            Activo = false,
            FechaOperacion = DateTime.UtcNow
        });
    }

    private bool ValidarAccesoPropietarioOAdmin(int idClienteSolicitado, out int? idAdmin, out bool esAdmin)
    {
        idAdmin = null;
        esAdmin = User.IsInRole("Administrador");

        var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("id_usuario")?.Value
                      ?? User.FindFirst("sub")?.Value;

        if (int.TryParse(claimId, out var parsedId))
        {
            if (esAdmin)
            {
                idAdmin = parsedId;
                return true;
            }

            return parsedId == idClienteSolicitado;
        }

        return false;
    }
}
