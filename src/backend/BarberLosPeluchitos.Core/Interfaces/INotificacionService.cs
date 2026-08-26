using BarberLosPeluchitos.Core.DTOs;

namespace BarberLosPeluchitos.Core.Interfaces;

public interface INotificacionService
{
    /// <summary>
    /// HU-05: Dispara el envío de confirmación de cita de forma desacoplada y asíncrona.
    /// Garantiza no lanzar excepciones que afecten la transacción principal.
    /// </summary>
    Task<NotificacionResultDto> EnviarConfirmacionCitaAsync(CitaResponseDto cita, CancellationToken cancellationToken = default);

    /// <summary>
    /// HU-06 Criterio 2: Dispara la notificación de cancelación de cita exitosa de forma desacoplada y asíncrona.
    /// </summary>
    Task<NotificacionResultDto> EnviarNotificacionCancelacionAsync(CitaResponseDto cita, CancellationToken cancellationToken = default);

    /// <summary>
    /// HU-10 Criterio 1: Dispara el envío de recordatorio de cita próxima de forma desacoplada y asíncrona.
    /// </summary>
    Task<NotificacionResultDto> EnviarRecordatorioCitaAsync(CitaResponseDto cita, CancellationToken cancellationToken = default);
}
