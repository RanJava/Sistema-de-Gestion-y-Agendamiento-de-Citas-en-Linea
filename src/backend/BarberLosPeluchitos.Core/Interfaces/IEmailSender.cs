namespace BarberLosPeluchitos.Core.Interfaces;

public interface IEmailSender
{
    /// <summary>
    /// Envía un correo electrónico de forma asíncrona.
    /// Retorna true si fue exitoso o lanza excepción si falló.
    /// </summary>
    Task<bool> SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default);
}
