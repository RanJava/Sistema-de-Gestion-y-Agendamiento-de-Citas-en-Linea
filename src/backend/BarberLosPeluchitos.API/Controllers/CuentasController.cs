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
    private readonly ILogger<CuentasController> _logger;

    public CuentasController(
        IClienteRepository clienteRepository,
        IPasswordHasher passwordHasher,
        ILogger<CuentasController> logger)
    {
        _clienteRepository = clienteRepository;
        _passwordHasher = passwordHasher;
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
        // 1. Validación de campos obligatorios y formato
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var correoNormalizado = dto.Correo.Trim().ToLowerInvariant();

        // 2. Validación de correo duplicado (RN-01 / HU-01 Criterio 2)
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

        // 3. Hasheo irreversible de la contraseña con salt (Ley 164 / D.S. 1793 Art. 56)
        var hashContrasena = _passwordHasher.HashPassword(dto.Contrasena);

        // 4. Creación de la entidad
        var cliente = new Cliente
        {
            Nombre = dto.Nombre.Trim(),
            Telefono = dto.Telefono.Trim(),
            Correo = correoNormalizado,
            ContrasenaHash = hashContrasena,
            FechaRegistro = DateOnly.FromDateTime(DateTime.UtcNow)
        };

        // 5. Persistencia en PostgreSQL
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

        return CreatedAtAction(nameof(ObtenerPorId), new { id = cliente.IdCliente }, new
        {
            mensaje = "Cuenta registrada exitosamente.",
            cliente = responseDto
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
