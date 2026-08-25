using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BarberLosPeluchitos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiciosController : ControllerBase
{
    private readonly IServicioRepository _servicioRepository;

    public ServiciosController(IServicioRepository servicioRepository)
    {
        _servicioRepository = servicioRepository;
    }

    /// <summary>
    /// HU-04 Paso 1: Retorna el catálogo de servicios de barbería con su duración base y precio de referencia.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ServicioResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerTodos(CancellationToken cancellationToken)
    {
        var servicios = await _servicioRepository.ObtenerTodosAsync(cancellationToken);
        var dtos = servicios.Select(s => new ServicioResponseDto
        {
            IdServicio = s.IdServicio,
            Nombre = s.Nombre,
            DuracionBase = s.DuracionBase,
            PrecioBase = s.PrecioBase
        });

        return Ok(dtos);
    }

    /// <summary>
    /// Retorna un servicio por su identificador.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ServicioResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var s = await _servicioRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (s == null)
        {
            return NotFound(new { mensaje = $"No se encontró el servicio con ID #{id}." });
        }

        return Ok(new ServicioResponseDto
        {
            IdServicio = s.IdServicio,
            Nombre = s.Nombre,
            DuracionBase = s.DuracionBase,
            PrecioBase = s.PrecioBase
        });
    }
}
