export interface ClienteDto {
  idCliente: number;
  nombre: string;
  telefono: string;
  correo: string;
  fechaRegistro?: string;
  totalCitas: number;
}
