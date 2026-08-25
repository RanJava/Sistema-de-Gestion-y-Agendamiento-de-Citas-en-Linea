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
}
