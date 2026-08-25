using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace BarberLosPeluchitos.Infrastructure.Repositories;

public class CitaRepository : ICitaRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CitaRepository> _logger;

    public CitaRepository(ApplicationDbContext context, ILogger<CitaRepository>? logger = null)
    {
        _context = context;
        _logger = logger ?? NullLogger<CitaRepository>.Instance;
    }

    public async Task<Cita> AgendarCitaTransaccionalAsync(int idCliente, int idServicio, int idTurno, CancellationToken ct = default)
    {
        // Transacción ACID para asegurar control de concurrencia e inmutabilidad de turnos (RN-02 / RN-04)
        using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted, ct);
        try
        {
            // 1. Verificar existencia de cliente
            var cliente = await _context.Clientes.FindAsync(new object[] { idCliente }, ct);
            if (cliente == null)
            {
                throw new KeyNotFoundException($"El cliente con ID #{idCliente} no existe en el sistema.");
            }

            // 2. Verificar existencia de servicio
            var servicio = await _context.Servicios.FindAsync(new object[] { idServicio }, ct);
            if (servicio == null)
            {
                throw new KeyNotFoundException($"El servicio con ID #{idServicio} no existe en el catálogo.");
            }

            // 3. Obtener y verificar el turno (con control estricto de estado)
            var turno = await _context.Turnos
                .Include(t => t.Barbero)
                .FirstOrDefaultAsync(t => t.IdTurno == idTurno, ct);

            if (turno == null)
            {
                throw new KeyNotFoundException($"El turno con ID #{idTurno} no existe.");
            }

            // HU-04 Criterio 3: Si el turno ya no está disponible, lanzar conflicto de concurrencia
            if (!turno.EstaDisponible())
            {
                throw new InvalidOperationException("TurnoNoDisponible");
            }

            // 4. Marcar turno como Reservado
            turno.Estado = "Reservado";

            // 5. Crear la cita con Snapshot histórico de tarifa y duración (RN-04 / HU-04 Criterio 4)
            var cita = new Cita
            {
                IdCliente = idCliente,
                IdTurno = idTurno,
                IdServicio = idServicio,
            };

            // Ejecución de métodos de dominio según diagrama de clases HU-04
            cita.CalcularDuracionPrecio(servicio);
            cita.Confirmar();

            _context.Citas.Add(cita);
            await _context.SaveChangesAsync(ct);

            await transaction.CommitAsync(ct);

            // Cargar entidades de navegación para la respuesta completa
            cita.Cliente = cliente;
            cita.Servicio = servicio;
            cita.Turno = turno;

            return cita;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<Cita?> ObtenerPorIdAsync(int idCita, CancellationToken ct = default)
    {
        return await _context.Citas
            .Include(c => c.Cliente)
            .Include(c => c.Servicio)
            .Include(c => c.Turno)
                .ThenInclude(t => t.Barbero)
            .FirstOrDefaultAsync(c => c.IdCita == idCita, ct);
    }

    public async Task<IEnumerable<Cita>> ObtenerPorClienteAsync(int idCliente, CancellationToken ct = default)
    {
        return await _context.Citas
            .Include(c => c.Cliente)
            .Include(c => c.Servicio)
            .Include(c => c.Turno)
                .ThenInclude(t => t.Barbero)
            .Where(c => c.IdCliente == idCliente)
            .OrderByDescending(c => c.FechaHora)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Cita>> ObtenerCitasDelDiaAsync(DateOnly fecha, int? barberoId = null, CancellationToken ct = default)
    {
        var query = _context.Citas
            .Include(c => c.Cliente)
            .Include(c => c.Servicio)
            .Include(c => c.Turno)
                .ThenInclude(t => t.Barbero)
            .Where(c => c.Turno.Fecha == fecha);

        if (barberoId.HasValue && barberoId.Value > 0)
        {
            query = query.Where(c => c.Turno.IdBarbero == barberoId.Value);
        }

        return await query
            .OrderBy(c => c.Turno.HoraInicio)
            .ToListAsync(ct);
    }

    public async Task<(bool exito, string mensaje, bool requiereConfirmacion)> ActualizarEstadoCitaAsync(
        int idCita, 
        string nuevoEstado, 
        bool forzar = false, 
        string? usuarioAuditoria = null, 
        CancellationToken ct = default)
    {
        var cita = await _context.Citas
            .Include(c => c.Turno)
            .FirstOrDefaultAsync(c => c.IdCita == idCita, ct);

        if (cita == null)
        {
            return (false, $"No se encontró la cita con ID #{idCita}.", false);
        }

        var estadoAnterior = cita.Estado;

        // HU-08 Criterio 3: Si la cita ya está "Cancelada" y forzar es false, exigir confirmación adicional
        if (string.Equals(estadoAnterior, "Cancelada", StringComparison.OrdinalIgnoreCase) && !forzar)
        {
            return (false, "La cita se encuentra en estado 'Cancelada'. Requiere confirmación explícita para sobrescribir su estado.", true);
        }

        cita.Estado = nuevoEstado;

        // HU-08 Criterio 2 / HU-06: Liberación atómica del turno si pasa a "Cancelada" o "No asistió"
        var esCanceladaONoAsistio = string.Equals(nuevoEstado, "Cancelada", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(nuevoEstado, "No asistió", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(nuevoEstado, "NoAsistio", StringComparison.OrdinalIgnoreCase);

        if (esCanceladaONoAsistio && cita.Turno != null)
        {
            cita.Turno.Estado = "Disponible";
        }

        await _context.SaveChangesAsync(ct);

        // HU-08 Criterio 1: Auditoría de cambio de estado
        _logger.LogInformation("Auditoría HU-08: Usuario '{Usuario}' actualizó el estado de la Cita #{IdCita} de '{EstadoAnterior}' a '{NuevoEstado}' en {FechaHora}.", 
            usuarioAuditoria ?? "Administrador", idCita, estadoAnterior, nuevoEstado, DateTime.UtcNow);

        return (true, $"El estado de la cita #{idCita} se actualizó de '{estadoAnterior}' a '{nuevoEstado}' exitosamente.", false);
    }

    public async Task<Cita> CancelarCitaTransaccionalAsync(int idCita, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted, ct);
        try
        {
            var cita = await _context.Citas
                .Include(c => c.Cliente)
                .Include(c => c.Servicio)
                .Include(c => c.Turno)
                    .ThenInclude(t => t.Barbero)
                .FirstOrDefaultAsync(c => c.IdCita == idCita, ct);

            if (cita == null)
            {
                throw new KeyNotFoundException($"No se encontró la cita con ID #{idCita}.");
            }

            // HU-06 Criterios 1 y 3: Invoca método de dominio de la entidad Cita
            cita.Cancelar(cita.Turno);

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return cita;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<IEnumerable<Cita>> ObtenerHistorialClienteAsync(int idCliente, int pagina = 1, int tamanoPagina = 10, CancellationToken ct = default)
    {
        pagina = Math.Max(1, pagina);
        tamanoPagina = Math.Clamp(tamanoPagina, 1, 50);

        return await _context.Citas
            .Include(c => c.Cliente)
            .Include(c => c.Servicio)
            .Include(c => c.Turno)
                .ThenInclude(t => t.Barbero)
            .Where(c => c.IdCliente == idCliente)
            .OrderByDescending(c => c.Turno.Fecha)
            .ThenByDescending(c => c.Turno.HoraInicio)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .ToListAsync(ct);
    }
}
