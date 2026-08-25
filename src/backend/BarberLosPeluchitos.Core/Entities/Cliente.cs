namespace BarberLosPeluchitos.Core.Entities;

public class Cliente
{
    public int IdCliente { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string ContrasenaHash { get; set; } = string.Empty;
    public DateOnly FechaRegistro { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    // Relaciones de navegación
    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
