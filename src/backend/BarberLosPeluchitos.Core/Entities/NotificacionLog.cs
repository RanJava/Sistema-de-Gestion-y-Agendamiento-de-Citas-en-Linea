namespace BarberLosPeluchitos.Core.Entities;

public class NotificacionLog
{
    public int IdLog { get; set; }
    public int IdCita { get; set; }
    public string Destinatario { get; set; } = string.Empty;
    public string Tipo { get; set; } = "EmailConfirmacion";
    public bool Exitoso { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string? ErrorDetalle { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    // Relación opcional de navegación con Cita
    public Cita? Cita { get; set; }
}
