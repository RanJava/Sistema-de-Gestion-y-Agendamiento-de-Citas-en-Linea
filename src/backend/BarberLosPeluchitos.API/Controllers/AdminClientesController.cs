using BarberLosPeluchitos.Core.DTOs;
using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberLosPeluchitos.API.Controllers;

[ApiController]
[Route("api/admin/clientes")]
[Authorize(Roles = "Administrador")]
public class AdminClientesController : ControllerBase
{
    private readonly IClienteRepository _clienteRepository;
    private readonly ICitaRepository _citaRepository;
    private readonly ILogger<AdminClientesController> _logger;

    public AdminClientesController(
        IClienteRepository clienteRepository,
        ICitaRepository citaRepository,
        ILogger<AdminClientesController> logger)
    {
        _clienteRepository = clienteRepository;
        _citaRepository = citaRepository;
        _logger = logger;
    }

    /// <summary>
    /// HU-09 Criterio 1: Búsqueda paginada de clientes por nombre, teléfono o correo.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ClienteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> BuscarClientes(
        [FromQuery] string? buscar,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 10,
        CancellationToken cancellationToken = default)
    {
        var clientes = await _clienteRepository.BuscarClientesAsync(buscar, pagina, tamanoPagina, cancellationToken);
        
        var clienteDtos = new List<ClienteDto>();
        foreach (var c in clientes)
        {
            var citasCliente = await _citaRepository.ObtenerPorClienteAsync(c.IdCliente, cancellationToken);
            clienteDtos.Add(new ClienteDto
            {
                IdCliente = c.IdCliente,
                Nombre = c.Nombre,
                Telefono = c.Telefono,
                Correo = c.Correo,
                TotalCitas = citasCliente.Count()
            });
        }

        return Ok(clienteDtos);
    }

    /// <summary>
    /// HU-09 Criterios 1 y 2: Obtiene la lista paginada del historial de citas de un cliente específico.
    /// Preserva los datos snapshot (duración y precio asignados al momento de agendar la cita).
    /// </summary>
    [HttpGet("{idCliente:int}/historial")]
    [ProducesResponseType(typeof(IEnumerable<CitaResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerHistorialCliente(
        int idCliente,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 10,
        CancellationToken cancellationToken = default)
    {
        var cliente = await _clienteRepository.BuscarPorIdAsync(idCliente, cancellationToken);
        if (cliente == null)
        {
            return NotFound(new { mensaje = $"No se encontró el cliente con ID #{idCliente}." });
        }

        var citas = await _citaRepository.ObtenerHistorialClienteAsync(idCliente, pagina, tamanoPagina, cancellationToken);
        
        var response = citas.Select(c => new CitaResponseDto
        {
            IdCita = c.IdCita,
            IdCliente = c.IdCliente,
            ClienteNombre = c.Cliente?.Nombre ?? "Cliente General",
            ClienteTelefono = c.Cliente?.Telefono ?? "N/A",
            ClienteCorreo = c.Cliente?.Correo ?? "N/A",
            IdServicio = c.IdServicio,
            ServicioNombre = c.Servicio?.Nombre ?? "Servicio General",
            Duracion = c.Duracion, // Snapshot conservado de HU-04
            Precio = c.Precio,     // Snapshot conservado de HU-04
            IdTurno = c.IdTurno,
            Fecha = c.Turno != null ? c.Turno.Fecha.ToString("yyyy-MM-dd") : string.Empty,
            HoraInicio = c.Turno != null ? c.Turno.HoraInicio.ToString("HH:mm") : string.Empty,
            HoraFin = c.Turno != null ? c.Turno.HoraFin.ToString("HH:mm") : string.Empty,
            IdBarbero = c.Turno?.IdBarbero ?? 0,
            BarberoNombre = c.Turno?.Barbero?.Nombre ?? "Profesional Asignado",
            Estado = c.Estado,
            FechaHora = c.FechaHora
        });

        _logger.LogInformation("HU-09: Historial de {Count} citas consultado para el Cliente #{IdCliente} ({Nombre}).", response.Count(), idCliente, cliente.Nombre);

        return Ok(response);
    }
}
