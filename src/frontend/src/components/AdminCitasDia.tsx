import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Scissors,
  User,
  Phone,
  Mail,
  Sparkles,
  Filter,
} from 'lucide-react';
import { citaService } from '../services/citaService';
import { barberoService } from '../services/barberoService';
import type { CitaResponseDto } from '../types/cita';
import type { BarberoResponseDto } from '../types/barbero';

export const AdminCitasDia: React.FC = () => {
  const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [fecha, setFecha] = useState(getTodayString());
  const [selectedBarberoId, setSelectedBarberoId] = useState<number | ''>('');
  const [barberos, setBarberos] = useState<BarberoResponseDto[]>([]);
  const [citas, setCitas] = useState<CitaResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // 1. Cargar lista de barberos para el selector de filtro
  useEffect(() => {
    const cargarBarberos = async () => {
      try {
        const data = await barberoService.obtenerDisponibles();
        setBarberos(data);
      } catch (err) {
        console.error('Error al cargar catálogo de barberos para el filtro:', err);
      }
    };
    cargarBarberos();
  }, []);

  const cargarCitas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bId = selectedBarberoId !== '' ? Number(selectedBarberoId) : undefined;
      const data = await citaService.obtenerCitasHoy(fecha, bId);
      setCitas(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar citas del día.');
    } finally {
      setLoading(false);
    }
  }, [fecha, selectedBarberoId]);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  const handleCambiarEstado = async (idCita: number, nuevoEstado: 'Atendida' | 'Cancelada') => {
    setActualizando(idCita);
    setMensaje(null);
    try {
      const res = await citaService.actualizarEstado(idCita, nuevoEstado);
      setMensaje(res.mensaje);
      await cargarCitas();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado de la cita.');
    } finally {
      setActualizando(null);
    }
  };

  const citasFiltradas = filtroEstado === 'todos'
    ? citas
    : citas.filter(c => c.estado === filtroEstado);

  const contadores = {
    total: citas.length,
    pendientes: citas.filter(c => c.estado === 'Pendiente').length,
    atendidas: citas.filter(c => c.estado === 'Atendida').length,
    canceladas: citas.filter(c => c.estado === 'Cancelada').length,
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Atendida':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Cancelada':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Panel de Administración • HU-07 / HU-08</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Citas del Día
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gestiona las citas programadas: marca como Atendida o Cancelada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Barbero (HU-07 Criterio 3) */}
            <select
              value={selectedBarberoId}
              onChange={e => setSelectedBarberoId(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none cursor-pointer"
            >
              <option value="">Todos los Barberos</option>
              {barberos.map(b => (
                <option key={b.idBarbero} value={b.idBarbero}>
                  ✂️ {b.nombre}
                </option>
              ))}
            </select>

            {/* Selector de Fecha (HU-07 Criterio 1) */}
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none cursor-pointer"
            />
            <button
              onClick={cargarCitas}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all disabled:opacity-50"
              title="Refrescar listado de citas"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
              filtroEstado === 'todos'
                ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-2xl font-black text-white block">{contadores.total}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Pendiente')}
            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
              filtroEstado === 'Pendiente'
                ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-2xl font-black text-amber-400 block">{contadores.pendientes}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Pendientes</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Atendida')}
            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
              filtroEstado === 'Atendida'
                ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-2xl font-black text-emerald-400 block">{contadores.atendidas}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Atendidas</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Cancelada')}
            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
              filtroEstado === 'Cancelada'
                ? 'bg-rose-500/15 border-rose-500 shadow-md shadow-rose-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-2xl font-black text-rose-400 block">{contadores.canceladas}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Canceladas</span>
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensaje}</span>
          <button onClick={() => setMensaje(null)} className="ml-auto text-emerald-400 font-bold text-xs px-2 cursor-pointer">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Listado */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando citas del {fecha}…</span>
        </div>
      ) : citasFiltradas.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3">
          <Filter className="w-10 h-10 text-amber-400 mx-auto opacity-60" />
          <p className="text-sm font-bold text-white">
            {citas.length === 0 ? 'No hay citas para esta fecha' : 'Sin resultados para el filtro seleccionado'}
          </p>
          <p className="text-xs text-slate-400">
            {citas.length === 0 ? 'Selecciona otra fecha o espera a que se agenden nuevas citas.' : 'Prueba otro filtro de estado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {citasFiltradas.map(cita => (
            <div
              key={cita.idCita}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">Cita #{cita.idCita}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getEstadoBadge(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-3 text-xs">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">
                      {cita.clienteNombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-white block">{cita.clienteNombre}</span>
                      <div className="flex items-center gap-3 text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {cita.clienteTelefono}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {cita.clienteCorreo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detalles */}
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
                      <span className="text-[10px] text-slate-400 block">Tarifa</span>
                      <span className="font-black text-amber-400 mt-0.5 block">{cita.precio.toFixed(2)} Bs</span>
                    </div>
                  </div>
                </div>

                {/* Acciones (HU-08) */}
                {cita.estado === 'Pendiente' && (
                  <div className="flex lg:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleCambiarEstado(cita.idCita, 'Atendida')}
                      disabled={actualizando === cita.idCita}
                      className="flex-1 lg:w-auto px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {actualizando === cita.idCita ? (
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Atendida</span>
                    </button>
                    <button
                      onClick={() => handleCambiarEstado(cita.idCita, 'Cancelada')}
                      disabled={actualizando === cita.idCita}
                      className="flex-1 lg:w-auto px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-bold flex items-center justify-center gap-2 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {actualizando === cita.idCita ? (
                        <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>Cancelar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
