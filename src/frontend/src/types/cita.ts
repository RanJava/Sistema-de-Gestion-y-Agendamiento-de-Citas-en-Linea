export interface AgendarCitaDto {
  idCliente: number;
  idServicio: number;
  idTurno: number;
}

export interface CitaResponseDto {
  idCita: number;
  idCliente: number;
  clienteNombre: string;
  clienteCorreo: string;
  clienteTelefono: string;
  idServicio: number;
  servicioNombre: string;
  duracion: number;
  precio: number;
  idTurno: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  idBarbero: number;
  barberoNombre: string;
  estado: string; // 'Pendiente', 'Atendida', 'Cancelada'
  fechaHora: string;
}

export interface AgendarCitaResponse {
  mensaje: string;
  cita: CitaResponseDto;
}
