using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberLosPeluchitos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdministradoresController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AdministradoresController> _logger;

    public AdministradoresController(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        ILogger<AdministradoresController> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    /// <summary>
    /// Inicio de sesión para administradores de BarberLosPeluchitos.
    /// Valida credenciales contra la tabla 'administrador' y emite un token JWT con rol 'Administrador'.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginAdminDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var correoNormalizado = dto.Correo.Trim().ToLowerInvariant();
        var admin = await _context.Administradores
            .FirstOrDefaultAsync(a => a.Correo.ToLower() == correoNormalizado, cancellationToken);

        if (admin == null || !_passwordHasher.VerifyPassword(dto.Contrasena, admin.ContrasenaHash))
        {
            _logger.LogWarning("Intento de login administrativo fallido para correo: {Correo}", correoNormalizado);
            return Unauthorized(new { mensaje = "Credenciales administrativas incorrectas." });
        }

        var token = _jwtTokenService.GenerarToken(admin.IdAdministrador, admin.Nombre, admin.Correo, "Administrador");

        _logger.LogInformation("Login administrativo exitoso para #{IdAdmin} ({Nombre})", admin.IdAdministrador, admin.Nombre);

        return Ok(new AuthResponseDto
        {
            Token = token,
            IdUsuario = admin.IdAdministrador,
            Nombre = admin.Nombre,
            Correo = admin.Correo,
            Rol = "Administrador",
            Expiracion = DateTime.UtcNow.AddHours(24)
        });
    }
}
