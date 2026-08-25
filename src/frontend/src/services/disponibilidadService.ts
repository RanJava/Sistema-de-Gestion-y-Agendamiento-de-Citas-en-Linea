import type { DisponibilidadResponseDto, VerificarTurnoResponseDto } from '../types/turno';

const API_BASE = '/api/disponibilidad';

export const disponibilidadService = {
  async consultarDisponibilidad(idBarbero: number, fecha: string): Promise<DisponibilidadResponseDto> {
    const res = await fetch(`${API_BASE}?idBarbero=${idBarbero}&fecha=${encodeURIComponent(fecha)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al consultar disponibilidad.');
    return json;
  },

  async verificarDisponibilidad(idTurno: number): Promise<VerificarTurnoResponseDto> {
    const res = await fetch(`${API_BASE}/verificar/${idTurno}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al verificar el turno.');
    return json;
  },

  async simularReserva(idTurno: number, estado?: 'Disponible' | 'Reservado'): Promise<VerificarTurnoResponseDto> {
    const res = await fetch(`${API_BASE}/simular-reserva/${idTurno}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(estado ? { estado } : {}),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.mensaje ?? 'Error al simular reserva del turno.');
    return json;
  },
};
