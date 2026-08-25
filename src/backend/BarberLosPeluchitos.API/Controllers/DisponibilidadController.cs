using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BarberLosPeluchitos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DisponibilidadController : ControllerBase
{
    private readonly ITurnoRepository _turnoRepository;
    private readonly IBarberoRepository _barberoRepository;
    private readonly ILogger<DisponibilidadController> _logger;

    public DisponibilidadController(
        ITurnoRepository turnoRepository,
        IBarberoRepository barberoRepository,
        ILogger<DisponibilidadController> logger)
    {
        _turnoRepository = turnoRepository;
        _barberoRepository = barberoRepository;
        _logger = logger;
    }

    /// <summary>
    /// HU-03 Criterios 1, 2 y 4: Consulta los turnos libres de un barbero para una fecha específica.
    /// - Filtra turnos pasados si la fecha consultada es hoy (RN-03 / Criterio 4).
    /// - Retorna únicamente turnos con estado 'Disponible' dentro de su jornada (Criterio 1).
    /// - Si no hay turnos, emite mensaje indicativo permitiendo avanzar al día siguiente (Criterio 2).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(DisponibilidadResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConsultarDisponibilidad(
        [FromQuery] int idBarbero,
        [FromQuery] string? fecha,
        CancellationToken cancellationToken)
    {
        if (idBarbero <= 0)
        {
            return BadRequest(new { mensaje = "El parámetro 'idBarbero' es obligatorio y debe ser mayor a 0." });
        }

        // Obtener barbero
        var barbero = await _barberoRepository.ObtenerPorIdAsync(idBarbero, cancellationToken);
        if (barbero == null)
        {
            return NotFound(new { mensaje = $"No se encontró al barbero con ID #{idBarbero}." });
        }

        // Parsear fecha o tomar fecha actual
        DateOnly fechaConsulta;
        if (string.IsNullOrWhiteSpace(fecha))
        {
            fechaConsulta = DateOnly.FromDateTime(DateTime.Now);
        }
        else if (!DateOnly.TryParse(fecha, out fechaConsulta))
        {
            return BadRequest(new { mensaje = $"Formato de fecha inválido ('{fecha}'). Se requiere formato YYYY-MM-DD." });
        }

        // Obtener turnos generados y existentes desde el repositorio
        var turnos = await _turnoRepository.ObtenerHorariosAsync(idBarbero, fechaConsulta, cancellationToken);
        var listaTurnos = turnos.ToList();

        // Obtener hora y fecha actual del servidor (zona horaria local)
        var hoy = DateOnly.FromDateTime(DateTime.Now);
        var horaActual = TimeOnly.FromDateTime(DateTime.Now);

        // HU-03 Criterio 4 / RN-03: Filtrar turnos pasados para la fecha de hoy
        var turnosFiltrados = FiltrarTurnosPasados(listaTurnos, fechaConsulta, hoy, horaActual);

        // HU-03 Criterio 1: Seleccionar únicamente los disponibles
        var turnosLibres = turnosFiltrados.Where(t => t.EstaDisponible()).ToList();

        var nombreDia = ObtenerNombreDiaSemana(fechaConsulta.DayOfWeek);
        var tieneJornada = listaTurnos.Any();

        var response = new DisponibilidadResponseDto
        {
            IdBarbero = barbero.IdBarbero,
            BarberoNombre = barbero.Nombre,
            Fecha = fechaConsulta.ToString("yyyy-MM-dd"),
            DiaSemana = nombreDia,
            TieneJornadaLaboral = tieneJornada,
            TotalTurnosLibres = turnosLibres.Count,
            Mensaje = turnosLibres.Any()
                ? $"{turnosLibres.Count} turno(s) disponible(s) para {barbero.Nombre} el {nombreDia} {fechaConsulta:dd/MM/yyyy}."
                : "Sin turnos disponibles para esta fecha.",
            Turnos = turnosLibres.Select(t => MapearTurno(t, barbero.Nombre, hoy, horaActual)).ToList()
        };

        _logger.LogInformation("Consulta de disponibilidad barbero {IdBarbero}, fecha {Fecha}: {Total} turnos libres.",
            idBarbero, fechaConsulta, turnosLibres.Count);

        return Ok(response);
    }

    /// <summary>
    /// HU-03 Criterio 3: Verificación atómica en tiempo real del estado de un turno al intentar seleccionarlo.
    /// Si el turno fue tomado por otro cliente, bloquea la selección e informa al usuario.
    /// </summary>
    [HttpGet("verificar/{idTurno:int}")]
    [ProducesResponseType(typeof(VerificarTurnoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VerificarDisponibilidad(int idTurno, CancellationToken cancellationToken)
    {
        var turno = await _turnoRepository.ObtenerPorIdAsync(idTurno, cancellationToken);
        if (turno == null)
        {
            return NotFound(new { mensaje = $"No se encontró el turno con ID #{idTurno}." });
        }

        var hoy = DateOnly.FromDateTime(DateTime.Now);
        var horaActual = TimeOnly.FromDateTime(DateTime.Now);
        var esPasado = turno.EsPasado(hoy, horaActual);

        if (esPasado)
        {
            return Ok(new VerificarTurnoResponseDto
            {
                IdTurno = turno.IdTurno,
                EstaDisponible = false,
                Estado = "Pasado",
                Mensaje = "Este horario ya ha transcurrido y no está disponible para reserva.",
                Turno = MapearTurno(turno, turno.Barbero?.Nombre ?? "Barbero", hoy, horaActual)
            });
        }

        var estaLibre = turno.EstaDisponible();

        return Ok(new VerificarTurnoResponseDto
        {
            IdTurno = turno.IdTurno,
            EstaDisponible = estaLibre,
            Estado = turno.Estado,
            Mensaje = estaLibre
                ? "Turno confirmado como disponible."
                : "El turno acaba de ser tomado por otro cliente.",
            Turno = MapearTurno(turno, turno.Barbero?.Nombre ?? "Barbero", hoy, horaActual)
        });
    }

    /// <summary>
    /// Endpoint de utilidad para pruebas de concurrencia en tiempo real (Criterio 3).
    /// Permite alternar un turno entre 'Disponible' y 'Reservado'.
    /// </summary>
    [HttpPost("simular-reserva/{idTurno:int}")]
    [ProducesResponseType(typeof(VerificarTurnoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SimularReserva(int idTurno, [FromBody] CambiarEstadoTurnoDto? dto, CancellationToken cancellationToken)
    {
        var turno = await _turnoRepository.ObtenerPorIdAsync(idTurno, cancellationToken);
        if (turno == null)
        {
            return NotFound(new { mensaje = $"No se encontró el turno con ID #{idTurno}." });
        }

        var nuevoEstado = dto?.Estado ?? (turno.EstaDisponible() ? "Reservado" : "Disponible");
        await _turnoRepository.ActualizarEstadoTurnoAsync(idTurno, nuevoEstado, cancellationToken);

        var turnoActualizado = await _turnoRepository.ObtenerPorIdAsync(idTurno, cancellationToken);
        var hoy = DateOnly.FromDateTime(DateTime.Now);
        var horaActual = TimeOnly.FromDateTime(DateTime.Now);

        _logger.LogInformation("Simulación de estado en turno {IdTurno}: nuevo estado '{Estado}'.", idTurno, nuevoEstado);

        return Ok(new VerificarTurnoResponseDto
        {
            IdTurno = idTurno,
            EstaDisponible = turnoActualizado!.EstaDisponible(),
            Estado = turnoActualizado.Estado,
            Mensaje = $"Estado del turno cambiado a '{nuevoEstado}' exitosamente.",
            Turno = MapearTurno(turnoActualizado, turnoActualizado.Barbero?.Nombre ?? "Barbero", hoy, horaActual)
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static List<Turno> FiltrarTurnosPasados(List<Turno> turnos, DateOnly fechaConsulta, DateOnly hoy, TimeOnly horaActual)
    {
        if (fechaConsulta < hoy)
        {
            return new List<Turno>();
        }

        if (fechaConsulta == hoy)
        {
            return turnos.Where(t => !t.EsPasado(hoy, horaActual)).ToList();
        }

        return turnos;
    }

    private static TurnoResponseDto MapearTurno(Turno turno, string barberoNombre, DateOnly hoy, TimeOnly horaActual)
    {
        return new TurnoResponseDto
        {
            IdTurno = turno.IdTurno,
            IdBarbero = turno.IdBarbero,
            BarberoNombre = barberoNombre,
            Fecha = turno.Fecha.ToString("yyyy-MM-dd"),
            HoraInicio = turno.HoraInicio.ToString("HH:mm"),
            HoraFin = turno.HoraFin.ToString("HH:mm"),
            Estado = turno.Estado,
            EstaDisponible = turno.EstaDisponible(),
            EsPasado = turno.EsPasado(hoy, horaActual)
        };
    }

    private static string ObtenerNombreDiaSemana(DayOfWeek dayOfWeek) => dayOfWeek switch
    {
        DayOfWeek.Monday => "Lunes",
        DayOfWeek.Tuesday => "Martes",
        DayOfWeek.Wednesday => "Miércoles",
        DayOfWeek.Thursday => "Jueves",
        DayOfWeek.Friday => "Viernes",
        DayOfWeek.Saturday => "Sábado",
        DayOfWeek.Sunday => "Domingo",
        _ => "Lunes"
    };
}
