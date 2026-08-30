namespace BarberLosPeluchitos.Core.Entities;

/// <summary>
/// Registro inalterable de auditoría para accesos y modificaciones a datos sensibles (Ley 164 / Código Penal Art. 363 ter).
/// </summary>
public class LogAuditoria
{
    public long IdLog { get; set; }
    public int? IdAdministrador { get; set; }
    public string RecursoAfectado { get; set; } = string.Empty;
    public string? IdRecurso { get; set; }
    public string Accion { get; set; } = string.Empty; // SELECT, UPDATE, DELETE, INSERT
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
    public string IpOrigen { get; set; } = string.Empty;
    public string? Detalles { get; set; }

    // Relación de navegación opcional
    public Administrador? Administrador { get; set; }
}
