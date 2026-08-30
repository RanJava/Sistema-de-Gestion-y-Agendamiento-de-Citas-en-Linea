namespace BarberLosPeluchitos.Core.Entities;

public class Administrador
{
    public int IdAdministrador { get; set; }
    public string Nombre { get; set; } = string.Empty;

    /// <summary>
    /// Almacenado cifrado en reposo con AES-256.
    /// </summary>
    public string Correo { get; set; } = string.Empty;

    /// <summary>
    /// Blind index determinístico (HMAC-SHA256) para búsquedas de login y unicidad.
    /// </summary>
    public string? CorreoHash { get; set; }

    /// <summary>
    /// Teléfono de contacto administrativo opcional (cifrado en reposo con AES-256).
    /// </summary>
    public string? Telefono { get; set; }

    public string ContrasenaHash { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Relaciones de navegación
    public ICollection<LogAuditoria> LogsAuditoria { get; set; } = new List<LogAuditoria>();
}
