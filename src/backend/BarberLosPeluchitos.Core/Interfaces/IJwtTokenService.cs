namespace BarberLosPeluchitos.Core.Interfaces;

public interface IJwtTokenService
{
    string GenerarToken(int idUsuario, string nombre, string correo, string rol);
}
