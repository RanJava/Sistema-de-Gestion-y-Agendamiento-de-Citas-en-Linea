namespace BarberLosPeluchitos.Core.DTOs;

public class ClienteDto
{
    public int IdCliente { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public int TotalCitas { get; set; }
}
