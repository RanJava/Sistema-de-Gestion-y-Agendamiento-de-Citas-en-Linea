using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberLosPeluchitos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CitasController : ControllerBase
{
    private readonly ICitaRepository _citaRepository;
    private readonly INotificacionService _notificacionService;
    private readonly ILogger<CitasController> _logger;

    public CitasController(
        ICitaRepository citaRepository,
        INotificacionService notificacionService,
        ILogger<CitasController> logger)
    {
        _citaRepository = citaRepository;
        _notificacionService = notificacionService;
        _logger = logger;
    }

    /// <summary>
    /// HU-04 y HU-05: Agendamiento transaccional de cita y disparo de confirmación automática asíncrona.
    /// Exige autenticación de Cliente o Administrador.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Cliente,Administrador")]
    [ProducesResponseType(typeof(CitaResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AgendarCita([FromBody] AgendarCitaDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var cita = await _citaRepository.AgendarCitaTransaccionalAsync(
                dto.IdCliente, 
                dto.IdServicio, 
                dto.IdTurno, 
                cancellationToken);

            _logger.LogInformation("Cita #{IdCita} agendada exitosamente para cliente #{IdCliente} en turno #{IdTurno}.",
                cita.IdCita, cita.IdCliente, cita.IdTurno);

            var responseDto = MapearCitaResponse(cita);

            // HU-05 CRITERIO 1: Disparo asíncrono desacoplado de la notificación (No bloquea la respuesta HTTP)
            _ = Task.Run(async () =>
            {
                try
                {
                    await _notificacionService.EnviarConfirmacionCitaAsync(responseDto, CancellationToken.None);
                }
                catch (Exception exNotif)
                {
                    _logger.LogError(exNotif, "Error no capturado en ejecución en segundo plano de notificación para Cita #{IdCita}.", responseDto.IdCita);
                }
            });

            return CreatedAtAction(nameof(ObtenerPorId), new { id = cita.IdCita }, new
            {
                mensaje = "Cita agendada exitosamente. Se ha enviado una confirmación a tu correo registrado.",
                cita = responseDto
            });
        }
        catch (InvalidOperationException ex) when (ex.Message == "TurnoNoDisponible")
        {
            _logger.LogWarning("Conflicto de concurrencia: El turno #{IdTurno} ya no se encuentra disponible.", dto.IdTurno);
            return Conflict(new
            {
                mensaje = "El horario seleccionado acaba de ser tomado por otro cliente. Por favor elige otro turno disponible.",
                idTurno = dto.IdTurno
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al agendar cita para cliente #{IdCliente}.", dto.IdCliente);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                mensaje = "Ocurrió un error interno al procesar la reserva. Por favor intenta nuevamente."
            });
        }
    }

    /// <summary>
    /// Consulta el detalle de una cita agendada por su identificador.
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(CitaResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var cita = await _citaRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (cita == null)
        {
            return NotFound(new { mensaje = $"No se encontró la cita con ID #{id}." });
        }

        return Ok(MapearCitaResponse(cita));
    }

    /// <summary>
    /// Retorna todas las citas reservadas por un cliente específico (HU-06).
    /// </summary>
    [HttpGet("cliente/{idCliente:int}")]
    [Authorize(Roles = "Cliente,Administrador")]
    [ProducesResponseType(typeof(IEnumerable<CitaResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ObtenerPorCliente(int idCliente, CancellationToken cancellationToken)
    {
        var citas = await _citaRepository.ObtenerPorClienteAsync(idCliente, cancellationToken);
        var response = citas.Select(MapearCitaResponse);
        return Ok(response);
    }

    /// <summary>
    /// HU-07: Listado de todas las citas del día para el panel de administración con filtro opcional por barbero.
    /// Protegido con rol Administrador. Retorna lista vacía [] si no existen citas para la fecha/filtro.
    /// </summary>
    [HttpGet("hoy")]
    [HttpGet("/api/admin/citas")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(IEnumerable<CitaResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ObtenerCitasDelDia(
        [FromQuery] string? fecha,
        [FromQuery] int? barberoId,
        CancellationToken cancellationToken)
    {
        DateOnly fechaConsulta;
        if (string.IsNullOrWhiteSpace(fecha) || !DateOnly.TryParse(fecha, out fechaConsulta))
        {
            fechaConsulta = DateOnly.FromDateTime(DateTime.Now);
        }

        var citas = await _citaRepository.ObtenerCitasDelDiaAsync(fechaConsulta, barberoId, cancellationToken);
        var response = citas.Select(MapearCitaResponse);
        return Ok(response);
    }

    /// <summary>
    /// HU-08: Actualización de estado de una cita ('Atendida' o 'Cancelada') por parte del Administrador.
    /// </summary>
    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActualizarEstado(int id, [FromBody] ActualizarEstadoCitaDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var actualizado = await _citaRepository.ActualizarEstadoCitaAsync(id, dto.NuevoEstado, cancellationToken);
        if (!actualizado)
        {
            return NotFound(new { mensaje = $"No se encontró la cita con ID #{id}." });
        }

        _logger.LogInformation("Estado de cita #{IdCita} actualizado a '{NuevoEstado}' por Administrador.", id, dto.NuevoEstado);

        return Ok(new
        {
            mensaje = $"El estado de la cita #{id} se actualizó a '{dto.NuevoEstado}' exitosamente.",
            idCita = id,
            nuevoEstado = dto.NuevoEstado
        });
    }

    /// <summary>
    /// HU-06 Criterios 1, 2 y 3: Cancelación de cita agendada con liberación atómica del turno.
    /// Valida la máquina de estados: rechaza la cancelación con 409 Conflict si la cita ya fue 'Atendida'.
    /// Dispara notificación de cancelación de forma asíncrona no bloqueante.
    /// </summary>
    [HttpPatch("{id:int}/cancelar")]
    [Authorize(Roles = "Cliente,Administrador")]
    [ProducesResponseType(typeof(CitaResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelarCita(int id, CancellationToken cancellationToken)
    {
        try
        {
            var cita = await _citaRepository.CancelarCitaTransaccionalAsync(id, cancellationToken);
            var responseDto = MapearCitaResponse(cita);

            _logger.LogInformation("HU-06: Cita #{IdCita} cancelada exitosamente y turno liberado a 'Disponible'.", id);

            // HU-06 Criterio 2: Disparo asíncrono no bloqueante de la notificación de cancelación
            _ = Task.Run(async () =>
            {
                try
                {
                    await _notificacionService.EnviarNotificacionCancelacionAsync(responseDto, CancellationToken.None);
                }
                catch (Exception exNotif)
                {
                    _logger.LogError(exNotif, "Error no capturado en ejecución en segundo plano de notificación de cancelación para Cita #{IdCita}.", responseDto.IdCita);
                }
            });

            return Ok(new
            {
                mensaje = "Cita cancelada exitosamente. El horario ha sido liberado para otros clientes.",
                idCita = id,
                nuevoEstado = "Cancelada",
                cita = responseDto
            });
        }
        catch (InvalidOperationException ex) when (ex.Message == "CitaAtendidaNoCancelable")
        {
            _logger.LogWarning("HU-06 CRITERIO 3: Intento rechazado de cancelar la Cita #{IdCita} porque ya se encuentra en estado 'Atendida'.", id);
            return StatusCode(StatusCodes.Status409Conflict, new
            {
                mensaje = "No se puede cancelar una cita que ya ha sido marcada como 'Atendida' por la administración.",
                idCita = id,
                estadoActual = "Atendida"
            });
        }
        catch (InvalidOperationException ex) when (ex.Message == "CitaYaCancelada")
        {
            return BadRequest(new
            {
                mensaje = "La cita ya se encuentra en estado 'Cancelada'.",
                idCita = id,
                estadoActual = "Cancelada"
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }

    private static CitaResponseDto MapearCitaResponse(Cita cita)
    {
        return new CitaResponseDto
        {
            IdCita = cita.IdCita,
            IdCliente = cita.IdCliente,
            ClienteNombre = cita.Cliente?.Nombre ?? "Cliente",
            ClienteCorreo = cita.Cliente?.Correo ?? "",
            ClienteTelefono = cita.Cliente?.Telefono ?? "",
            IdServicio = cita.IdServicio,
            ServicioNombre = cita.Servicio?.Nombre ?? "Servicio",
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
    }
}
