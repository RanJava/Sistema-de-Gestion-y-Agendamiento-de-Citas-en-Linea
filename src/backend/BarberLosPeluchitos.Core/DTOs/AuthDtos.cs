using System.ComponentModel.DataAnnotations;

namespace BarberLosPeluchitos.Core.DTOs;

public class LoginClienteDto
{
    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [EmailAddress(ErrorMessage = "Formato de correo no válido.")]
    public string Correo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    public string Contrasena { get; set; } = string.Empty;
}

public class LoginAdminDto
{
    [Required(ErrorMessage = "El correo del administrador es obligatorio.")]
    [EmailAddress(ErrorMessage = "Formato de correo no válido.")]
    public string Correo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    public string Contrasena { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public int IdUsuario { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty; // 'Cliente' o 'Administrador'
    public DateTime Expiracion { get; set; }
}

public class ActualizarEstadoCitaDto
{
    [Required(ErrorMessage = "El nuevo estado es obligatorio.")]
    [RegularExpression("^(Pendiente|Atendida|Cancelada|No asistió|NoAsistio)$", ErrorMessage = "El estado debe ser 'Pendiente', 'Atendida', 'Cancelada' o 'No asistió'.")]
    public string NuevoEstado { get; set; } = string.Empty;

    /// <summary>
    /// HU-08 Criterio 3: Flag de confirmación explícita para sobrescribir citas que se encuentran en estado 'Cancelada'.
    /// </summary>
    public bool Forzar { get; set; } = false;
}
