using System.ComponentModel.DataAnnotations;

namespace BarberLosPeluchitos.Core.DTOs;

public class TurnoResponseDto
{
    public int IdTurno { get; set; }
    public int IdBarbero { get; set; }
    public string BarberoNombre { get; set; } = string.Empty;
    public string Fecha { get; set; } = string.Empty;
    public string HoraInicio { get; set; } = string.Empty;
    public string HoraFin { get; set; } = string.Empty;
    public string Estado { get; set; } = "Disponible";
    public bool EstaDisponible { get; set; }
    public bool EsPasado { get; set; }
}

public class DisponibilidadResponseDto
{
    public int IdBarbero { get; set; }
    public string BarberoNombre { get; set; } = string.Empty;
    public string Fecha { get; set; } = string.Empty;
    public string DiaSemana { get; set; } = string.Empty;
    public bool TieneJornadaLaboral { get; set; }
    public int TotalTurnosLibres { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public List<TurnoResponseDto> Turnos { get; set; } = new();
}

public class VerificarTurnoResponseDto
{
    public int IdTurno { get; set; }
    public bool EstaDisponible { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public TurnoResponseDto? Turno { get; set; }
}

public class CambiarEstadoTurnoDto
{
    [Required]
    [RegularExpression("^(Disponible|Reservado)$", ErrorMessage = "El estado debe ser 'Disponible' o 'Reservado'.")]
    public string Estado { get; set; } = "Reservado";
}
