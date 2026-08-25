import { api } from './api';
import type { AuthResponse, LoginDto } from '../types';

/**
 * Login de Cliente: POST /api/cuentas/login
 */
export const loginCliente = async (dto: LoginDto): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/cuentas/login', dto);
  return response.data;
};

/**
 * Login de Administrador: POST /api/administradores/login
 */
export const loginAdmin = async (dto: LoginDto): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/administradores/login', dto);
  return response.data;
};
