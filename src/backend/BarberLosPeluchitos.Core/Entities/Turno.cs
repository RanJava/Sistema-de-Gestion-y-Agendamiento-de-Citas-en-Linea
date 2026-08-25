namespace BarberLosPeluchitos.Core.Entities;

public class Turno
{
    public int IdTurno { get; set; }
    public int IdBarbero { get; set; }
    public DateOnly Fecha { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public string Estado { get; set; } = "Disponible"; // 'Disponible', 'Reservado'

    // Relaciones de navegación
    public Barbero Barbero { get; set; } = null!;
    public Cita? Cita { get; set; }

    /// <summary>
    /// HU-03 Criterio 1 / Diagrama de Clases: Verifica si el turno se encuentra en estado Disponible.
    /// </summary>
    public bool EstaDisponible() => string.Equals(Estado, "Disponible", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// HU-03 Criterio 4 / RN-03 / Diagrama de Clases: Determina si el turno ya transcurrió respecto a la fecha y hora actual.
    /// </summary>
    public bool EsPasado(DateOnly fechaActual, TimeOnly horaActual)
    {
        if (Fecha < fechaActual) return true;
        if (Fecha == fechaActual && HoraInicio <= horaActual) return true;
        return false;
    }
}
