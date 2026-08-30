using BarberLosPeluchitos.Core.Entities;

namespace BarberLosPeluchitos.Core.Interfaces;

public interface IClienteRepository
{
    Task<Cliente?> BuscarPorCorreoAsync(string correo, CancellationToken cancellationToken = default);
    Task<Cliente?> BuscarPorIdAsync(int idCliente, CancellationToken cancellationToken = default);
    Task<bool> ExisteCorreoAsync(string correo, CancellationToken cancellationToken = default);
    Task<Cliente> GuardarAsync(Cliente cliente, CancellationToken cancellationToken = default);
    Task<Cliente> ActualizarAsync(Cliente cliente, CancellationToken cancellationToken = default);
    Task<bool> BajaLogicaAsync(int idCliente, CancellationToken cancellationToken = default);

    /// <summary>
    /// HU-09 Criterio 1: Búsqueda de clientes por nombre, teléfono o correo con paginación.
    /// </summary>
    Task<IEnumerable<Cliente>> BuscarClientesAsync(string? buscar, int pagina = 1, int tamanoPagina = 10, CancellationToken cancellationToken = default);
}
