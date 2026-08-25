import { api } from './api';
import type { AgendarCitaDto, AgendarCitaResponse, CitaResponseDto } from '../types/cita';

export const citaService = {
  /**
   * HU-04: Agendar cita (requiere token Cliente o Administrador).
   */
  async agendarCita(dto: AgendarCitaDto): Promise<AgendarCitaResponse> {
    try {
      const response = await api.post<AgendarCitaResponse>('/citas', dto);
      return response.data;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { mensaje?: string } } };
      if (axiosErr.response?.status === 409) {
        const error = new Error(axiosErr.response.data?.mensaje ?? 'El horario seleccionado ya fue tomado por otro cliente.');
        (error as unknown as { isConflict: boolean }).isConflict = true;
        throw error;
      }
      throw new Error(axiosErr.response?.data?.mensaje ?? 'Error al agendar la cita.');
    }
  },

  async obtenerPorId(id: number): Promise<CitaResponseDto> {
    const response = await api.get<CitaResponseDto>(`/citas/${id}`);
    return response.data;
  },

  /**
   * HU-06: Obtener citas de un cliente específico (requiere token).
   */
  async obtenerPorCliente(idCliente: number): Promise<CitaResponseDto[]> {
    const response = await api.get<CitaResponseDto[]>(`/citas/cliente/${idCliente}`);
    return response.data;
  },

  /**
   * HU-06: Cancelar cita propia (requiere token Cliente).
   */
  async cancelarCita(idCita: number): Promise<{ mensaje: string; idCita: number; nuevoEstado: string }> {
    const response = await api.patch<{ mensaje: string; idCita: number; nuevoEstado: string }>(`/citas/${idCita}/cancelar`);
    return response.data;
  },

  /**
   * HU-07: Obtener citas del día para panel de Administrador con filtro por barbero (requiere token Admin).
   */
  async obtenerCitasHoy(fecha?: string, barberoId?: number): Promise<CitaResponseDto[]> {
    const queryParams = new URLSearchParams();
    if (fecha) queryParams.append('fecha', fecha);
    if (barberoId && barberoId > 0) queryParams.append('barberoId', barberoId.toString());
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get<CitaResponseDto[]>(`/citas/hoy${queryString}`);
    return response.data;
  },

  /**
   * HU-08: Actualizar estado de cita (Atendida/Cancelada) por Administrador.
   */
  async actualizarEstado(idCita: number, nuevoEstado: string): Promise<{ mensaje: string; idCita: number; nuevoEstado: string }> {
    const response = await api.patch<{ mensaje: string; idCita: number; nuevoEstado: string }>(`/citas/${idCita}/estado`, { nuevoEstado });
    return response.data;
  },
};
