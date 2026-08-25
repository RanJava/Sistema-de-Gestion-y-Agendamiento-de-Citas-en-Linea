using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BarberLosPeluchitos.Infrastructure.Services;

public class NotificacionService : INotificacionService
{
    private readonly IEmailSender _emailSender;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificacionService> _logger;

    public NotificacionService(
        IEmailSender emailSender,
        IServiceProvider serviceProvider,
        ILogger<NotificacionService> logger)
    {
        _emailSender = emailSender;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task<NotificacionResultDto> EnviarConfirmacionCitaAsync(CitaResponseDto cita, CancellationToken cancellationToken = default)
    {
        var destinatario = !string.IsNullOrWhiteSpace(cita.ClienteCorreo) ? cita.ClienteCorreo : "cliente@peluchitos.com";
        var asunto = $"💈 Confirmación de Cita #{cita.IdCita} - Barbería Los Peluchitos";
        
        var cuerpo = $"""
            ¡Hola {cita.ClienteNombre}!
            
            Tu reserva ha sido confirmada con éxito.
            
            📌 Detalles de la Cita:
            ---------------------------------------
            • Código de Cita: #{cita.IdCita}
            • Servicio: {cita.ServicioNombre} ({cita.Duracion} min)
            • Barbero Asignado: {cita.BarberoNombre}
            • Fecha: {cita.Fecha}
            • Horario: {cita.HoraInicio} a {cita.HoraFin}
            • Monto a Cancelar en Caja: {cita.Precio:F2} Bs
            • Estado: {cita.Estado}
            ---------------------------------------
            
            En caso de que no puedas asistir, puedes cancelar tu reserva a través del siguiente enlace:
            http://localhost:5173/cancelar-cita/{cita.IdCita}
            
            ¡Te esperamos!
            Barbería Los Peluchitos
            """;

        var result = new NotificacionResultDto
        {
            Destinatario = destinatario,
            FechaHora = DateTime.UtcNow
        };

        try
        {
            _logger.LogInformation("HU-05: Iniciando envío de notificación asíncrona para Cita #{IdCita} a '{Destinatario}'...", cita.IdCita, destinatario);

            var exito = await _emailSender.SendEmailAsync(destinatario, asunto, cuerpo, cancellationToken);

            result.Exitoso = exito;
            result.Mensaje = $"Confirmación enviada correctamente a {destinatario}.";
            _logger.LogInformation("HU-05: Notificación enviada con éxito para Cita #{IdCita}.", cita.IdCita);

            await RegistrarLogAsync(cita.IdCita, destinatario, true, result.Mensaje, null);
        }
        catch (Exception ex)
        {
            result.Exitoso = false;
            result.Mensaje = "Ocurrió un error al enviar el correo de confirmación.";
            result.ErrorDetalle = ex.Message;

            _logger.LogError(ex, "HU-05 CRITERIO 2: Falló el envío de correo para Cita #{IdCita}. La cita permanece registrada como 'Pendiente'. Error: {Error}", 
                cita.IdCita, ex.Message);

            await RegistrarLogAsync(cita.IdCita, destinatario, false, result.Mensaje, ex.ToString());
        }

        return result;
    }

    public async Task<NotificacionResultDto> EnviarNotificacionCancelacionAsync(CitaResponseDto cita, CancellationToken cancellationToken = default)
    {
        var destinatario = !string.IsNullOrWhiteSpace(cita.ClienteCorreo) ? cita.ClienteCorreo : "cliente@peluchitos.com";
        var asunto = $"❌ Cancelación de Cita #{cita.IdCita} - Barbería Los Peluchitos";
        
        var cuerpo = $"""
            ¡Hola {cita.ClienteNombre}!
            
            Confirmamos que tu cita con código #{cita.IdCita} para el servicio {cita.ServicioNombre}
            con el profesional {cita.BarberoNombre} el día {cita.Fecha} en el horario {cita.HoraInicio} ha sido CANCELADA.
            
            El horario correspondiente ha sido liberado en el sistema. Puedes volver a agendar en el momento que desees.
            
            Atentamente,
            Barbería Los Peluchitos
            """;

        var result = new NotificacionResultDto
        {
            Destinatario = destinatario,
            FechaHora = DateTime.UtcNow
        };

        try
        {
            _logger.LogInformation("HU-06 Criterio 2: Enviando notificación de cancelación para Cita #{IdCita} a '{Destinatario}'...", cita.IdCita, destinatario);

            var exito = await _emailSender.SendEmailAsync(destinatario, asunto, cuerpo, cancellationToken);

            result.Exitoso = exito;
            result.Mensaje = $"Notificación de cancelación enviada correctamente a {destinatario}.";
            _logger.LogInformation("HU-06: Notificación de cancelación enviada con éxito para Cita #{IdCita}.", cita.IdCita);

            await RegistrarLogAsync(cita.IdCita, destinatario, true, result.Mensaje, null);
        }
        catch (Exception ex)
        {
            result.Exitoso = false;
            result.Mensaje = "Ocurrió un error al enviar el correo de aviso de cancelación.";
            result.ErrorDetalle = ex.Message;

            _logger.LogError(ex, "HU-06: Falló el envío de correo de cancelación para Cita #{IdCita}. Error: {Error}", 
                cita.IdCita, ex.Message);

            await RegistrarLogAsync(cita.IdCita, destinatario, false, result.Mensaje, ex.ToString());
        }

        return result;
    }

    private async Task RegistrarLogAsync(int idCita, string destinatario, bool exitoso, string mensaje, string? errorDetalle)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var logEntry = new NotificacionLog
            {
                IdCita = idCita,
                Destinatario = destinatario,
                Tipo = "EmailConfirmacion",
                Exitoso = exitoso,
                Mensaje = mensaje,
                ErrorDetalle = errorDetalle,
                FechaRegistro = DateTime.UtcNow
            };

            dbContext.NotificacionesLog.Add(logEntry);
            await dbContext.SaveChangesAsync();
        }
        catch (Exception exLog)
        {
            _logger.LogWarning(exLog, "No se pudo guardar el registro de auditoría NotificacionLog en base de datos para la Cita #{IdCita}.", idCita);
        }
    }
}
