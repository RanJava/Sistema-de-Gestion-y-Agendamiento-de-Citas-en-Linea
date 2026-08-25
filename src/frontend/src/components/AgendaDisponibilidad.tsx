import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { barberoService } from '../services/barberoService';
import { disponibilidadService } from '../services/disponibilidadService';
import type { BarberoResponseDto } from '../types/barbero';
import type { DisponibilidadResponseDto, TurnoResponseDto } from '../types/turno';

export const AgendaDisponibilidad: React.FC = () => {
  const [barberos, setBarberos] = useState<BarberoResponseDto[]>([]);
  const [selectedBarberoId, setSelectedBarberoId] = useState<number | null>(null);

  // Fecha actual en formato YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(getTodayString());
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadResponseDto | null>(null);
  const [selectedTurno, setSelectedTurno] = useState<TurnoResponseDto | null>(null);
  const [loadingBarberos, setLoadingBarberos] = useState(true);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [verificandoTurno, setVerificandoTurno] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [concurrencyAlert, setConcurrencyAlert] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Cargar barberos habilitados (HU-02 Criterio 4)
  const cargarBarberos = useCallback(async () => {
    setLoadingBarberos(true);
    setError(null);
    try {
      const data = await barberoService.obtenerDisponibles();
      setBarberos(data);
      if (data.length > 0 && !selectedBarberoId) {
        setSelectedBarberoId(data[0].idBarbero);
      }
    } catch {
      setError('No se pudo cargar el personal con horarios disponibles.');
    } finally {
      setLoadingBarberos(false);
    }
  }, [selectedBarberoId]);

  useEffect(() => {
    cargarBarberos();
  }, [cargarBarberos]);

  // 2. Consultar turnos disponibles para barbero y fecha (HU-03 Criterios 1, 2, 4)
  const consultarTurnos = useCallback(async () => {
    if (!selectedBarberoId) return;

    setLoadingTurnos(true);
    setConcurrencyAlert(null);
    setSelectedTurno(null);
    try {
      const data = await disponibilidadService.consultarDisponibilidad(selectedBarberoId, fechaSeleccionada);
      setDisponibilidad(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar disponibilidad.');
    } finally {
      setLoadingTurnos(false);
    }
  }, [selectedBarberoId, fechaSeleccionada]);

  useEffect(() => {
    if (selectedBarberoId) {
      consultarTurnos();
    }
  }, [selectedBarberoId, fechaSeleccionada, consultarTurnos]);

  // 3. Pasar al día siguiente (HU-03 Criterio 2)
  const pasarAlSiguienteDia = () => {
    const date = new Date(fechaSeleccionada + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setFechaSeleccionada(`${y}-${m}-${d}`);
  };

  // 4. Seleccionar y verificar turno en tiempo real (HU-03 Criterio 3)
  const handleSelectTurno = async (turno: TurnoResponseDto) => {
    setConcurrencyAlert(null);
    setSuccessMsg(null);
    setVerificandoTurno(turno.idTurno);

    try {
      const check = await disponibilidadService.verificarDisponibilidad(turno.idTurno);

      if (!check.estaDisponible) {
        // Criterio 3: Concurrencia detectada, turno tomado
        setConcurrencyAlert(`⚠️ Concurrencia detectada: ${check.mensaje}`);
        setSelectedTurno(null);
        // Refrescar disponibilidad automáticamente
        consultarTurnos();
      } else {
        setSelectedTurno(turno);
        setSuccessMsg(`✅ Turno ${turno.horaInicio} – ${turno.horaFin} confirmado y disponible.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch {
      setConcurrencyAlert('Error de conexión al verificar la disponibilidad del turno.');
    } finally {
      setVerificandoTurno(null);
    }
  };

  // 5. Simulación de concurrencia para pruebas
  const handleSimularConcurrencia = async (idTurno: number) => {
    try {
      await disponibilidadService.simularReserva(idTurno, 'Reservado');
      setConcurrencyAlert('🧪 Simulación: Se ha marcado el turno como "Reservado" en la BD.');
      consultarTurnos();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al simular concurrencia.');
    }
  };

  const isToday = fechaSeleccionada === getTodayString();
  const barberoActual = barberos.find(b => b.idBarbero === selectedBarberoId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Agendamiento • HU-03</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ver Disponibilidad en Tiempo Real
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Consulta turnos libres por profesional, control de concurrencia y filtrado dinámico de horas pasadas.
          </p>
        </div>

        <button
          onClick={consultarTurnos}
          disabled={loadingTurnos || !selectedBarberoId}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingTurnos ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refrescar Agenda</span>
        </button>
      </div>

      {/* Alertas y Notificaciones */}
      {concurrencyAlert && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{concurrencyAlert}</span>
          </div>
          <button
            onClick={() => setConcurrencyAlert(null)}
            className="text-amber-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Selección de Barbero y Fecha */}
        <div className="space-y-6 lg:col-span-1">
          {/* 1. Selector de Barbero */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3 flex items-center gap-2">
              <span>1. Barbero / Estilista</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
                {barberos.length} disponible(s)
              </span>
            </label>

            {loadingBarberos ? (
              <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Cargando staff…</span>
              </div>
            ) : barberos.length === 0 ? (
              <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                No hay barberos con horarios configurados en el sistema.
              </p>
            ) : (
              <div className="space-y-2">
                {barberos.map(b => (
                  <button
                    key={b.idBarbero}
                    onClick={() => setSelectedBarberoId(b.idBarbero)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                      selectedBarberoId === b.idBarbero
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
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
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Selector de Fecha */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
              2. Seleccionar Fecha
            </label>

            <div className="space-y-3">
              <input
                type="date"
                value={fechaSeleccionada}
                min={getTodayString()}
                onChange={e => setFechaSeleccionada(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-amber-500 outline-none transition-all"
              />

              {/* Botones de acceso rápido */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFechaSeleccionada(getTodayString())}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    isToday
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={pasarAlSiguienteDia}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Mañana</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Banner de Filtrado Temporal (Criterio 4) */}
              {isToday && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Criterio 4 (RN-03):</span>{' '}
                    Para la fecha de hoy, los turnos pasados respecto a la hora actual se filtran automáticamente.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Parrilla de Horarios Disponibles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl min-h-[400px] flex flex-col justify-between">
            <div>
              {/* Encabezado de la Agenda */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    <span>
                      {disponibilidad?.diaSemana ?? 'Día'} {fechaSeleccionada}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {barberoActual ? `Agenda disponible de ${barberoActual.nombre}` : 'Selecciona un profesional'}
                  </p>
                </div>

                {disponibilidad && (
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                    disponibilidad.totalTurnosLibres > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {disponibilidad.totalTurnosLibres} turno(s) libre(s)
                  </span>
                )}
              </div>

              {/* Contenido de Horarios */}
              {loadingTurnos ? (
                <div className="py-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>Consultando disponibilidad en tiempo real…</span>
                </div>
              ) : !disponibilidad || disponibilidad.turnos.length === 0 ? (
                /* HU-03 Criterio 2: Fecha sin turnos libres */
                <div className="py-12 text-center p-8 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Sin turnos disponibles para esta fecha</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      {disponibilidad?.tieneJornadaLaboral === false
                        ? `El profesional no tiene franjas laborales configuradas para los días ${disponibilidad?.diaSemana}.`
                        : 'Todos los turnos para este día ya han transcurrido o han sido reservados por otros clientes.'}
                    </p>
                  </div>

                  {/* Botón para saltar al siguiente día (Criterio 2) */}
                  <button
                    onClick={pasarAlSiguienteDia}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <span>Ver disponibilidad del día siguiente</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* HU-03 Criterio 1: Parrilla de turnos disponibles */
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {disponibilidad.turnos.map(t => {
                      const isSelected = selectedTurno?.idTurno === t.idTurno;
                      const isVerifying = verificandoTurno === t.idTurno;

                      return (
                        <button
                          key={t.idTurno}
                          onClick={() => handleSelectTurno(t)}
                          disabled={isVerifying}
                          className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer relative group ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                              : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-amber-500/60 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-1 text-xs font-bold">
                            <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-amber-400'}`} />
                            <span>{t.horaInicio}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            hasta {t.horaFin}
                          </span>

                          {isVerifying && (
                            <span className="absolute inset-0 bg-slate-950/90 rounded-2xl flex items-center justify-center text-[11px] text-amber-300 font-semibold gap-1">
                              <span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                              Verificando…
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Resumen del Turno Seleccionado / Prueba de Concurrencia */}
            {selectedTurno && (
              <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Turno seleccionado: {selectedTurno.horaInicio} – {selectedTurno.horaFin}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Profesional: {selectedTurno.barberoNombre} • Fecha: {selectedTurno.fecha}
                    </p>
                  </div>
                </div>

                {/* Botón de Simulación de Concurrencia (Criterio 3) */}
                <button
                  onClick={() => handleSimularConcurrencia(selectedTurno.idTurno)}
                  title="Simular que otro usuario toma este turno en este instante"
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simular Concurrencia (Ocupar)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaDisponibilidad;
