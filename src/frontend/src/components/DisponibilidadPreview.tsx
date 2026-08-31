import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, RefreshCw, AlertCircle, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';
import { barberoService } from '../services/barberoService';
import { BarberScissorsIcon } from './LandingHome';
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
    <div className="max-w-5xl mx-auto p-6 sm:p-8 bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] shadow-2xl font-sans text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#24211c]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#d97706]/50 bg-[#1a1713] text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Módulo de Staff • Disponibilidad Pública</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
            SELECCIÓN DE BARBERO & JORNADAS
          </h2>
          <p className="text-xs text-[#a39b8d] font-light">
            Consulta en tiempo real el personal habilitado y sus horarios semanales de atención.
          </p>
        </div>

        <button
          onClick={cargar}
          disabled={loading}
          className="px-4 py-2.5 bg-[#121212] hover:bg-[#1a1713] text-[#f5f1e8] hover:text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 border border-[#38332b] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#d97706]' : ''}`} />
          <span>Refrescar Disponibilidad</span>
        </button>
      </div>

      {/* Alerta de Criterio 4 */}
      <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#24211c] flex flex-col gap-2.5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-heading uppercase font-bold text-[#10b981]">Regla de Disponibilidad:</span>{' '}
            <span className="text-[#d4ccbd]">
              Solo se muestran barberos con al menos una franja horaria configurada y activa.
            </span>
            {barberosOcultos.length > 0 ? (
              <div className="mt-2 text-[#d97706] flex items-center gap-1.5 bg-[#1a1713] px-3 py-2 border border-[#854d0e]/30">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{barberosOcultos.length}</strong> barbero(s) sin horario configurado ocultos para reserva:{' '}
                  {barberosOcultos.map(b => b.nombre).join(', ')}.
                </span>
              </div>
            ) : (
              <p className="mt-1 text-[#8c8273]">
                Todos los barberos registrados cuentan con horarios habilitados para reserva.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-20 text-center text-[#a39b8d] text-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
          <span className="font-heading uppercase tracking-wider text-xs">Consultando barberos en tiempo real...</span>
        </div>
      ) : error ? (
        <div className="my-6 p-4 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : barberosDisponibles.length === 0 ? (
        <div className="my-8 p-8 text-center bg-[#0a0a0a] border border-dashed border-[#38332b] text-[#a39b8d] space-y-2">
          <BarberScissorsIcon className="w-10 h-10 mx-auto text-[#736a5c] mb-2" />
          <p className="font-heading font-bold uppercase text-[#f5f1e8]">No hay barberos con horarios disponibles actualmente</p>
          <p className="text-xs text-[#736a5c]">
            Accede a la pestaña <strong>"Gestión de Staff"</strong> para registrar barberos y configurar sus franjas horarias.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Selector de barberos disponibles */}
          <div className="space-y-2 md:col-span-1">
            <label className="font-heading text-xs font-bold text-[#d4ccbd] block mb-2 uppercase tracking-wider">
              1. Selecciona un Profesional:
            </label>
            <div className="space-y-2">
              {barberosDisponibles.map(b => (
                <button
                  key={b.idBarbero}
                  onClick={() => setBarberoSeleccionado(b.idBarbero)}
                  className={`w-full text-left p-3.5 border transition-all flex items-center gap-3 cursor-pointer ${
                    barberoSeleccionado === b.idBarbero
                      ? 'bg-[#1a1713] border-[#d97706] text-[#f5f1e8] shadow-md'
                      : 'bg-[#0a0a0a] border-[#24211c] text-[#a39b8d] hover:border-[#38332b] hover:text-[#f5f1e8]'
                  }`}
                >
                  <div className="w-9 h-9 border-2 border-[#d97706] bg-[#121212] text-[#d97706] font-heading font-bold flex items-center justify-center shrink-0 text-xs">
                    {b.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm uppercase truncate text-[#f5f1e8]">{b.nombre}</p>
                    <p className="text-[11px] text-[#8c8273] font-mono truncate">Tel: {b.telefono}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-[#121212] text-[#d97706] font-heading font-bold border border-[#38332b]">
                    {b.horarios.length} franja(s)
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Horarios semanales del barbero seleccionado */}
          <div className="md:col-span-2 bg-[#0a0a0a] border border-[#24211c] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#24211c] pb-3">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#d4ccbd]">
                2. Jornada Semanal de {barberoActivo?.nombre}:
              </span>
              <span className="font-heading text-[11px] text-[#d97706] font-bold">
                HORARIOS OFICIALES
              </span>
            </div>

            {barberoActivo && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {barberoActivo.horarios.map(h => (
                    <div
                      key={h.idHorario}
                      className="p-3.5 bg-[#121212] border border-[#24211c] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#d97706]" />
                        <span className="font-heading text-xs font-bold uppercase text-[#f5f1e8]">{h.diaSemana}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#d4ccbd] bg-[#0a0a0a] px-2.5 py-1 border border-[#38332b] font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#8c8273]" />
                        <span>{h.horaInicio} – {h.horaFin}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-[#24211c] flex items-center justify-between text-xs text-[#8c8273]">
                  <span>Maestro barbero disponible para agendamiento en línea.</span>
                  <span className="text-[#10b981] flex items-center gap-1 font-heading uppercase font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Habilitado en Salón
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

export default DisponibilidadPreview;
