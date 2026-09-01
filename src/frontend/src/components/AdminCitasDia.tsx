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

  const [modalConfirmacion, setModalConfirmacion] = useState<{
    open: boolean;
    cita: CitaResponseDto | null;
    nuevoEstado: string | null;
  }>({ open: false, cita: null, nuevoEstado: null });

  const handleCambiarEstado = async (idCita: number, nuevoEstado: string, forzar: boolean = false) => {
    const citaActual = citas.find(c => c.idCita === idCita);

    // HU-08 Criterio 3: Si la cita ya está Cancelada y no se ha forzado explicitamente, abrir modal
    if (citaActual && citaActual.estado === 'Cancelada' && !forzar) {
      setModalConfirmacion({
        open: true,
        cita: citaActual,
        nuevoEstado
      });
      return;
    }

    setActualizando(idCita);
    setMensaje(null);
    setError(null);

    try {
      const res = await citaService.actualizarEstado(idCita, nuevoEstado, forzar);
      setMensaje(res.mensaje);
      setModalConfirmacion({ open: false, cita: null, nuevoEstado: null });
      await cargarCitas();
    } catch (err: any) {
      if (err?.response?.status === 409 && err?.response?.data?.requiereConfirmacion) {
        setModalConfirmacion({
          open: true,
          cita: citaActual || null,
          nuevoEstado
        });
      } else {
        setError(err?.response?.data?.mensaje || err?.message || 'Error al actualizar el estado de la cita.');
      }
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
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] p-6 sm:p-8 shadow-2xl relative text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-heading font-bold uppercase tracking-wider bg-[#1a1713] text-[#d97706] border border-[#d97706]/40 mb-3">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Panel de Administración • HU-07 / HU-08</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
              Citas del Día
            </h2>
            <p className="text-xs text-[#a39b8d] font-light mt-1">
              Gestiona las citas programadas: marca como Atendida, Cancelada o No asistió en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Selector de Barbero (HU-07 Criterio 3) */}
            <select
              value={selectedBarberoId}
              onChange={e => setSelectedBarberoId(e.target.value ? Number(e.target.value) : '')}
              className="px-3.5 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-xs font-semibold uppercase tracking-wider focus:border-[#d97706] outline-none cursor-pointer"
            >
              <option value="">Todos los Barberos</option>
              {barberos.map(b => (
                <option key={b.idBarbero} value={b.idBarbero}>
                  {b.nombre}
                </option>
              ))}
            </select>

            {/* Selector de Fecha (HU-07 Criterio 1) */}
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="px-3.5 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-xs font-mono focus:border-[#d97706] outline-none cursor-pointer"
            />
            <button
              onClick={cargarCitas}
              disabled={loading}
              className="p-2.5 bg-[#121212] hover:bg-[#1a1713] text-[#d97706] border border-[#38332b] hover:border-[#d97706] cursor-pointer transition-all disabled:opacity-50"
              title="Refrescar listado de citas"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Contadores / Métricas en Tarjetas Sólidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`p-4 border text-left transition-all cursor-pointer ${
              filtroEstado === 'todos'
                ? 'bg-[#1a1713] border-[#d97706] shadow-sm'
                : 'bg-[#0a0a0a] border-[#24211c] hover:border-[#38332b]'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-bold font-heading text-[#f5f1e8] block leading-none">{contadores.total}</span>
            <span className="text-[10px] text-[#8c8273] font-heading font-bold uppercase tracking-widest block mt-2">Total Citas</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Pendiente')}
            className={`p-4 border text-left transition-all cursor-pointer ${
              filtroEstado === 'Pendiente'
                ? 'bg-[#1a1713] border-[#d97706] shadow-sm'
                : 'bg-[#0a0a0a] border-[#24211c] hover:border-[#d97706]/40'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-bold font-heading text-[#d97706] block leading-none">{contadores.pendientes}</span>
            <span className="text-[10px] text-[#8c8273] font-heading font-bold uppercase tracking-widest block mt-2">Pendientes</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Atendida')}
            className={`p-4 border text-left transition-all cursor-pointer ${
              filtroEstado === 'Atendida'
                ? 'bg-[#061e14] border-[#10b981] shadow-sm'
                : 'bg-[#0a0a0a] border-[#24211c] hover:border-[#10b981]/40'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-bold font-heading text-[#6ee7b7] block leading-none">{contadores.atendidas}</span>
            <span className="text-[10px] text-[#8c8273] font-heading font-bold uppercase tracking-widest block mt-2">Atendidas</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Cancelada')}
            className={`p-4 border text-left transition-all cursor-pointer ${
              filtroEstado === 'Cancelada'
                ? 'bg-[#1f080c] border-rose-500 shadow-sm'
                : 'bg-[#0a0a0a] border-[#24211c] hover:border-rose-500/40'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-bold font-heading text-rose-400 block leading-none">{contadores.canceladas}</span>
            <span className="text-[10px] text-[#8c8273] font-heading font-bold uppercase tracking-widest block mt-2">Canceladas</span>
          </button>
        </div>
      </div>

      {/* Mensajes de Feedback */}
      {mensaje && (
        <div className="p-3.5 bg-[#061e14] border border-[#065f46] text-[#6ee7b7] text-xs flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#10b981] shrink-0" />
          <span>{mensaje}</span>
          <button onClick={() => setMensaje(null)} className="ml-auto text-[#6ee7b7] font-bold text-xs px-2 cursor-pointer">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Listado de Citas */}
      {loading ? (
        <div className="py-20 text-center text-[#a39b8d] text-sm flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
          <span>Cargando citas del {fecha}…</span>
        </div>
      ) : citasFiltradas.length === 0 ? (
        <div className="py-16 text-center bg-[#121212] border border-[#24211c] p-8 space-y-3">
          <Filter className="w-10 h-10 text-[#d97706] mx-auto opacity-60" />
          <p className="text-sm font-bold font-heading uppercase tracking-wider text-[#f5f1e8]">
            {citas.length === 0 ? 'Sin citas para esta fecha' : 'Sin resultados para el filtro seleccionado'}
          </p>
          <p className="text-xs text-[#a39b8d]">
            {citas.length === 0 ? 'Selecciona otra fecha o espera a que se agenden nuevas citas.' : 'Prueba otro filtro de estado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {citasFiltradas.map(cita => (
            <div
              key={cita.idCita}
              className="bg-[#121212] border border-[#24211c] hover:border-[#38332b] p-5 sm:p-6 shadow-xl transition-all text-left"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Info Principal */}
                <div className="flex-1 space-y-3.5">
                  <div className="flex items-center justify-between gap-3 border-b border-[#24211c] pb-3">
                    <span className="font-heading font-bold text-sm tracking-wider uppercase text-[#f5f1e8]">
                      Cita #{cita.idCita}
                    </span>
                    <span className={`px-3 py-0.5 text-xs font-heading font-bold uppercase tracking-wider border ${getEstadoBadge(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="bg-[#0a0a0a] p-3.5 border border-[#24211c] flex items-center gap-3.5 text-xs">
                    <div className="w-9 h-9 bg-[#1a1713] text-[#d97706] border border-[#d97706]/40 font-heading font-bold flex items-center justify-center text-sm shrink-0">
                      {cita.clienteNombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-heading font-bold uppercase text-[#f5f1e8] block">{cita.clienteNombre}</span>
                      <div className="flex flex-wrap items-center gap-4 text-[#a39b8d] mt-1 font-mono text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#d97706]" />
                          {cita.clienteTelefono}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#d97706]" />
                          {cita.clienteCorreo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detalles (Servicio, Barbero, Horario, Tarifa) */}
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
                      <span className="text-[10px] font-heading text-[#8c8273] uppercase tracking-wider block">Tarifa</span>
                      <span className="font-heading font-bold text-[#d97706] text-sm mt-1 block">Bs {cita.precio.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas (HU-08) */}
                <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0">
                  {cita.estado !== 'Atendida' && (
                    <button
                      onClick={() => handleCambiarEstado(cita.idCita, 'Atendida')}
                      disabled={actualizando === cita.idCita}
                      className="flex-1 lg:w-auto px-4 py-2.5 bg-[#061e14] hover:bg-[#092e1f] text-[#6ee7b7] hover:text-white border border-[#065f46] text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actualizando === cita.idCita ? (
                        <div className="w-3.5 h-3.5 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                      )}
                      <span>Atendida</span>
                    </button>
                  )}

                  {cita.estado !== 'No asistió' && cita.estado !== 'NoAsistio' && (
                    <button
                      onClick={() => handleCambiarEstado(cita.idCita, 'No asistió')}
                      disabled={actualizando === cita.idCita}
                      className="flex-1 lg:w-auto px-4 py-2.5 bg-[#1c1326] hover:bg-[#2a1b3a] text-purple-300 hover:text-purple-200 border border-[#581c87] text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <AlertTriangle className="w-4 h-4 text-purple-400" />
                      <span>No asistió</span>
                    </button>
                  )}

                  {cita.estado !== 'Cancelada' && (
                    <button
                      onClick={() => handleCambiarEstado(cita.idCita, 'Cancelada')}
                      disabled={actualizando === cita.idCita}
                      className="flex-1 lg:w-auto px-4 py-2.5 bg-[#1f080c] hover:bg-[#320e17] text-rose-300 hover:text-rose-200 border border-[#881337] text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actualizando === cita.idCita ? (
                        <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmación Explicit Forzada (HU-08 Criterio 3) */}
      {modalConfirmacion.open && modalConfirmacion.cita && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border-2 border-[#d97706] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-left">
            <div className="flex items-center gap-3 text-[#d97706]">
              <div className="p-3 bg-[#1a1713] border border-[#d97706]/40">
                <AlertTriangle className="w-6 h-6 shrink-0 text-[#d97706]" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg uppercase tracking-wider text-[#f5f1e8]">Confirmar Sobrescritura</h3>
                <p className="text-xs text-[#a39b8d] font-mono">Cita #{modalConfirmacion.cita.idCita}</p>
              </div>
            </div>

            <p className="text-xs text-[#cfc7b8] leading-relaxed bg-[#0a0a0a] p-4 border border-[#24211c]">
              Esta cita se encuentra en estado <strong className="text-rose-400 uppercase">Cancelada</strong>.
              ¿Estás seguro de que deseas sobrescribir su estado a <strong className="text-[#d97706] uppercase">'{modalConfirmacion.nuevoEstado}'</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#24211c]">
              <button
                onClick={() => setModalConfirmacion({ open: false, cita: null, nuevoEstado: null })}
                className="px-4 py-2.5 bg-[#121212] hover:bg-[#1a1713] text-[#cfc7b8] text-xs font-heading font-bold uppercase tracking-wider border border-[#38332b] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => modalConfirmacion.cita && modalConfirmacion.nuevoEstado && handleCambiarEstado(modalConfirmacion.cita.idCita, modalConfirmacion.nuevoEstado, true)}
                className="px-5 py-2.5 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] text-xs font-heading font-bold uppercase tracking-wider border border-[#d97706] transition-colors cursor-pointer"
              >
                Sí, sobrescribir (Forzar)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
