using BarberLosPeluchitos.Core.Entities;

namespace BarberLosPeluchitos.Core.Interfaces;

public interface IClienteRepository
{
    Task<Cliente?> BuscarPorCorreoAsync(string correo, CancellationToken cancellationToken = default);
    Task<Cliente?> BuscarPorIdAsync(int idCliente, CancellationToken cancellationToken = default);
    Task<bool> ExisteCorreoAsync(string correo, CancellationToken cancellationToken = default);
    Task<Cliente> GuardarAsync(Cliente cliente, CancellationToken cancellationToken = default);
}
