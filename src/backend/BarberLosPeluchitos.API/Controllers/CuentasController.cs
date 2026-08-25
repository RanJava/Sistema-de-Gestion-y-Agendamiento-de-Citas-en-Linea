using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BarberLosPeluchitos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CuentasController : ControllerBase
{
    private readonly IClienteRepository _clienteRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<CuentasController> _logger;

    public CuentasController(
        IClienteRepository clienteRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        ILogger<CuentasController> logger)
    {
        _clienteRepository = clienteRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    /// <summary>
    /// HU-01: Registro de una nueva cuenta de cliente.
    /// Valida campos requeridos, formato sintáctico de correo, unicidad y hash con salting (Ley 164 / D.S. 1793).
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
            FechaRegistro = DateOnly.FromDateTime(DateTime.UtcNow)
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
    /// Valida correo y contraseña mediante BCrypt y entrega token JWT con rol 'Cliente'.
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
}
