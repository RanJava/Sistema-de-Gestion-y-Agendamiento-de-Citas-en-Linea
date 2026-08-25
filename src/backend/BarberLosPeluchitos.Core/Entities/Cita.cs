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

    /// <summary>
    /// HU-06 Criterios 1 y 3: Verifica si la cita es cancelable (sólo en estado 'Pendiente').
    /// </summary>
    public bool PuedeCancelar() => string.Equals(Estado, "Pendiente", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// HU-06 Criterios 1 y 3 / Diagrama de Estados: Cancela la cita y libera de forma atómica el turno asociado.
    /// Lanza excepción de negocio si la cita ya fue marcada como 'Atendida' o 'Cancelada'.
    /// </summary>
    public void Cancelar(Turno? turno)
    {
        if (string.Equals(Estado, "Atendida", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("CitaAtendidaNoCancelable");
        }

        if (string.Equals(Estado, "Cancelada", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("CitaYaCancelada");
        }

        Estado = "Cancelada";

        if (turno != null)
        {
            turno.Estado = "Disponible";
        }
    }
}
