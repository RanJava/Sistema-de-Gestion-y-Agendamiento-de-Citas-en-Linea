using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BarberLosPeluchitos.Infrastructure.Repositories;

public class BarberoRepository : IBarberoRepository
{
    private readonly ApplicationDbContext _context;

    public BarberoRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Barbero>> ObtenerTodosAsync(CancellationToken ct = default)
    {
        return await _context.Barberos
            .Include(b => b.HorariosDisponibilidad)
            .OrderBy(b => b.Nombre)
            .ToListAsync(ct);
    }

    /// <summary>
    /// Criterio 4 HU-02: solo barberos con al menos 1 horario configurado son visibles para agendamiento.
    /// </summary>
    public async Task<IEnumerable<Barbero>> ObtenerConDisponibilidadAsync(CancellationToken ct = default)
    {
        return await _context.Barberos
            .Include(b => b.HorariosDisponibilidad)
            .Where(b => b.HorariosDisponibilidad.Any())
            .OrderBy(b => b.Nombre)
            .ToListAsync(ct);
    }

    public async Task<Barbero?> ObtenerPorIdAsync(int idBarbero, CancellationToken ct = default)
    {
        return await _context.Barberos
            .Include(b => b.HorariosDisponibilidad)
            .FirstOrDefaultAsync(b => b.IdBarbero == idBarbero, ct);
    }

    public async Task<Barbero> GuardarAsync(Barbero barbero, CancellationToken ct = default)
    {
        _context.Barberos.Add(barbero);
        await _context.SaveChangesAsync(ct);
        return barbero;
    }

    public async Task<bool> ActualizarAsync(Barbero barbero, CancellationToken ct = default)
    {
        _context.Barberos.Update(barbero);
        var rows = await _context.SaveChangesAsync(ct);
        return rows > 0;
    }

    public async Task<bool> EliminarAsync(int idBarbero, CancellationToken ct = default)
    {
        var barbero = await _context.Barberos.FindAsync(new object[] { idBarbero }, ct);
        if (barbero == null) return false;

        _context.Barberos.Remove(barbero);
        var rows = await _context.SaveChangesAsync(ct);
        return rows > 0;
    }

    public async Task<bool> EliminarHorariosAsync(int idBarbero, CancellationToken ct = default)
    {
        var horarios = await _context.HorariosDisponibilidad
            .Where(h => h.IdBarbero == idBarbero)
            .ToListAsync(ct);

        _context.HorariosDisponibilidad.RemoveRange(horarios);
        var rows = await _context.SaveChangesAsync(ct);
        return rows >= 0;
    }

    public async Task GuardarHorariosAsync(int idBarbero, IEnumerable<HorarioDisponibilidad> horarios, CancellationToken ct = default)
    {
        await _context.HorariosDisponibilidad.AddRangeAsync(horarios, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task ReemplazarHorariosAsync(int idBarbero, IEnumerable<HorarioDisponibilidad> nuevosHorarios, CancellationToken ct = default)
    {
        var horariosExistentes = await _context.HorariosDisponibilidad
            .Where(h => h.IdBarbero == idBarbero)
            .ToListAsync(ct);

        _context.HorariosDisponibilidad.RemoveRange(horariosExistentes);

        foreach (var h in nuevosHorarios)
        {
            h.IdHorario = 0;
            h.IdBarbero = idBarbero;
            _context.HorariosDisponibilidad.Add(h);
        }

        await _context.SaveChangesAsync(ct);
    }
}
