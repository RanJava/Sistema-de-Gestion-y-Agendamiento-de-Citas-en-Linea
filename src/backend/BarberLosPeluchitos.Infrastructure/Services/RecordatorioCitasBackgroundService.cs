using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Core.Options;
using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BarberLosPeluchitos.Infrastructure.Services;

public class RecordatorioCitasBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly RecordatorioOptions _options;
    private readonly ILogger<RecordatorioCitasBackgroundService> _logger;

    public RecordatorioCitasBackgroundService(
        IServiceProvider serviceProvider,
        IOptions<RecordatorioOptions> options,
        ILogger<RecordatorioCitasBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "HU-10: Iniciando BackgroundService de Recordatorios de Citas (Umbral: {Horas}h, Intervalo: {Min}m).",
            _options.HorasAnticipacion, _options.IntervaloChequeoMinutos);

        var intervalo = TimeSpan.FromMinutes(Math.Max(1, _options.IntervaloChequeoMinutos));
        using var timer = new PeriodicTimer(intervalo);

        // Ejecución inmediata inicial al arrancar el servicio
        await ProcesarRecordatoriosAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            await ProcesarRecordatoriosAsync(stoppingToken);
        }
    }

    public async Task ProcesarRecordatoriosAsync(CancellationToken stoppingToken = default)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var citaRepository = scope.ServiceProvider.GetRequiredService<ICitaRepository>();
            var notificacionService = scope.ServiceProvider.GetRequiredService<INotificacionService>();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var citasPendientes = await citaRepository.ObtenerCitasPendientesParaRecordatorioAsync(_options.HorasAnticipacion, stoppingToken);
            var listaCitas = citasPendientes.ToList();

            if (listaCitas.Count == 0)
            {
                return;
            }

            _logger.LogInformation("HU-10: Se encontraron {Count} citas pendientes dentro del umbral de {Horas}h para verificar recordatorio.", listaCitas.Count, _options.HorasAnticipacion);

            foreach (var cita in listaCitas)
            {
                if (stoppingToken.IsCancellationRequested) break;

                // HU-10 CRITERIO 2: Revalidar el estado actual de la CITA justo antes de enviar
                var citaFresca = await dbContext.Citas.AsNoTracking().FirstOrDefaultAsync(c => c.IdCita == cita.IdCita, stoppingToken);

                if (citaFresca == null || !string.Equals(citaFresca.Estado, "Pendiente", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning(
                        "HU-10 CRITERIO 2: La Cita #{IdCita} ya no se encuentra en estado 'Pendiente' (Estado actual: '{Estado}'). Se omite el envío del recordatorio.",
                        cita.IdCita, citaFresca?.Estado ?? "Inexistente");
                    continue;
                }

                if (citaFresca.RecordatorioEnviado)
                {
                    _logger.LogInformation("HU-10 CRITERIO 1: La Cita #{IdCita} ya tiene un recordatorio marcado como enviado. Se omite reenvío.", cita.IdCita);
                    continue;
                }

                var responseDto = new CitaResponseDto
                {
                    IdCita = cita.IdCita,
                    IdCliente = cita.IdCliente,
                    ClienteNombre = cita.Cliente?.Nombre ?? "Cliente General",
                    ClienteTelefono = cita.Cliente?.Telefono ?? "",
                    ClienteCorreo = cita.Cliente?.Correo ?? "",
                    IdServicio = cita.IdServicio,
                    ServicioNombre = cita.Servicio?.Nombre ?? "Servicio General",
                    Duracion = cita.Duracion,
                    Precio = cita.Precio,
                    IdTurno = cita.IdTurno,
                    Fecha = cita.Turno?.Fecha.ToString("yyyy-MM-dd") ?? "",
                    HoraInicio = cita.Turno?.HoraInicio.ToString("HH:mm") ?? "",
                    HoraFin = cita.Turno?.HoraFin.ToString("HH:mm") ?? "",
                    IdBarbero = cita.Turno?.IdBarbero ?? 0,
                    BarberoNombre = cita.Turno?.Barbero?.Nombre ?? "Barbero",
                    Estado = cita.Estado,
                    FechaHora = cita.FechaHora
                };

                // Reutilización del servicio de notificaciones de HU-05
                await notificacionService.EnviarRecordatorioCitaAsync(responseDto, stoppingToken);

                // Marcar flag RecordatorioEnviado = true
                await citaRepository.MarcarRecordatorioEnviadoAsync(cita.IdCita, stoppingToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "HU-10: Ocurrió un error inesperado al procesar los recordatorios de citas en segundo plano.");
        }
    }
}
// HU-10: Recordatorio de cita próxima - BackgroundService IHostedService
