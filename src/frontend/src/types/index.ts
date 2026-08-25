export interface Cliente {
  idCliente: number;
  nombre: string;
  telefono: string;
  correo: string;
  fechaRegistro: string;
}

export interface RegistroClienteDto {
  nombre: string;
  telefono: string;
  correo: string;
  contrasena: string;
}

export interface RegistroClienteResponse {
  mensaje: string;
  cliente: Cliente;
}

export interface Barbero {
  idBarbero: number;
  nombre: string;
  telefono: string;
  horariosDisponibilidad?: HorarioDisponibilidad[];
  turnos?: Turno[];
}

export interface HorarioDisponibilidad {
  idHorario: number;
  idBarbero: number;
  diaSemana: 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado' | 'Domingo' | string;
  horaInicio: string;
  horaFin: string;
}

export interface Turno {
  idTurno: number;
  idBarbero: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'Disponible' | 'Reservado';
  barbero?: Barbero;
}

export interface Servicio {
  idServicio: number;
  nombre: string;
  duracionBase: number;
  precioBase: number;
}

export interface Cita {
  idCita: number;
  idCliente: number;
  idTurno: number;
  idServicio: number;
  fechaHora: string;
  estado: 'Pendiente' | 'Atendida' | 'Cancelada';
  duracion: number;
  precio: number;
  cliente?: Cliente;
  turno?: Turno;
  servicio?: Servicio;
}

// ─── Auth Types ────────────────────────────────────────────────────────────────

export interface AuthUser {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: 'Cliente' | 'Administrador';
}

export interface AuthResponse {
  token: string;
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: 'Cliente' | 'Administrador';
  expiracion: string;
}

export interface LoginDto {
  correo: string;
  contrasena: string;
}
