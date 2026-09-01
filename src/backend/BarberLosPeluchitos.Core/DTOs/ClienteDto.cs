namespace BarberLosPeluchitos.Core.DTOs;

public class ClienteDto
{
    public int IdCliente { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public int TotalCitas { get; set; }

    /// <summary>
    /// Indica si la cuenta está activa o ha sido anonimizada por ejercicio de Habeas Data (CPE Art. 130).
    /// </summary>
    public bool Activo { get; set; } = true;

    /// <summary>
    /// Fecha en la que se procesó la baja lógica / anonimización, si aplica.
    /// </summary>
    public DateTime? FechaEliminacion { get; set; }
}

