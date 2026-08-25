using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BarberLosPeluchitos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CitasController : ControllerBase
{
    private readonly ICitaRepository _citaRepository;
    private readonly ILogger<CitasController> _logger;

    public CitasController(
        ICitaRepository citaRepository,
        ILogger<CitasController> logger)
    {
        _citaRepository = citaRepository;
        _logger = logger;
    }

    /// <summary>
    /// HU-04 Criterios 1, 2, 3 y 4: Agendamiento de cita en el local.
    /// - Exige servicio, barbero y horario (Criterio 1).
    /// - Exige cliente autenticado (Criterio 2).
    /// - Maneja condiciones de carrera atómicamente retornando 409 Conflict si el turno fue tomado (Criterio 3).
    /// - Almacena snapshot de tarifa y duración del servicio y asigna estado 'Pendiente' (Criterio 4).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CitaResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
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

            return CreatedAtAction(nameof(ObtenerPorId), new { id = cita.IdCita }, new
            {
                mensaje = "Cita agendada exitosamente.",
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
    [ProducesResponseType(typeof(CitaResponseDto), StatusCodes.Status200OK)]
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
    /// Retorna todas las citas reservadas por un cliente específico.
    /// </summary>
    [HttpGet("cliente/{idCliente:int}")]
    [ProducesResponseType(typeof(IEnumerable<CitaResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerPorCliente(int idCliente, CancellationToken cancellationToken)
    {
        var citas = await _citaRepository.ObtenerPorClienteAsync(idCliente, cancellationToken);
        var response = citas.Select(MapearCitaResponse);
        return Ok(response);
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
