using BarberLosPeluchitos.Core.Entities;

namespace BarberLosPeluchitos.Core.Interfaces;

public interface IServicioRepository
{
    Task<IEnumerable<Servicio>> ObtenerTodosAsync(CancellationToken ct = default);
    Task<Servicio?> ObtenerPorIdAsync(int idServicio, CancellationToken ct = default);
    Task GuardarAsync(Servicio servicio, CancellationToken ct = default);
}
