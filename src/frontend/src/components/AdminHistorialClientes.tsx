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
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Atendida':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Cancelada':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'No asistió':
      case 'NoAsistio':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Release 2 • HU-09</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Historial de Citas por Cliente
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Busca clientes por nombre o teléfono para explorar su historial completo de reservas y precios snapshot.
            </p>
          </div>
        </div>

        {/* Buscador */}
        <form onSubmit={handleSearchSubmit} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={termino}
              onChange={e => setTermino(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={loadingClientes}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingClientes ? 'Buscando…' : 'Buscar'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Contenido Principal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Clientes */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 backdrop-blur-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Clientes Encontrados ({clientes.length})
          </h3>

          {loadingClientes ? (
            <div className="py-10 text-center text-xs text-slate-400">Cargando lista de clientes…</div>
          ) : clientes.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 p-4">
              No se encontraron clientes con el término buscado.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {clientes.map(c => {
                const isSelected = clienteSeleccionado?.idCliente === c.idCliente;
                return (
                  <button
                    key={c.idCliente}
                    onClick={() => setClienteSeleccionado(c)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white text-xs block truncate">{c.nombre}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-amber-400" />
                          {c.telefono}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-amber-400 translate-x-1' : 'text-slate-600'}`} />
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
              {/* Tarjeta de Perfil */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                    {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">{clienteSeleccionado.nombre}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        {clienteSeleccionado.telefono}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        {clienteSeleccionado.correo}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-center shrink-0">
                  <span className="text-xl font-black text-amber-400 block">{historial.length}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Citas</span>
                </div>
              </div>

              {/* Listado del Historial (HU-09 Criterio 2: sin historial disponible cuando esté vacío) */}
              {loadingHistorial ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>Cargando historial del cliente…</span>
                </div>
              ) : historial.length === 0 ? (
                <div className="py-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3 p-6">
                  <Receipt className="w-10 h-10 text-amber-400 mx-auto opacity-60" />
                  <p className="text-sm font-bold text-white">Sin historial disponible</p>
                  <p className="text-xs text-slate-400">Este cliente aún no ha registrado citas previas en el sistema.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historial.map(cita => (
                    <div
                      key={cita.idCita}
                      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl space-y-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Cita #{cita.idCita}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getEstadoBadge(cita.estado)}`}>
                            {cita.estado}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          {cita.fecha}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Servicio</span>
                          <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                            <Scissors className="w-3 h-3 text-amber-400" />
                            {cita.servicioNombre}
                          </span>
                        </div>
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Barbero</span>
                          <span className="font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" />
                            {cita.barberoNombre}
                          </span>
                        </div>
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Horario</span>
                          <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {cita.horaInicio} – {cita.horaFin}
                          </span>
                        </div>
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Tarifa Snapshot</span>
                          <span className="font-black text-amber-400 mt-0.5 block">{cita.precio.toFixed(2)} Bs</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-2 p-6">
              <UserCheck className="w-10 h-10 text-amber-400 mx-auto opacity-50" />
              <p className="text-sm font-bold text-white">Selecciona un cliente</p>
              <p className="text-xs text-slate-400">Selecciona un cliente de la lista de la izquierda para ver su historial.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
