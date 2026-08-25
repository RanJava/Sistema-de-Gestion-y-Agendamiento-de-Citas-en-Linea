namespace BarberLosPeluchitos.Core.Entities;

public class Cita
{
    public int IdCita { get; set; }
    public int IdCliente { get; set; }
    public int IdTurno { get; set; }
    public int IdServicio { get; set; }
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
    public string Estado { get; set; } = "Pendiente"; // 'Pendiente', 'Atendida', 'Cancelada'
    public int Duracion { get; set; }
    public decimal Precio { get; set; }

    // Relaciones de navegación
    public Cliente Cliente { get; set; } = null!;
    public Turno Turno { get; set; } = null!;
    public Servicio Servicio { get; set; } = null!;

    /// <summary>
    /// HU-04 Criterio 4 / RN-04 / Diagrama de Clases: Calcula y almacena el snapshot histórico
    /// de duración y precio vigentes del servicio al momento de la reserva.
    /// </summary>
    public void CalcularDuracionPrecio(Servicio servicio)
    {
        Duracion = servicio.DuracionBase;
        Precio = servicio.PrecioBase;
    }

    /// <summary>
    /// HU-04 Criterio 4 / Diagrama de Clases: Confirma la cita asignando el estado inicial 'Pendiente'
    /// y estampando la fecha y hora de la transacción.
    /// </summary>
    public bool Confirmar()
    {
        Estado = "Pendiente";
        FechaHora = DateTime.UtcNow;
        return true;
    }
}
