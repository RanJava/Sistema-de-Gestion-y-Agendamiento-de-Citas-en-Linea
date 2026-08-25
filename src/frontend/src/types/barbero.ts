export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] as const;
export type DiaSemana = typeof DIAS_SEMANA[number];

export interface HorarioDto {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

export interface RegistrarBarberoDto {
  nombre: string;
  telefono: string;
  horarios: HorarioDto[];
}

export interface ActualizarHorariosDto {
  horarios: HorarioDto[];
}

export interface HorarioResponseDto {
  idHorario: number;
  idBarbero: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

export interface BarberoResponseDto {
  idBarbero: number;
  nombre: string;
  telefono: string;
  tieneHorarioCargado: boolean;
  horarios: HorarioResponseDto[];
}
