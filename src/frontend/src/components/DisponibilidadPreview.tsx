import React, { useState, useEffect, useCallback } from 'react';
import { Scissors, Calendar, Clock, RefreshCw, AlertCircle, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';
import { barberoService } from '../services/barberoService';
import type { BarberoResponseDto } from '../types/barbero';

interface DisponibilidadPreviewProps {
  onRefreshRequested?: () => void;
}

export const DisponibilidadPreview: React.FC<DisponibilidadPreviewProps> = () => {
  const [barberosDisponibles, setBarberosDisponibles] = useState<BarberoResponseDto[]>([]);
  const [todosLosBarberos, setTodosLosBarberos] = useState<BarberoResponseDto[]>([]);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [disponibles, todos] = await Promise.all([
        barberoService.obtenerDisponibles(),
        barberoService.obtenerTodos(),
      ]);
      setBarberosDisponibles(disponibles);
      setTodosLosBarberos(todos);
      if (disponibles.length > 0 && !barberoSeleccionado) {
        setBarberoSeleccionado(disponibles[0].idBarbero);
      }
    } catch {
      setError('Error al consultar disponibilidad de barberos.');
    } finally {
      setLoading(false);
    }
  }, [barberoSeleccionado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const barberoActivo = barberosDisponibles.find(b => b.idBarbero === barberoSeleccionado);
  const barberosOcultos = todosLosBarberos.filter(b => !b.tieneHorarioCargado);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Módulo de Agendamiento • Vista Pública de Cliente</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Selección de Barbero y Horarios</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Demostración en vivo de los Criterios 2 y 4 de la HU-02.
          </p>
        </div>

        <button
          onClick={cargar}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refrescar Disponibilidad</span>
        </button>
      </div>

      {/* Alerta de Criterio 4 */}
      <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-emerald-300">Criterio 4 (Filtro RN-06):</span>{' '}
            <span className="text-slate-300">
              Solo se muestran barberos con al menos una franja horaria configurada.
            </span>
            {barberosOcultos.length > 0 ? (
              <div className="mt-2 text-amber-300 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{barberosOcultos.length}</strong> barbero(s) sin horario ocultos para agendamiento:{' '}
                  {barberosOcultos.map(b => b.nombre).join(', ')}.
                </span>
              </div>
            ) : (
              <p className="mt-1 text-slate-400">
                Todos los barberos registrados tienen horarios y están habilitados para reserva.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Consultando barberos disponibles en tiempo real…</span>
        </div>
      ) : error ? (
        <div className="my-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : barberosDisponibles.length === 0 ? (
        <div className="my-8 p-8 text-center rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-slate-400 text-sm">
          <Scissors className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="font-medium text-slate-300">No hay barberos con horarios disponibles actualmente.</p>
          <p className="text-xs text-slate-500 mt-1">
            Ve a la pestaña <strong>"Gestión de Staff"</strong> para registrar barberos y configurar sus franjas horarias.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Selector de barberos disponibles */}
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              1. Selecciona un Profesional:
            </label>
            <div className="space-y-2">
              {barberosDisponibles.map(b => (
                <button
                  key={b.idBarbero}
                  onClick={() => setBarberoSeleccionado(b.idBarbero)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                    barberoSeleccionado === b.idBarbero
                      ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0">
                    {b.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-white">{b.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">📞 {b.telefono}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                    {b.horarios.length} franja(s)
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Horarios semanales del barbero seleccionado */}
          <div className="md:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
            <label className="text-xs font-semibold text-slate-300 block mb-3 uppercase tracking-wider flex items-center justify-between">
              <span>2. Jornada Semanal de {barberoActivo?.nombre}:</span>
              <span className="text-[11px] text-amber-400 font-normal">
                Reflejo inmediato (Criterio 2)
              </span>
            </label>

            {barberoActivo && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {barberoActivo.horarios.map(h => (
                    <div
                      key={h.idHorario}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-white">{h.diaSemana}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{h.horaInicio} – {h.horaFin}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Profesional disponible para asignación de turnos.</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Activo en sistema
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
