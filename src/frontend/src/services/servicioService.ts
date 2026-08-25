import type { ServicioResponseDto } from '../types/servicio';

const API_BASE = '/api/servicios';

export const servicioService = {
  async obtenerTodos(): Promise<ServicioResponseDto[]> {
    const res = await fetch(API_BASE);
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al obtener catálogo de servicios.');
    return json;
  },

  async obtenerPorId(id: number): Promise<ServicioResponseDto> {
    const res = await fetch(`${API_BASE}/${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al obtener el servicio.');
    return json;
  },
};
