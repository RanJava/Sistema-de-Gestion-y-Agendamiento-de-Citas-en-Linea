using BarberLosPeluchitos.Core.Entities;

namespace BarberLosPeluchitos.Core.Interfaces;

public interface ICitaRepository
{
    /// <summary>
    /// HU-04 Criterios 3 y 4 / Diagrama de Secuencia:
    /// Reserva atómicamente un turno mediante transacción ACID en base de datos.
    /// Si el turno ya no está disponible, lanza una InvalidOperationException ("TurnoNoDisponible").
    /// Al confirmar, copia los snapshots de duración y precio del servicio y crea la CITA en estado 'Pendiente'.
    /// </summary>
    Task<Cita> AgendarCitaTransaccionalAsync(int idCliente, int idServicio, int idTurno, CancellationToken ct = default);

    Task<Cita?> ObtenerPorIdAsync(int idCita, CancellationToken ct = default);

    Task<IEnumerable<Cita>> ObtenerPorClienteAsync(int idCliente, CancellationToken ct = default);

    /// <summary>
    /// HU-07: Obtiene todas las citas programadas para una fecha determinada (ej. hoy) para el panel de administración.
    /// </summary>
    Task<IEnumerable<Cita>> ObtenerCitasDelDiaAsync(DateOnly fecha, CancellationToken ct = default);

    /// <summary>
    /// HU-08 / HU-06: Actualiza el estado de una cita ('Atendida' o 'Cancelada').
    /// Si se cancela, libera automáticamente el turno asociado poniéndolo en estado 'Disponible'.
    /// </summary>
    Task<bool> ActualizarEstadoCitaAsync(int idCita, string nuevoEstado, CancellationToken ct = default);
}
