using System.ComponentModel.DataAnnotations;

namespace BarberLosPeluchitos.Core.DTOs;

public class HorarioDto
{
    [Required(ErrorMessage = "El día de la semana es obligatorio.")]
    public string DiaSemana { get; set; } = string.Empty;

    [Required(ErrorMessage = "La hora de inicio es obligatoria.")]
    [RegularExpression(@"^([01]\d|2[0-3]):[0-5]\d$", ErrorMessage = "Formato de hora de inicio inválido (HH:mm).")]
    public string HoraInicio { get; set; } = string.Empty;

    [Required(ErrorMessage = "La hora de fin es obligatoria.")]
    [RegularExpression(@"^([01]\d|2[0-3]):[0-5]\d$", ErrorMessage = "Formato de hora de fin inválido (HH:mm).")]
    public string HoraFin { get; set; } = string.Empty;
}

public class RegistrarBarberoDto
{
    [Required(ErrorMessage = "El nombre del barbero es obligatorio.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 50 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono de contacto es obligatorio.")]
    [StringLength(20, MinimumLength = 7, ErrorMessage = "El teléfono debe tener entre 7 y 20 caracteres.")]
    [RegularExpression(@"^[0-9\+\-\s\(\)]+$", ErrorMessage = "Formato de teléfono inválido.")]
    public string Telefono { get; set; } = string.Empty;

    [Required(ErrorMessage = "Se debe agregar al menos un horario de disponibilidad.")]
    [MinLength(1, ErrorMessage = "Se debe agregar al menos un horario de disponibilidad.")]
    public List<HorarioDto> Horarios { get; set; } = new();
}

public class ActualizarHorariosDto
{
    [Required(ErrorMessage = "Los horarios son obligatorios.")]
    [MinLength(1, ErrorMessage = "Se debe especificar al menos un horario.")]
    public List<HorarioDto> Horarios { get; set; } = new();
}

public class ActualizarBarberoDto
{
    [Required(ErrorMessage = "El nombre del barbero es obligatorio.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 50 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono de contacto es obligatorio.")]
    [StringLength(20, MinimumLength = 7, ErrorMessage = "El teléfono debe tener entre 7 y 20 caracteres.")]
    [RegularExpression(@"^[0-9\+\-\s\(\)]+$", ErrorMessage = "Formato de teléfono inválido.")]
    public string Telefono { get; set; } = string.Empty;
}

public class HorarioResponseDto
{
    public int IdHorario { get; set; }
    public int IdBarbero { get; set; }
    public string DiaSemana { get; set; } = string.Empty;
    public string HoraInicio { get; set; } = string.Empty;
    public string HoraFin { get; set; } = string.Empty;
}

public class BarberoResponseDto
{
    public int IdBarbero { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public bool TieneHorarioCargado { get; set; }
    public List<HorarioResponseDto> Horarios { get; set; } = new();
}
