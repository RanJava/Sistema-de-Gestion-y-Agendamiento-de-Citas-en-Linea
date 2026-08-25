import type { AgendarCitaDto, AgendarCitaResponse, CitaResponseDto } from '../types/cita';

const API_BASE = '/api/citas';

export const citaService = {
  async agendarCita(dto: AgendarCitaDto): Promise<AgendarCitaResponse> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    const json = await res.json();

    if (!res.ok) {
      // Si es 409 Conflict (Criterio 3: Concurrencia)
      if (res.status === 409) {
        const error = new Error(json.mensaje ?? 'El horario seleccionado ya fue tomado por otro cliente.');
        (error as unknown as { isConflict: boolean }).isConflict = true;
        throw error;
      }
      throw new Error(json.mensaje ?? 'Error al agendar la cita.');
    }

    return json;
  },

  async obtenerPorId(id: number): Promise<CitaResponseDto> {
    const res = await fetch(`${API_BASE}/${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al consultar la cita.');
    return json;
  },

  async obtenerPorCliente(idCliente: number): Promise<CitaResponseDto[]> {
    const res = await fetch(`${API_BASE}/cliente/${idCliente}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al consultar citas del cliente.');
    return json;
  },
};
