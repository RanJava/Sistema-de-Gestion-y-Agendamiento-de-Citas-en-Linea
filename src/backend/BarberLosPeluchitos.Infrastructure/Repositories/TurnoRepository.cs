using BarberLosPeluchitos.Core.Entities;
using BarberLosPeluchitos.Core.Interfaces;
using BarberLosPeluchitos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BarberLosPeluchitos.Infrastructure.Repositories;

public class TurnoRepository : ITurnoRepository
{
    private readonly ApplicationDbContext _context;

    public TurnoRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Turno>> ObtenerHorariosAsync(int idBarbero, DateOnly fecha, CancellationToken ct = default)
    {
        var diaSemana = ObtenerNombreDiaSemana(fecha.DayOfWeek);

        // 1. Obtener la jornada configurada del barbero para el día de la semana
        var franjasDisponibilidad = await _context.HorariosDisponibilidad
            .Where(h => h.IdBarbero == idBarbero && h.DiaSemana.ToLower() == diaSemana.ToLower())
            .ToListAsync(ct);

        if (!franjasDisponibilidad.Any())
        {
            return Enumerable.Empty<Turno>();
        }

        // 2. Obtener turnos ya existentes en la BD para esa fecha
        var turnosExistentes = await _context.Turnos
            .Include(t => t.Barbero)
            .Where(t => t.IdBarbero == idBarbero && t.Fecha == fecha)
            .ToListAsync(ct);

        var mapaTurnos = turnosExistentes.ToDictionary(t => t.HoraInicio);
        var nuevosTurnos = new List<Turno>();

        // 3. Generar slots estándar de 30 minutos dentro de cada franja laboral
        foreach (var franja in franjasDisponibilidad)
        {
            var cursor = franja.HoraInicio;
            while (cursor < franja.HoraFin)
            {
                var finSlot = cursor.AddMinutes(30);
                if (finSlot <= cursor || finSlot > franja.HoraFin)
                {
                    finSlot = franja.HoraFin;
                }

                if (!mapaTurnos.ContainsKey(cursor))
                {
                    var nuevoTurno = new Turno
                    {
                        IdBarbero = idBarbero,
                        Fecha = fecha,
                        HoraInicio = cursor,
                        HoraFin = finSlot,
                        Estado = "Disponible"
                    };
                    nuevosTurnos.Add(nuevoTurno);
                    mapaTurnos[cursor] = nuevoTurno;
                }

                if (finSlot >= franja.HoraFin || finSlot <= cursor)
                {
                    break;
                }

                cursor = finSlot;
            }
        }

        // 4. Persistir slots generados si hay nuevos
        if (nuevosTurnos.Any())
        {
            await _context.Turnos.AddRangeAsync(nuevosTurnos, ct);
            await _context.SaveChangesAsync(ct);
        }

        // 5. Retornar todos los turnos del barbero para esa fecha ordenados por hora
        return await _context.Turnos
            .Include(t => t.Barbero)
            .Where(t => t.IdBarbero == idBarbero && t.Fecha == fecha)
            .OrderBy(t => t.HoraInicio)
            .ToListAsync(ct);
    }

    public async Task<string?> ConsultarEstadoTurnoAsync(int idTurno, CancellationToken ct = default)
    {
        return await _context.Turnos
            .Where(t => t.IdTurno == idTurno)
            .Select(t => t.Estado)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<Turno?> ObtenerPorIdAsync(int idTurno, CancellationToken ct = default)
    {
        return await _context.Turnos
            .Include(t => t.Barbero)
            .FirstOrDefaultAsync(t => t.IdTurno == idTurno, ct);
    }

    public async Task<bool> ActualizarEstadoTurnoAsync(int idTurno, string nuevoEstado, CancellationToken ct = default)
    {
        var turno = await _context.Turnos.FindAsync(new object[] { idTurno }, ct);
        if (turno == null) return false;

        turno.Estado = nuevoEstado;
        var rows = await _context.SaveChangesAsync(ct);
        return rows > 0;
    }

    private static string ObtenerNombreDiaSemana(DayOfWeek dayOfWeek) => dayOfWeek switch
    {
        DayOfWeek.Monday => "Lunes",
        DayOfWeek.Tuesday => "Martes",
        DayOfWeek.Wednesday => "Miercoles",
        DayOfWeek.Thursday => "Jueves",
        DayOfWeek.Friday => "Viernes",
        DayOfWeek.Saturday => "Sabado",
        DayOfWeek.Sunday => "Domingo",
        _ => "Lunes"
    };
}
