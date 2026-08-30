namespace BarberLosPeluchitos.Core.Entities;

public class Cliente
{
    public int IdCliente { get; set; }
    public string Nombre { get; set; } = string.Empty;
    
    /// <summary>
    /// Almacenado cifrado en reposo con AES-256 (Ley 164 / D.S. 1793).
    /// </summary>
    public string Telefono { get; set; } = string.Empty;

    /// <summary>
    /// Almacenado cifrado en reposo con AES-256.
    /// </summary>
    public string Correo { get; set; } = string.Empty;

    /// <summary>
    /// Blind index determinístico (HMAC-SHA256) usado exclusivamente para búsquedas de login y unicidad.
    /// </summary>
    public string? CorreoHash { get; set; }

    public string ContrasenaHash { get; set; } = string.Empty;

    /// <summary>
    /// Código de verificación temporal (cifrado en reposo o nulo tras confirmación).
    /// </summary>
    public string? CodigoVerificacion { get; set; }

    public DateOnly FechaRegistro { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    /// <summary>
    /// Indicador de estado de la cuenta para baja lógica (Habeas Data - CPE Art. 130).
    /// </summary>
    public bool Activo { get; set; } = true;

    /// <summary>
    /// Fecha en la que se solicitó el derecho de supresión / baja lógica.
    /// </summary>
    public DateTime? FechaEliminacion { get; set; }

    // Relaciones de navegación
    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
