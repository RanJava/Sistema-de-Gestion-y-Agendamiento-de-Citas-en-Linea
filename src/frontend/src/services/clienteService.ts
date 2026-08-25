import { api } from './api';
import type { RegistroClienteDto, RegistroClienteResponse } from '../types';

export const registrarCliente = async (datos: RegistroClienteDto): Promise<RegistroClienteResponse> => {
  const response = await api.post<RegistroClienteResponse>('/cuentas/registro', datos);
  return response.data;
};

export const verificarCorreoDisponible = async (correo: string): Promise<boolean> => {
  try {
    const response = await api.get<{ disponible: boolean }>(`/cuentas/verificar-correo?correo=${encodeURIComponent(correo)}`);
    return response.data.disponible;
  } catch {
    return true; // En caso de fallo de red en la pre-verificación, dejamos que el POST valide
  }
};
