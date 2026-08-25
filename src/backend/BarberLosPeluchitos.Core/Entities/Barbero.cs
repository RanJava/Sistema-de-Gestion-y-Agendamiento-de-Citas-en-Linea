namespace BarberLosPeluchitos.Core.Entities;

public class Barbero
{
    public int IdBarbero { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;

    // Relaciones de navegación
    public ICollection<HorarioDisponibilidad> HorariosDisponibilidad { get; set; } = new List<HorarioDisponibilidad>();
    public ICollection<Turno> Turnos { get; set; } = new List<Turno>();
}
