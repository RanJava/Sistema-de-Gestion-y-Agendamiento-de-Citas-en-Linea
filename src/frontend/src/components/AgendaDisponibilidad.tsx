import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { barberoService } from '../services/barberoService';
import { disponibilidadService } from '../services/disponibilidadService';
import { BarberScissorsIcon } from './LandingHome';
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
        setConcurrencyAlert(`⚠️ Concurrencia detectada: ${check.mensaje}`);
        setSelectedTurno(null);
        consultarTurnos();
      } else {
        setSelectedTurno(turno);
        setSuccessMsg(`✅ Turno ${turno.horaInicio} – ${turno.horaFin} verificado y disponible.`);
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
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Header Clásico */}
      <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#d97706]/50 bg-[#1a1713] text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider">
            <BarberScissorsIcon className="w-4 h-4 text-[#d97706]" />
            <span>Módulo de Agenda • Disponibilidad en Tiempo Real</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
            CONSULTA DE HORARIOS & DISPONIBILIDAD
          </h2>
          <p className="text-xs sm:text-sm text-[#a39b8d] font-light max-w-2xl">
            Verifica en tiempo real los turnos libres de cada maestro barbero con control instantáneo de concurrencia.
          </p>
        </div>

        <button
          onClick={consultarTurnos}
          disabled={loadingTurnos || !selectedBarberoId}
          className="px-5 py-3 bg-[#121212] hover:bg-[#1a1713] text-[#f5f1e8] hover:text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 border border-[#38332b] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loadingTurnos ? 'animate-spin text-[#d97706]' : ''}`} />
          <span>Actualizar Turnos</span>
        </button>
      </div>

      {/* Alertas y Notificaciones */}
      {concurrencyAlert && (
        <div className="p-4 bg-[#1f160a] border border-[#854d0e] text-[#fef3c7] text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#d97706] shrink-0" />
            <span className="font-medium">{concurrencyAlert}</span>
          </div>
          <button
            onClick={() => setConcurrencyAlert(null)}
            className="text-[#d97706] hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#061e14] border border-[#065f46] text-[#6ee7b7] text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Selección de Barbero y Fecha */}
        <div className="space-y-6 lg:col-span-1 text-left">
          {/* 1. Selector de Barbero */}
          <div className="bg-[#121212] border border-[#24211c] p-6 space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-[#24211c] pb-3">
              <label className="font-heading font-bold text-xs uppercase tracking-wider text-[#d4ccbd] flex items-center gap-2">
                <span>1. Maestro Barbero</span>
              </label>
              <span className="font-heading text-[11px] bg-[#1a1713] text-[#d97706] px-2 py-0.5 border border-[#38332b]">
                {barberos.length} EN STAFF
              </span>
            </div>

            {loadingBarberos ? (
              <div className="py-8 text-center text-xs text-[#a39b8d] flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
                <span>Cargando equipo...</span>
              </div>
            ) : barberos.length === 0 ? (
              <p className="text-xs text-[#d97706] bg-[#1a1713] p-3 border border-[#854d0e]/40">
                No hay barberos con horarios habilitados en este momento.
              </p>
            ) : (
              <div className="space-y-2.5">
                {barberos.map(b => (
                  <button
                    key={b.idBarbero}
                    onClick={() => setSelectedBarberoId(b.idBarbero)}
                    className={`w-full text-left p-3.5 border transition-all flex items-center gap-3.5 cursor-pointer ${
                      selectedBarberoId === b.idBarbero
                        ? 'bg-[#1a1713] border-[#d97706] text-[#f5f1e8] shadow-md'
                        : 'bg-[#0a0a0a] border-[#24211c] text-[#a39b8d] hover:border-[#38332b] hover:text-[#f5f1e8]'
                    }`}
                  >
                    <div className="w-10 h-10 border-2 border-[#d97706] bg-[#121212] text-[#d97706] font-heading font-bold flex items-center justify-center shrink-0">
                      {b.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm uppercase truncate text-[#f5f1e8]">{b.nombre}</p>
                      <p className="text-xs text-[#8c8273] font-mono truncate">Tel: {b.telefono}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Selector de Fecha */}
          <div className="bg-[#121212] border border-[#24211c] p-6 space-y-4 shadow-lg">
            <div className="border-b border-[#24211c] pb-3">
              <label className="font-heading font-bold text-xs uppercase tracking-wider text-[#d4ccbd] block">
                2. Fecha del Servicio
              </label>
            </div>

            <div className="space-y-3">
              <input
                type="date"
                value={fechaSeleccionada}
                min={getTodayString()}
                onChange={e => setFechaSeleccionada(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-sm focus:border-[#d97706] outline-none transition-all"
              />

              {/* Botones de acceso rápido */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFechaSeleccionada(getTodayString())}
                  className={`py-2 text-xs font-heading uppercase tracking-wider font-bold border transition-colors cursor-pointer ${
                    isToday
                      ? 'bg-[#d97706] text-[#0a0a0a] border-[#d97706]'
                      : 'bg-[#0a0a0a] border-[#38332b] text-[#a39b8d] hover:text-[#f5f1e8]'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={pasarAlSiguienteDia}
                  className="py-2 text-xs font-heading uppercase tracking-wider font-bold bg-[#0a0a0a] border border-[#38332b] text-[#a39b8d] hover:text-[#f5f1e8] hover:border-[#d97706] transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Mañana</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Banner de Regla de Negocio */}
              {isToday && (
                <div className="p-3 bg-[#1a1713] border border-[#38332b] text-[#d4ccbd] text-[11px] flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-heading uppercase font-bold text-[#d97706]">Turnos en Vivo:</span>{' '}
                    Para hoy, los horarios previos a la hora actual se ocultan automáticamente para garantizar puntualidad.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Parrilla de Horarios Disponibles */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <div className="bg-[#121212] border border-[#24211c] p-6 sm:p-8 min-h-[460px] flex flex-col justify-between shadow-xl">
            <div>
              {/* Encabezado de la Agenda */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#24211c] mb-6">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-[#d97706]" />
                    <span>
                      {disponibilidad?.diaSemana ?? 'Jornada'} — {fechaSeleccionada}
                    </span>
                  </h3>
                  <p className="text-xs text-[#a39b8d] mt-1 font-light">
                    {barberoActual ? `Agenda disponible de ${barberoActual.nombre}` : 'Selecciona un profesional'}
                  </p>
                </div>

                {disponibilidad && (
                  <span className={`text-xs px-3 py-1.5 font-heading uppercase tracking-wider font-bold border ${
                    disponibilidad.totalTurnosLibres > 0
                      ? 'bg-[#061e14] text-[#6ee7b7] border-[#065f46]'
                      : 'bg-[#1f080c] text-rose-300 border-[#881337]'
                  }`}>
                    {disponibilidad.totalTurnosLibres} turno(s) disponible(s)
                  </span>
                )}
              </div>

              {/* Contenido de Horarios */}
              {loadingTurnos ? (
                <div className="py-24 text-center text-[#a39b8d] text-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
                  <span className="font-heading uppercase tracking-wider text-xs">Consultando disponibilidad en tiempo real...</span>
                </div>
              ) : !disponibilidad || disponibilidad.turnos.length === 0 ? (
                /* Fecha sin turnos libres */
                <div className="py-14 text-center p-8 bg-[#0a0a0a] border border-dashed border-[#38332b] space-y-4">
                  <div className="w-14 h-14 border-2 border-[#854d0e] bg-[#1a1713] text-[#d97706] flex items-center justify-center mx-auto">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
                      Sin turnos libres en esta fecha
                    </h4>
                    <p className="text-xs text-[#a39b8d] max-w-md mx-auto mt-1 font-light leading-relaxed">
                      {disponibilidad?.tieneJornadaLaboral === false
                        ? `El profesional no tiene franjas laborales programadas para los días ${disponibilidad?.diaSemana}.`
                        : 'Todos los cupos para este día han sido reservados o ya transcurrieron.'}
                    </p>
                  </div>

                  <button
                    onClick={pasarAlSiguienteDia}
                    className="px-6 py-3 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] font-heading font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 border border-[#d97706] transition-colors cursor-pointer"
                  >
                    <span>Ver disponibilidad de mañana</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Parrilla de turnos disponibles tipo catálogo */
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {disponibilidad.turnos.map(t => {
                      const isSelected = selectedTurno?.idTurno === t.idTurno;
                      const isVerifying = verificandoTurno === t.idTurno;

                      return (
                        <button
                          key={t.idTurno}
                          onClick={() => handleSelectTurno(t)}
                          disabled={isVerifying}
                          className={`p-4 border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative group ${
                            isSelected
                              ? 'bg-[#d97706] border-[#d97706] text-[#0a0a0a] shadow-lg'
                              : 'bg-[#0a0a0a] border-[#24211c] text-[#f5f1e8] hover:border-[#d97706] hover:bg-[#1a1713]'
                          }`}
                        >
                          <div className="flex items-center gap-1 font-heading text-sm font-bold tracking-wider">
                            <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0a0a0a]' : 'text-[#d97706]'}`} />
                            <span>{t.horaInicio}</span>
                          </div>
                          <span className={`text-[11px] font-mono ${isSelected ? 'text-black/80 font-semibold' : 'text-[#8c8273]'}`}>
                            hasta {t.horaFin}
                          </span>

                          {isVerifying && (
                            <span className="absolute inset-0 bg-[#0a0a0a]/95 flex items-center justify-center text-[11px] text-[#d97706] font-heading uppercase font-bold gap-1">
                              <span className="w-3 h-3 border border-[#d97706] border-t-transparent rounded-full animate-spin" />
                              Verificando...
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Resumen del Turno Seleccionado */}
            {selectedTurno && (
              <div className="mt-8 pt-5 border-t border-[#24211c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0a0a0a] p-4 border border-[#38332b]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-[#10b981] bg-[#061e14] text-[#10b981] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-heading font-bold uppercase tracking-wider text-[#f5f1e8]">
                      Turno verificado: {selectedTurno.horaInicio} – {selectedTurno.horaFin}
                    </p>
                    <p className="text-[11px] text-[#8c8273]">
                      Barbero: {selectedTurno.barberoNombre} • Fecha: {selectedTurno.fecha}
                    </p>
                  </div>
                </div>

                {/* Botón de Simulación de Concurrencia */}
                <button
                  onClick={() => handleSimularConcurrencia(selectedTurno.idTurno)}
                  title="Simular que otro usuario toma este turno en este instante"
                  className="px-4 py-2.5 bg-[#1a1713] hover:bg-[#261a07] text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider border border-[#854d0e] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Simular Concurrencia</span>
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
