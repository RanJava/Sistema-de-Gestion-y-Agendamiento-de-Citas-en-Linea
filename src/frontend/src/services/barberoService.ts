import { api } from './api';
import type { BarberoResponseDto, RegistrarBarberoDto, ActualizarHorariosDto } from '../types/barbero';

export const barberoService = {
  async obtenerTodos(): Promise<BarberoResponseDto[]> {
    const response = await api.get<BarberoResponseDto[]>('/barberos');
    return response.data;
  },

  async obtenerDisponibles(): Promise<BarberoResponseDto[]> {
    const response = await api.get<BarberoResponseDto[]>('/barberos/disponibles');
    return response.data;
  },

  /**
   * HU-02: Registrar barbero (requiere token Administrador).
   */
  async registrar(data: RegistrarBarberoDto): Promise<{ mensaje: string; barbero: BarberoResponseDto }> {
    const response = await api.post<{ mensaje: string; barbero: BarberoResponseDto }>('/barberos', data);
    return response.data;
  },

  async actualizarDatos(id: number, nombre: string, telefono: string): Promise<{ mensaje: string; barbero: BarberoResponseDto }> {
    const response = await api.put<{ mensaje: string; barbero: BarberoResponseDto }>(`/barberos/${id}`, { nombre, telefono });
    return response.data;
  },

  async actualizarHorarios(id: number, data: ActualizarHorariosDto): Promise<{ mensaje: string; barbero: BarberoResponseDto }> {
    const response = await api.put<{ mensaje: string; barbero: BarberoResponseDto }>(`/barberos/${id}/horarios`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const response = await api.delete<{ mensaje: string }>(`/barberos/${id}`);
    return response.data;
  },
};
