using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BarberLosPeluchitos.Infrastructure.Repositories;

public class ServicioRepository : IServicioRepository
{
    private readonly ApplicationDbContext _context;

    public ServicioRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Servicio>> ObtenerTodosAsync(CancellationToken ct = default)
    {
        return await _context.Servicios
            .OrderBy(s => s.Nombre)
            .ToListAsync(ct);
    }

    public async Task<Servicio?> ObtenerPorIdAsync(int idServicio, CancellationToken ct = default)
    {
        return await _context.Servicios.FindAsync(new object[] { idServicio }, ct);
    }

    public async Task GuardarAsync(Servicio servicio, CancellationToken ct = default)
    {
        await _context.Servicios.AddAsync(servicio, ct);
        await _context.SaveChangesAsync(ct);
    }
}
