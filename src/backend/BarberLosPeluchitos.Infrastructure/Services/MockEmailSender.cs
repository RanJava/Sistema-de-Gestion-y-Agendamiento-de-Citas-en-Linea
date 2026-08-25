using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace BarberLosPeluchitos.Infrastructure.Services;

public class MockEmailSender : IEmailSender
{
    private readonly ILogger<MockEmailSender> _logger;

    /// <summary>
    /// Propiedad para simular fallos de envío de correo en pruebas unitarias y de integración.
    /// </summary>
    public static bool SimularFallo { get; set; } = false;

    public MockEmailSender(ILogger<MockEmailSender> logger)
    {
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        await Task.Delay(100, cancellationToken); // Simula latencia de red

        if (SimularFallo || to.Contains("invalid_fail_test"))
        {
            _logger.LogError("SIMULACIÓN DE ERROR SMTP: No se pudo entregar la notificación a '{Destinatario}'.", to);
            throw new InvalidOperationException($"SmtpException: Error de conexión con el servidor de correo al notificar a '{to}'.");
        }

        _logger.LogInformation("CORREO ENVIADO EXITOSAMENTE [MOCK]\nTo: {To}\nSubject: {Subject}\nBody:\n{Body}", to, subject, body);
        return true;
    }
}
