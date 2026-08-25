namespace BarberLosPeluchitos.Core.Entities;

public class Servicio
{
    public int IdServicio { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int DuracionBase { get; set; }
    public decimal PrecioBase { get; set; }

    // Relaciones de navegación
    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
