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

    public async Task<IEnumerable<Cliente>> BuscarClientesAsync(string? buscar, int pagina = 1, int tamanoPagina = 10, CancellationToken cancellationToken = default)
    {
        var query = _context.Clientes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var term = buscar.Trim().ToLower();
            query = query.Where(c => c.Nombre.ToLower().Contains(term) ||
                                     c.Telefono.Contains(term) ||
                                     c.Correo.ToLower().Contains(term));
        }

        pagina = Math.Max(1, pagina);
        tamanoPagina = Math.Clamp(tamanoPagina, 1, 50);

        return await query
            .OrderBy(c => c.Nombre)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .ToListAsync(cancellationToken);
    }
}
