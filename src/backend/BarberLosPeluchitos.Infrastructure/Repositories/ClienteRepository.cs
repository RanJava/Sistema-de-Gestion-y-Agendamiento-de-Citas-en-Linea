using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BarberLosPeluchitos.Infrastructure.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly ApplicationDbContext _context;

    public ClienteRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Cliente?> BuscarPorCorreoAsync(string correo, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = correo.Trim().ToLowerInvariant();
        return await _context.Clientes
            .FirstOrDefaultAsync(c => c.Correo.ToLower() == normalizedEmail, cancellationToken);
    }

    public async Task<Cliente?> BuscarPorIdAsync(int idCliente, CancellationToken cancellationToken = default)
    {
        return await _context.Clientes
            .FindAsync([idCliente], cancellationToken);
    }

    public async Task<bool> ExisteCorreoAsync(string correo, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = correo.Trim().ToLowerInvariant();
        return await _context.Clientes
            .AnyAsync(c => c.Correo.ToLower() == normalizedEmail, cancellationToken);
    }

    public async Task<Cliente> GuardarAsync(Cliente cliente, CancellationToken cancellationToken = default)
    {
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync(cancellationToken);
        return cliente;
    }
}
