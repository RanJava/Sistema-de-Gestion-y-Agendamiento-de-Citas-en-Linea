using System.ComponentModel.DataAnnotations;

namespace BarberLosPeluchitos.Core.DTOs;

public class AgendarCitaDto
{
    [Required(ErrorMessage = "El identificador del cliente es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "Identificador de cliente inválido.")]
    public int IdCliente { get; set; }

    [Required(ErrorMessage = "El identificador del servicio es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "Identificador de servicio inválido.")]
    public int IdServicio { get; set; }

    [Required(ErrorMessage = "El identificador del turno es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "Identificador de turno inválido.")]
    public int IdTurno { get; set; }
}

public class CitaResponseDto
{
    public int IdCita { get; set; }
    public int IdCliente { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public string ClienteCorreo { get; set; } = string.Empty;
    public string ClienteTelefono { get; set; } = string.Empty;

    public int IdServicio { get; set; }
    public string ServicioNombre { get; set; } = string.Empty;
    public int Duracion { get; set; }
    public decimal Precio { get; set; }

    public int IdTurno { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public string HoraInicio { get; set; } = string.Empty;
    public string HoraFin { get; set; } = string.Empty;

    public int IdBarbero { get; set; }
    public string BarberoNombre { get; set; } = string.Empty;

    public string Estado { get; set; } = "Pendiente";
    public DateTime FechaHora { get; set; }
}

public class ServicioResponseDto
{
    public int IdServicio { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int DuracionBase { get; set; }
    public decimal PrecioBase { get; set; }
}
