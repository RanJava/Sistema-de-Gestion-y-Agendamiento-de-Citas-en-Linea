using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace BarberLosPeluchitos.Infrastructure.Services;

/// <summary>
/// Servicio de registro de logs de auditoría inalterables en PostgreSQL.
/// </summary>
public class AuditoriaService : IAuditoriaService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditoriaService> _logger;

    public AuditoriaService(ApplicationDbContext context, ILogger<AuditoriaService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task RegistrarAccesoAsync(
        int? idAdministrador,
        string recursoAfectado,
        string? idRecurso,
        string accion,
        string ipOrigen,
        string? detalles = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var log = new LogAuditoria
            {
                IdAdministrador = idAdministrador,
                RecursoAfectado = recursoAfectado,
                IdRecurso = idRecurso,
                Accion = accion,
                FechaHora = DateTime.UtcNow,
                IpOrigen = string.IsNullOrWhiteSpace(ipOrigen) ? "127.0.0.1" : ipOrigen,
                Detalles = detalles
            };

            _context.LogsAuditoria.Add(log);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Auditoría: [{Accion}] sobre '{Recurso}' (ID: {IdRecurso}) por Admin ID {IdAdmin} desde IP {Ip}.",
                accion, recursoAfectado, idRecurso ?? "N/A", idAdministrador?.ToString() ?? "Sistema", ipOrigen);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico al registrar log de auditoría inalterable para recurso {Recurso}.", recursoAfectado);
        }
    }
}
