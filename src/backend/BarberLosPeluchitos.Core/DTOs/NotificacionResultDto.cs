namespace BarberLosPeluchitos.Core.DTOs;

public class NotificacionResultDto
{
    public bool Exitoso { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string Destinatario { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
    public string? ErrorDetalle { get; set; }
}
