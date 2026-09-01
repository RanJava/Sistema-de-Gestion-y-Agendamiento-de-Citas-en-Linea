import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  User,
  History,
  Phone,
  Mail,
  Calendar,
  Clock,
  Scissors,
  Receipt,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  ShieldOff,
} from 'lucide-react';
import { clienteService } from '../services/clienteService';
import type { ClienteDto } from '../types/cliente';
import type { CitaResponseDto } from '../types/cita';

export const AdminHistorialClientes: React.FC = () => {
  const [termino, setTermino] = useState('');
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null);
  const [historial, setHistorial] = useState<CitaResponseDto[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarClientes = useCallback(async (query?: string) => {
    setLoadingClientes(true);
    setError(null);
    try {
      const data = await clienteService.buscarClientes(query);
      setClientes(data);
      if (data.length > 0 && !clienteSeleccionado) {
        setClienteSeleccionado(data[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || err?.message || 'Error al buscar clientes.');
    } finally {
      setLoadingClientes(false);
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    buscarClientes();
  }, []);

  const cargarHistorial = useCallback(async (idCliente: number) => {
    setLoadingHistorial(true);
    setError(null);
    try {
      const data = await clienteService.obtenerHistorialCliente(idCliente);
      setHistorial(data);
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || err?.message || 'Error al cargar el historial del cliente.');
    } finally {
      setLoadingHistorial(false);
    }
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      cargarHistorial(clienteSeleccionado.idCliente);
    }
  }, [clienteSeleccionado, cargarHistorial]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buscarClientes(termino);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-[#1a1713] text-[#d97706] border-[#854d0e]';
      case 'Atendida':
        return 'bg-[#061e14] text-[#6ee7b7] border-[#065f46]';
      case 'Cancelada':
        return 'bg-[#1f080c] text-rose-300 border-[#881337]';
      case 'No asistió':
      case 'NoAsistio':
        return 'bg-[#1c1326] text-purple-300 border-[#581c87]';
      default:
        return 'bg-[#121212] text-[#a39b8d] border-[#38332b]';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] p-6 sm:p-8 shadow-2xl relative text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-heading font-bold uppercase tracking-wider bg-[#1a1713] text-[#d97706] border border-[#d97706]/40 mb-3">
              <History className="w-3.5 h-3.5" />
              <span>Release 2 • HU-09</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
              Historial de Citas por Cliente
            </h2>
            <p className="text-xs text-[#a39b8d] font-light mt-1">
              Busca clientes por nombre o teléfono para explorar su historial completo de reservas y tarifas snapshot registradas.
            </p>
          </div>
        </div>

        {/* Buscador */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono del cliente..."
              value={termino}
              onChange={e => setTermino(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-xs focus:border-[#d97706] outline-none transition-all placeholder:text-[#736a5c]"
            />
          </div>
          <button
            type="submit"
            disabled={loadingClientes}
            className="px-6 py-2.5 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] text-xs font-heading font-bold uppercase tracking-wider border border-[#d97706] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {loadingClientes ? 'Buscando…' : 'Buscar Cliente'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Contenido Principal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Clientes Encontrados */}
        <div className="bg-[#121212] border border-[#24211c] p-4 space-y-3 text-left shadow-xl">
          <div className="flex items-center justify-between border-b border-[#24211c] pb-2.5 px-1">
            <h3 className="text-xs font-heading font-bold text-[#d4ccbd] uppercase tracking-wider">
              Clientes ({clientes.length})
            </h3>
            <span className="text-[10px] text-[#8c8273] font-mono">SELECCIONA</span>
          </div>

          {loadingClientes ? (
            <div className="py-12 text-center text-xs text-[#a39b8d]">Cargando lista de clientes…</div>
          ) : clientes.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#8c8273] bg-[#0a0a0a] border border-dashed border-[#24211c] p-4">
              No se encontraron clientes con el término buscado.
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {clientes.map(c => {
                const isSelected = clienteSeleccionado?.idCliente === c.idCliente;
                return (
                  <button
                    key={c.idCliente}
                    onClick={() => setClienteSeleccionado(c)}
                    className={`w-full text-left p-3 border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1a1713] border-l-4 border-l-[#d97706] border-[#38332b]'
                        : 'bg-[#0a0a0a] border-[#24211c] hover:border-[#38332b]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 border font-heading font-bold text-xs flex items-center justify-center shrink-0 ${
                        c.activo
                          ? 'bg-[#1a1713] text-[#d97706] border-[#d97706]/40'
                          : 'bg-[#1f080c] text-rose-400 border-[#881337]/50'
                      }`}>
                        {c.activo ? c.nombre.charAt(0).toUpperCase() : <ShieldOff className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-[#f5f1e8] text-xs uppercase block truncate">{c.nombre}</span>
                          {!c.activo && (
                            <span className="px-1.5 py-0.5 bg-[#1f080c] text-rose-300 border border-[#881337] text-[9px] font-heading font-bold uppercase tracking-wider shrink-0">
                              ANONIMIZADO
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#a39b8d] flex items-center gap-1.5 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-[#d97706]" />
                          {c.activo ? c.telefono : '—'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-[#d97706] translate-x-1' : 'text-[#736a5c]'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Perfil e Historial del Cliente Seleccionado */}
        <div className="lg:col-span-2 space-y-4">
          {clienteSeleccionado ? (
            <>
              {/* Tarjeta de Perfil Resumido */}
              <div className="bg-[#121212] border border-[#24211c] p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1a1713] text-[#d97706] border-2 border-[#d97706] font-heading font-bold text-lg flex items-center justify-center shrink-0">
                    {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-bold uppercase text-[#f5f1e8]">{clienteSeleccionado.nombre}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#a39b8d] mt-1 font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#d97706]" />
                        {clienteSeleccionado.telefono}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#d97706]" />
                        {clienteSeleccionado.correo}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] p-3 border border-[#24211c] text-center shrink-0 min-w-[100px]">
                  <span className="text-2xl font-heading font-bold text-[#d97706] block leading-none">{historial.length}</span>
                  <span className="text-[10px] text-[#8c8273] font-heading uppercase tracking-wider block mt-1">Citas Totales</span>
                </div>
              </div>

              {/* Listado del Historial */}
              {loadingHistorial ? (
                <div className="py-16 text-center text-[#a39b8d] text-xs flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
                  <span>Cargando historial del cliente…</span>
                </div>
              ) : historial.length === 0 ? (
                <div className="py-16 text-center bg-[#121212] border border-dashed border-[#24211c] p-8 space-y-3">
                  <Receipt className="w-10 h-10 text-[#d97706] mx-auto opacity-60" />
                  <p className="text-sm font-heading font-bold uppercase tracking-wider text-[#f5f1e8]">Sin historial disponible</p>
                  <p className="text-xs text-[#a39b8d]">Este cliente aún no ha registrado citas previas en el sistema.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historial.map(cita => (
                    <div
                      key={cita.idCita}
                      className="bg-[#121212] border border-[#24211c] p-4 sm:p-5 shadow-lg space-y-3 hover:border-[#38332b] transition-all text-left"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-[#24211c] pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#f5f1e8]">Cita #{cita.idCita}</span>
                          <span className={`px-2.5 py-0.5 text-[10px] font-heading font-bold uppercase tracking-wider border ${getEstadoBadge(cita.estado)}`}>
                            {cita.estado}
                          </span>
                        </div>
                        <span className="text-xs text-[#a39b8d] font-mono flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#d97706]" />
                          {cita.fecha}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                          <span className="text-[10px] font-heading text-[#8c8273] uppercase tracking-wider block">Servicio</span>
                          <span className="font-heading font-bold text-[#f5f1e8] flex items-center gap-1.5 mt-1">
                            <Scissors className="w-3 h-3 text-[#d97706]" />
                            {cita.servicioNombre}
                          </span>
                        </div>
                        <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                          <span className="text-[10px] font-heading text-[#8c8273] uppercase tracking-wider block">Maestro Barbero</span>
                          <span className="font-heading font-bold text-[#d97706] flex items-center gap-1.5 mt-1">
                            <User className="w-3 h-3" />
                            {cita.barberoNombre}
                          </span>
                        </div>
                        <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                          <span className="text-[10px] font-heading text-[#8c8273] uppercase tracking-wider block">Horario</span>
                          <span className="font-heading font-bold text-[#10b981] flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3" />
                            {cita.horaInicio} – {cita.horaFin}
                          </span>
                        </div>
                        <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                          <span className="text-[10px] font-heading text-[#8c8273] uppercase tracking-wider block">Tarifa Snapshot</span>
                          <span className="font-heading font-bold text-[#d97706] text-sm mt-1 block">Bs {cita.precio.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center bg-[#121212] border border-[#24211c] p-8 space-y-2">
              <UserCheck className="w-10 h-10 text-[#d97706] mx-auto opacity-50" />
              <p className="text-sm font-heading font-bold uppercase tracking-wider text-[#f5f1e8]">Selecciona un cliente</p>
              <p className="text-xs text-[#a39b8d]">Elige un cliente de la lista de la izquierda para inspeccionar su histórico de reservas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
