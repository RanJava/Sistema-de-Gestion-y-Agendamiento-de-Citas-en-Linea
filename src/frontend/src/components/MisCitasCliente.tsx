import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Scissors,
  User,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { citaService } from '../services/citaService';
import { useAuth } from '../contexts/AuthContext';
import type { CitaResponseDto } from '../types/cita';

export const MisCitasCliente: React.FC = () => {
  const { user } = useAuth();
  const [citas, setCitas] = useState<CitaResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarCitas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await citaService.obtenerPorCliente(user.idUsuario);
      setCitas(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar tus citas.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  const handleCancelar = async (idCita: number) => {
    setCancelando(idCita);
    setMensaje(null);
    setError(null);
    try {
      const res = await citaService.cancelarCita(idCita);
      setMensaje(res.mensaje);
      await cargarCitas();
    } catch (err: any) {
      const mensajeError = err?.response?.data?.mensaje || err?.message || 'Error al cancelar la cita.';
      setError(mensajeError);
    } finally {
      setCancelando(null);
    }
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Mis Citas • HU-06</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Historial de Citas
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Consulta tus reservas y cancela citas en estado Pendiente.
            </p>
          </div>

          <button
            onClick={cargarCitas}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensaje}</span>
          <button onClick={() => setMensaje(null)} className="ml-auto text-emerald-400 font-bold text-xs px-2">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando tus citas…</span>
        </div>
      ) : citas.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3">
          <Receipt className="w-10 h-10 text-amber-400 mx-auto opacity-60" />
          <p className="text-sm font-bold text-white">No tienes citas registradas</p>
          <p className="text-xs text-slate-400">Agenda tu primera cita desde la pestaña "Agendar Cita".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map(cita => (
            <div
              key={cita.idCita}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Info Principal */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">Cita #{cita.idCita}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getEstadoBadge(cita.estado)}`}>
                      {cita.estado}
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
                      <span className="text-[10px] text-slate-400 block">Fecha</span>
                      <span className="font-bold text-white mt-0.5 block">{cita.fecha}</span>
                    </div>
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Horario</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {cita.horaInicio} – {cita.horaFin}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>⏱️ {cita.duracion} min</span>
                    <span className="font-black text-amber-400">{cita.precio.toFixed(2)} Bs</span>
                  </div>
                </div>

                {/* Acción Cancelar */}
                {cita.estado === 'Pendiente' && (
                  <button
                    onClick={() => handleCancelar(cita.idCita)}
                    disabled={cancelando === cita.idCita}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-bold flex items-center gap-2 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {cancelando === cita.idCita ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        <span>Cancelando…</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Cancelar Cita</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
