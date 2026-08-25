using BarberLosPeluchitos.Core.DTOs;

namespace BarberLosPeluchitos.Core.Interfaces;

public interface INotificacionService
{
    /// <summary>
    /// HU-05: Dispara el envío de confirmación de cita de forma desacoplada y asíncrona.
    /// Garantiza no lanzar excepciones que afecten la transacción principal.
    /// </summary>
    Task<NotificacionResultDto> EnviarConfirmacionCitaAsync(CitaResponseDto cita, CancellationToken cancellationToken = default);
}
