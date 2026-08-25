import { api } from './api';
import type { ClienteDto } from '../types/cliente';
import type { CitaResponseDto } from '../types/cita';
import type { RegistroClienteDto, RegistroClienteResponse } from '../types';

/**
 * HU-01: Registro de un nuevo cliente (POST /api/cuentas/registro).
 */
export async function registrarCliente(dto: RegistroClienteDto): Promise<RegistroClienteResponse> {
  const response = await api.post<RegistroClienteResponse>('/cuentas/registro', dto);
  return response.data;
}

export const clienteService = {
  registrarCliente,

  /**
   * HU-09 Criterio 1: Búsqueda paginada de clientes por nombre o teléfono.
   */
  async buscarClientes(buscar?: string, pagina: number = 1, tamanoPagina: number = 10): Promise<ClienteDto[]> {
    const params = new URLSearchParams();
    if (buscar) params.append('buscar', buscar);
    params.append('pagina', pagina.toString());
    params.append('tamanoPagina', tamanoPagina.toString());

    const response = await api.get<ClienteDto[]>(`/admin/clientes?${params.toString()}`);
    return response.data;
  },

  /**
   * HU-09 Criterios 1 y 2: Obtener historial paginado de citas pasadas de un cliente.
   */
  async obtenerHistorialCliente(idCliente: number, pagina: number = 1, tamanoPagina: number = 10): Promise<CitaResponseDto[]> {
    const response = await api.get<CitaResponseDto[]>(`/admin/clientes/${idCliente}/historial?pagina=${pagina}&tamanoPagina=${tamanoPagina}`);
    return response.data;
  },
};
