import type { BarberoResponseDto, RegistrarBarberoDto, ActualizarHorariosDto } from '../types/barbero';

const API_BASE = '/api/barberos';

export const barberoService = {
  async obtenerTodos(): Promise<BarberoResponseDto[]> {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Error al obtener el listado de barberos.');
    return res.json();
  },

  async obtenerDisponibles(): Promise<BarberoResponseDto[]> {
    const res = await fetch(`${API_BASE}/disponibles`);
    if (!res.ok) throw new Error('Error al obtener barberos disponibles.');
    return res.json();
  },

  async registrar(data: RegistrarBarberoDto): Promise<{ mensaje: string; barbero: BarberoResponseDto }> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al registrar el barbero.');
    return json;
  },

  async actualizarDatos(id: number, nombre: string, telefono: string): Promise<{ mensaje: string; barbero: BarberoResponseDto }> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al actualizar los datos del barbero.');
    return json;
  },

  async actualizarHorarios(id: number, data: ActualizarHorariosDto): Promise<{ mensaje: string; barbero: BarberoResponseDto }> {
    const res = await fetch(`${API_BASE}/${id}/horarios`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al actualizar los horarios.');
    return json;
  },

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al eliminar el barbero.');
    return json;
  },
};
