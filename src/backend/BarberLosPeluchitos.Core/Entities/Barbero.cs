namespace BarberLosPeluchitos.Core.Entities;

public class Barbero
{
    public int IdBarbero { get; set; }
    public string Nombre { get; set; } = string.Empty;

    /// <summary>
    /// Almacenado cifrado en reposo con AES-256 (Ley 164 / D.S. 1793).
    /// </summary>
    public string Telefono { get; set; } = string.Empty;

    // Relaciones de navegación
    public ICollection<HorarioDisponibilidad> HorariosDisponibilidad { get; set; } = new List<HorarioDisponibilidad>();
    public ICollection<Turno> Turnos { get; set; } = new List<Turno>();

    /// <summary>
    /// HU-02 Criterio 4 / Diagrama de Clases: Verifica si el barbero cuenta con horarios asignados.
    /// </summary>
    public bool TieneHorarioCargado() => HorariosDisponibilidad.Count > 0;
}
