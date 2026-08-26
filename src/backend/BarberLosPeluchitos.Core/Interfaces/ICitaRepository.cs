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
    /// HU-07: Obtiene todas las citas programadas para una fecha determinada y filtro opcional por barbero para el panel de administración.
    /// </summary>
    Task<IEnumerable<Cita>> ObtenerCitasDelDiaAsync(DateOnly fecha, int? barberoId = null, CancellationToken ct = default);

    /// <summary>
    /// HU-08: Actualiza el estado de una cita ('Atendida', 'Cancelada', 'No asistió' o 'Pendiente').
    /// Reutiliza la liberación atómica del turno asociado cuando el nuevo estado es 'Cancelada' o 'No asistió'.
    /// Si la cita ya está 'Cancelada' y forzar es false, rechaza con requiereConfirmacion = true.
    /// </summary>
    Task<(bool exito, string mensaje, bool requiereConfirmacion)> ActualizarEstadoCitaAsync(
        int idCita, 
        string nuevoEstado, 
        bool forzar = false, 
        string? usuarioAuditoria = null, 
        CancellationToken ct = default);

    /// <summary>
    /// HU-06 Criterios 1 y 3: Cancela transaccionalmente una cita 'Pendiente' y libera atómicamente el turno asociado.
    /// Lanza InvalidOperationException con "CitaAtendidaNoCancelable" si la cita fue marcada como 'Atendida'.
    /// </summary>
    Task<Cita> CancelarCitaTransaccionalAsync(int idCita, CancellationToken ct = default);

    /// <summary>
    /// HU-09 Criterio 1: Obtiene la lista paginada del historial de citas de un cliente ordenadas descendentemente por fecha.
    /// Preserva los valores snapshot (precio y duración al momento de la cita).
    /// </summary>
    Task<IEnumerable<Cita>> ObtenerHistorialClienteAsync(int idCliente, int pagina = 1, int tamanoPagina = 10, CancellationToken ct = default);

    /// <summary>
    /// HU-10 Criterio 1: Obtiene las citas pendientes que están dentro del umbral de X horas de anticipación y aún no tienen recordatorio enviado.
    /// </summary>
    Task<IEnumerable<Cita>> ObtenerCitasPendientesParaRecordatorioAsync(int horasAnticipacion, CancellationToken ct = default);

    /// <summary>
    /// HU-10 Criterio 1: Marca la cita como 'RecordatorioEnviado = true' para evitar duplicidad.
    /// </summary>
    Task MarcarRecordatorioEnviadoAsync(int idCita, CancellationToken ct = default);
}
