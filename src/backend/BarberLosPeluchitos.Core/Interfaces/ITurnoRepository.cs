using BarberLosPeluchitos.Core.Entities;

namespace BarberLosPeluchitos.Core.Interfaces;

public interface ITurnoRepository
{
    /// <summary>
    /// HU-03 Criterio 1 / Diagrama de Clases: Obtiene los turnos para un barbero en una fecha específica,
    /// asegurando la generación de slots de 30 minutos según la jornada de HorarioDisponibilidad configurada.
    /// </summary>
    Task<IEnumerable<Turno>> ObtenerHorariosAsync(int idBarbero, DateOnly fecha, CancellationToken ct = default);

    /// <summary>
    /// HU-03 Criterio 3 / Diagrama de Clases: Consulta el estado actual de un turno en la base de datos.
    /// </summary>
    Task<string?> ConsultarEstadoTurnoAsync(int idTurno, CancellationToken ct = default);

    Task<Turno?> ObtenerPorIdAsync(int idTurno, CancellationToken ct = default);

    Task<bool> ActualizarEstadoTurnoAsync(int idTurno, string nuevoEstado, CancellationToken ct = default);
}
