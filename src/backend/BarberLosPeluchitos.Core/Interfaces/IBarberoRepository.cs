using BarberLosPeluchitos.Core.Entities;

namespace BarberLosPeluchitos.Core.Interfaces;

public interface IBarberoRepository
{
    /// <summary>Retorna todos los barberos con sus horarios de disponibilidad.</summary>
    Task<IEnumerable<Barbero>> ObtenerTodosAsync(CancellationToken ct = default);

    /// <summary>Retorna solo barberos que tienen al menos un horario cargado (Criterio 4 HU-02).</summary>
    Task<IEnumerable<Barbero>> ObtenerConDisponibilidadAsync(CancellationToken ct = default);

    Task<Barbero?> ObtenerPorIdAsync(int idBarbero, CancellationToken ct = default);

    Task<Barbero> GuardarAsync(Barbero barbero, CancellationToken ct = default);

    Task<bool> ActualizarAsync(Barbero barbero, CancellationToken ct = default);

    Task<bool> EliminarAsync(int idBarbero, CancellationToken ct = default);

    Task<bool> EliminarHorariosAsync(int idBarbero, CancellationToken ct = default);

    Task GuardarHorariosAsync(int idBarbero, IEnumerable<HorarioDisponibilidad> horarios, CancellationToken ct = default);

    Task ReemplazarHorariosAsync(int idBarbero, IEnumerable<HorarioDisponibilidad> nuevosHorarios, CancellationToken ct = default);
}
