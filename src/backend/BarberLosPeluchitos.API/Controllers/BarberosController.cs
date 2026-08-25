using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BarberLosPeluchitos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BarberosController : ControllerBase
{
    private readonly IBarberoRepository _barberoRepository;
    private readonly ILogger<BarberosController> _logger;

    private static readonly HashSet<string> DiasValidos = new(StringComparer.OrdinalIgnoreCase)
    {
        "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"
    };

    public BarberosController(
        IBarberoRepository barberoRepository,
        ILogger<BarberosController> logger)
    {
        _barberoRepository = barberoRepository;
        _logger = logger;
    }

    /// <summary>
    /// HU-02 Criterio 1: Obtiene el listado completo de staff con sus horarios semanales para el panel de administración.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<BarberoResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerTodos(CancellationToken cancellationToken)
    {
        var barberos = await _barberoRepository.ObtenerTodosAsync(cancellationToken);
        var response = barberos.Select(MapearBarberoResponse);
        return Ok(response);
    }

    /// <summary>
    /// HU-02 Criterio 4 / RN-06: Obtiene únicamente los barberos que tienen disponibilidad configurada.
    /// Los barberos sin horarios no figuran como opción disponible para los clientes en el agendamiento.
    /// </summary>
    [HttpGet("disponibles")]
    [ProducesResponseType(typeof(IEnumerable<BarberoResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerDisponibles(CancellationToken cancellationToken)
    {
        var barberos = await _barberoRepository.ObtenerConDisponibilidadAsync(cancellationToken);
        var response = barberos.Select(MapearBarberoResponse);
        return Ok(response);
    }

    /// <summary>
    /// Obtiene los detalles y horarios de un barbero por su identificador.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(BarberoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var barbero = await _barberoRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (barbero == null)
        {
            return NotFound(new { mensaje = $"No se encontró al barbero con ID #{id}." });
        }

        return Ok(MapearBarberoResponse(barbero));
    }

    /// <summary>
    /// HU-02 Criterios 1 y 3: Registra un nuevo barbero con sus franjas horarias semanales.
    /// Valida que hora_fin sea estrictamente posterior a hora_inicio.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(BarberoResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Registrar([FromBody] RegistrarBarberoDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Validación de rangos de horarios (HU-02 Criterio 3 / RN-03)
        var errorValidacion = ValidarHorarios(dto.Horarios, out var entidadesHorarios);
        if (errorValidacion != null)
        {
            return BadRequest(new { mensaje = errorValidacion });
        }

        var barbero = new Barbero
        {
            Nombre = dto.Nombre.Trim(),
            Telefono = dto.Telefono.Trim(),
            HorariosDisponibilidad = entidadesHorarios
        };

        await _barberoRepository.GuardarAsync(barbero, cancellationToken);

        _logger.LogInformation("Barbero registrado exitosamente con ID {IdBarbero} y {Count} franjas horarias.", 
            barbero.IdBarbero, barbero.HorariosDisponibilidad.Count);

        var responseDto = MapearBarberoResponse(barbero);

        return CreatedAtAction(nameof(ObtenerPorId), new { id = barbero.IdBarbero }, new
        {
            mensaje = $"Barbero '{barbero.Nombre}' registrado exitosamente en el staff.",
            barbero = responseDto
        });
    }

    /// <summary>
    /// Actualiza los datos personales (nombre, teléfono) de un barbero.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(BarberoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActualizarDatos(int id, [FromBody] ActualizarBarberoDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var barbero = await _barberoRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (barbero == null)
        {
            return NotFound(new { mensaje = $"No se encontró al barbero con ID #{id}." });
        }

        barbero.Nombre = dto.Nombre.Trim();
        barbero.Telefono = dto.Telefono.Trim();

        await _barberoRepository.ActualizarAsync(barbero, cancellationToken);

        return Ok(new
        {
            mensaje = "Datos del barbero actualizados correctamente.",
            barbero = MapearBarberoResponse(barbero)
        });
    }

    /// <summary>
    /// HU-02 Criterios 2 y 3: Actualiza la disponibilidad semanal de un barbero.
    /// Los cambios se reflejan de inmediato en las consultas del módulo de agendamiento.
    /// </summary>
    [HttpPut("{id:int}/horarios")]
    [ProducesResponseType(typeof(BarberoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActualizarHorarios(int id, [FromBody] ActualizarHorariosDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var barbero = await _barberoRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (barbero == null)
        {
            return NotFound(new { mensaje = $"No se encontró al barbero con ID #{id}." });
        }

        // Validación de rangos (HU-02 Criterio 3)
        var errorValidacion = ValidarHorarios(dto.Horarios, out var nuevosHorarios);
        if (errorValidacion != null)
        {
            return BadRequest(new { mensaje = errorValidacion });
        }

        await _barberoRepository.ReemplazarHorariosAsync(id, nuevosHorarios, cancellationToken);

        // Obtener la entidad actualizada con los nuevos horarios
        var barberoActualizado = await _barberoRepository.ObtenerPorIdAsync(id, cancellationToken);

        _logger.LogInformation("Disponibilidad actualizada para el barbero {IdBarbero}. {Count} franjas registradas.", 
            id, nuevosHorarios.Count);

        return Ok(new
        {
            mensaje = "Disponibilidad semanal actualizada. Los cambios se reflejan inmediatamente en el agendamiento.",
            barbero = MapearBarberoResponse(barberoActualizado!)
        });
    }

    /// <summary>
    /// Elimina un barbero y sus horarios asociados del sistema.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Eliminar(int id, CancellationToken cancellationToken)
    {
        var eliminado = await _barberoRepository.EliminarAsync(id, cancellationToken);
        if (!eliminado)
        {
            return NotFound(new { mensaje = $"No se encontró al barbero con ID #{id}." });
        }

        _logger.LogInformation("Barbero con ID {IdBarbero} eliminado del staff.", id);

        return Ok(new { mensaje = "Barbero eliminado exitosamente del staff." });
    }

    // ─── Helpers y Métodos de Validación ──────────────────────────────────────

    /// <summary>
    /// HU-02 Criterio 3: Valida que horaFin > horaInicio para cada franja y que el día sea válido.
    /// </summary>
    private static string? ValidarHorarios(List<HorarioDto> horariosDto, out List<HorarioDisponibilidad> entidades)
    {
        entidades = new List<HorarioDisponibilidad>();

        if (horariosDto == null || horariosDto.Count == 0)
        {
            return "Se debe especificar al menos una franja horaria de disponibilidad.";
        }

        for (int i = 0; i < horariosDto.Count; i++)
        {
            var h = horariosDto[i];

            if (!DiasValidos.Contains(h.DiaSemana))
            {
                return $"El día '{h.DiaSemana}' no es válido. Días permitidos: Lunes a Domingo.";
            }

            if (!TimeOnly.TryParse(h.HoraInicio, out var horaInicio))
            {
                return $"Formato de hora de inicio inválido ('{h.HoraInicio}') en la franja #{i + 1}. Formato requerido: HH:mm.";
            }

            if (!TimeOnly.TryParse(h.HoraFin, out var horaFin))
            {
                return $"Formato de hora de fin inválido ('{h.HoraFin}') en la franja #{i + 1}. Formato requerido: HH:mm.";
            }

            // Validación estricta Criterio 3 (hora_fin > hora_inicio)
            if (horaFin <= horaInicio)
            {
                return $"Error de rango horario en {h.DiaSemana}: La hora de fin ({h.HoraFin}) debe ser estrictamente posterior a la hora de inicio ({h.HoraInicio}).";
            }

            entidades.Add(new HorarioDisponibilidad
            {
                DiaSemana = FormatearDia(h.DiaSemana),
                HoraInicio = horaInicio,
                HoraFin = horaFin
            });
        }

        return null;
    }

    private static string FormatearDia(string dia)
    {
        var normalizado = dia.Trim();
        foreach (var d in DiasValidos)
        {
            if (string.Equals(d, normalizado, StringComparison.OrdinalIgnoreCase))
                return d;
        }
        return normalizado;
    }

    private static BarberoResponseDto MapearBarberoResponse(Barbero barbero)
    {
        return new BarberoResponseDto
        {
            IdBarbero = barbero.IdBarbero,
            Nombre = barbero.Nombre,
            Telefono = barbero.Telefono,
            TieneHorarioCargado = barbero.HorariosDisponibilidad.Count > 0,
            Horarios = barbero.HorariosDisponibilidad
                .OrderBy(h => OrdenarDia(h.DiaSemana))
                .ThenBy(h => h.HoraInicio)
                .Select(h => new HorarioResponseDto
                {
                    IdHorario = h.IdHorario,
                    IdBarbero = h.IdBarbero,
                    DiaSemana = h.DiaSemana,
                    HoraInicio = h.HoraInicio.ToString("HH:mm"),
                    HoraFin = h.HoraFin.ToString("HH:mm")
                })
                .ToList()
        };
    }

    private static int OrdenarDia(string dia) => dia.ToLowerInvariant() switch
    {
        "lunes" => 1,
        "martes" => 2,
        "miercoles" => 3,
        "jueves" => 4,
        "viernes" => 5,
        "sabado" => 6,
        "domingo" => 7,
        _ => 8
    };
}
