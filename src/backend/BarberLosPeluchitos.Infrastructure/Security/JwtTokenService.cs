using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BarberLosPeluchitos.Infrastructure.Security;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerarToken(int idUsuario, string nombre, string correo, string rol)
    {
        var secretKey = _configuration["Jwt:Key"] ?? "ClaveSecretaSuperSeguraBarberLosPeluchitos2026!#$";
        var issuer = _configuration["Jwt:Issuer"] ?? "BarberLosPeluchitos";
        var audience = _configuration["Jwt:Audience"] ?? "BarberLosPeluchitosApp";
        var durationInHours = int.TryParse(_configuration["Jwt:DurationInHours"], out var hours) ? hours : 24;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, idUsuario.ToString()),
            new Claim(ClaimTypes.NameIdentifier, idUsuario.ToString()),
            new Claim(ClaimTypes.Name, nombre),
            new Claim(ClaimTypes.Email, correo),
            new Claim(ClaimTypes.Role, rol),
            new Claim("rol", rol),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(durationInHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
