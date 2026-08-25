export interface TurnoResponseDto {
  idTurno: number;
  idBarbero: number;
  barberoNombre: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  estado: 'Disponible' | 'Reservado' | string;
  estaDisponible: boolean;
  esPasado: boolean;
}

export interface DisponibilidadResponseDto {
  idBarbero: number;
  barberoNombre: string;
  fecha: string;
  diaSemana: string;
  tieneJornadaLaboral: boolean;
  totalTurnosLibres: number;
  mensaje: string;
  turnos: TurnoResponseDto[];
}

export interface VerificarTurnoResponseDto {
  idTurno: number;
  estaDisponible: boolean;
  estado: string;
  mensaje: string;
  turno?: TurnoResponseDto;
}
