namespace BarberLosPeluchitos.Core.Interfaces;

/// <summary>
/// Contrato para el registro inalterable de auditoría sobre accesos y modificaciones a datos personales.
/// </summary>
public interface IAuditoriaService
{
    Task RegistrarAccesoAsync(
        int? idAdministrador,
        string recursoAfectado,
        string? idRecurso,
        string accion,
        string ipOrigen,
        string? detalles = null,
        CancellationToken cancellationToken = default);
}
