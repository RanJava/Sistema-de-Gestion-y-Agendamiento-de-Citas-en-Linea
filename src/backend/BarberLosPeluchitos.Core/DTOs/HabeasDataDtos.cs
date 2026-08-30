using System.ComponentModel.DataAnnotations;

namespace BarberLosPeluchitos.Core.DTOs;

/// <summary>
/// DTO para la rectificación de datos personales (Habeas Data - CPE Art. 130).
/// </summary>
public class RectificarCuentaDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 50 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es obligatorio.")]
    [StringLength(20, MinimumLength = 7, ErrorMessage = "El teléfono debe tener entre 7 y 20 caracteres.")]
    [RegularExpression(@"^[0-9\+\-\s\(\)]+$", ErrorMessage = "El formato de teléfono no es válido.")]
    public string Telefono { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
    [StringLength(100, ErrorMessage = "El correo no puede exceder los 100 caracteres.")]
    public string Correo { get; set; } = string.Empty;
}

/// <summary>
/// DTO de respuesta para operaciones de rectificación o baja lógica de cuenta.
/// </summary>
public class HabeasDataResponseDto
{
    public bool Exitoso { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public int IdCliente { get; set; }
    public bool Activo { get; set; }
    public DateTime? FechaOperacion { get; set; }
}
