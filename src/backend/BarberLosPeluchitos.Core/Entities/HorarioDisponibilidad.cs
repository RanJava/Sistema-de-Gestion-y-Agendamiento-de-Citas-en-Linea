namespace BarberLosPeluchitos.Core.Entities;

public class HorarioDisponibilidad
{
    public int IdHorario { get; set; }
    public int IdBarbero { get; set; }
    public string DiaSemana { get; set; } = string.Empty;
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }

    // Relaciones de navegación
    public Barbero Barbero { get; set; } = null!;

    /// <summary>
    /// HU-02 Criterio 3 / Diagrama de Clases: Verifica si la franja horaria es válida (horaFin > horaInicio).
    /// </summary>
    public bool EsValido() => HoraFin > HoraInicio;
}
