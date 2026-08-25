namespace BarberLosPeluchitos.Core.Entities;

public class Cita
{
    public int IdCita { get; set; }
    public int IdCliente { get; set; }
    public int IdTurno { get; set; }
    public int IdServicio { get; set; }
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
    public string Estado { get; set; } = "Pendiente"; // 'Pendiente', 'Atendida', 'Cancelada'
    public int Duracion { get; set; }
    public decimal Precio { get; set; }

    // Relaciones de navegación
    public Cliente Cliente { get; set; } = null!;
    public Turno Turno { get; set; } = null!;
    public Servicio Servicio { get; set; } = null!;
}
