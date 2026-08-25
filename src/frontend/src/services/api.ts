import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export interface HealthCheckResponse {
  status: string;
  system: string;
  timestamp: string;
}

export const checkApiHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await api.get<HealthCheckResponse>('/health');
    return response.data;
  } catch (primaryError) {
    // Fallback directo a puertos alternativos de desarrollo si el proxy o baseURL primario fallan
    try {
      const fallbackPort5276 = await axios.get<HealthCheckResponse>('http://localhost:5276/api/health', { timeout: 3000 });
      return fallbackPort5276.data;
    } catch {
      try {
        const fallbackRelative = await axios.get<HealthCheckResponse>('/api/health', { timeout: 3000 });
        return fallbackRelative.data;
      } catch {
        throw primaryError;
      }
    }
  }
};
