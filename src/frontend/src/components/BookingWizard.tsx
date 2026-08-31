import React, { useState, useEffect, useCallback } from 'react';
import {
  Scissors,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Receipt,
  Lock,
  Mail,
  XCircle,
} from 'lucide-react';
import { servicioService } from '../services/servicioService';
import { barberoService } from '../services/barberoService';
import { disponibilidadService } from '../services/disponibilidadService';
import { citaService } from '../services/citaService';
import { AuthModal } from './AuthModal';
import type { ServicioResponseDto } from '../types/servicio';
import type { BarberoResponseDto } from '../types/barbero';
import type { DisponibilidadResponseDto, TurnoResponseDto } from '../types/turno';
import type { CitaResponseDto } from '../types/cita';
import type { Cliente } from '../types';

interface BookingWizardProps {
  currentUser: Cliente | null;
  onUserLogin: (cliente: Cliente, token?: string) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  currentUser,
  onUserLogin,
}) => {
  // Datos maestros
  const [servicios, setServicios] = useState<ServicioResponseDto[]>([]);
  const [barberos, setBarberos] = useState<BarberoResponseDto[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadResponseDto | null>(null);

  // Selecciones del cliente
  const [selectedServicio, setSelectedServicio] = useState<ServicioResponseDto | null>(null);
  const [selectedBarbero, setSelectedBarbero] = useState<BarberoResponseDto | null>(null);

  const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [fecha, setFecha] = useState<string>(getTodayString());
  const [selectedTurno, setSelectedTurno] = useState<TurnoResponseDto | null>(null);

  // Estados de carga y feedback
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [loadingBarberos, setLoadingBarberos] = useState(true);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [concurrencyAlert, setConcurrencyAlert] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [confirmedCita, setConfirmedCita] = useState<CitaResponseDto | null>(null);

  // 1. Cargar servicios
  useEffect(() => {
    const cargarServicios = async () => {
      try {
        const data = await servicioService.obtenerTodos();
        setServicios(data);
        if (data.length > 0) setSelectedServicio(data[0]);
      } catch {
        setError('No se pudo cargar el catálogo de servicios.');
      } finally {
        setLoadingServicios(false);
      }
    };
    cargarServicios();
  }, []);

  // 2. Cargar barberos habilitados
  useEffect(() => {
    const cargarBarberos = async () => {
      try {
        const data = await barberoService.obtenerDisponibles();
        setBarberos(data);
        if (data.length > 0) setSelectedBarbero(data[0]);
      } catch {
        setError('No se pudo cargar los barberos disponibles.');
      } finally {
        setLoadingBarberos(false);
      }
    };
    cargarBarberos();
  }, []);

  // 3. Consultar disponibilidad en tiempo real
  const consultarDisponibilidad = useCallback(async () => {
    if (!selectedBarbero) return;

    setLoadingTurnos(true);
    setSelectedTurno(null);
    setConcurrencyAlert(null);
    try {
      const data = await disponibilidadService.consultarDisponibilidad(selectedBarbero.idBarbero, fecha);
      setDisponibilidad(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar disponibilidad.');
    } finally {
      setLoadingTurnos(false);
    }
  }, [selectedBarbero, fecha]);

  useEffect(() => {
    if (selectedBarbero) {
      consultarDisponibilidad();
    }
  }, [selectedBarbero, fecha, consultarDisponibilidad]);

  // Manejo de siguiente día
  const pasarAlSiguienteDia = () => {
    const date = new Date(fecha + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setFecha(`${y}-${m}-${d}`);
  };

  // HU-04 Criterio 1: Solo habilitar botón si se completaron los 3 campos
  const isFormComplete = selectedServicio !== null && selectedBarbero !== null && selectedTurno !== null;

  // HU-04 Confirmar Reserva
  const handleConfirmarClick = async () => {
    if (!isFormComplete || !selectedServicio || !selectedBarbero || !selectedTurno) return;

    // HU-04 Criterio 2: Interceptar invitado y exigir autenticación
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    await procesarReserva(currentUser.idCliente);
  };

  const procesarReserva = async (idCliente: number) => {
    if (!selectedServicio || !selectedTurno) return;

    setBookingLoading(true);
    setError(null);
    setConcurrencyAlert(null);

    try {
      const res = await citaService.agendarCita({
        idCliente,
        idServicio: selectedServicio.idServicio,
        idTurno: selectedTurno.idTurno,
      });

      // HU-04 Criterio 4: Cita creada exitosamente con snapshot y estado 'Pendiente'
      setConfirmedCita(res.cita);
    } catch (err: unknown) {
      // HU-04 Criterio 3: Concurrencia detectada (HTTP 409)
      const isConflict = (err as { isConflict?: boolean })?.isConflict;
      if (isConflict) {
        setConcurrencyAlert('⚠️ El horario seleccionado acaba de ser tomado por otro cliente. Por favor elige otro turno disponible.');
        setSelectedTurno(null);
        consultarDisponibilidad();
      } else {
        setError(err instanceof Error ? err.message : 'Error inesperado al agendar la cita.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAuthSuccess = (cliente: Cliente, token?: string) => {
    onUserLogin(cliente, token);
    // Procesar reserva inmediatamente después de autenticarse
    procesarReserva(cliente.idCliente);
  };

  const resetearFormulario = () => {
    setConfirmedCita(null);
    setSelectedTurno(null);
    setCancelFeedback(null);
    consultarDisponibilidad();
  };

  const handleCancelarCita = async () => {
    if (!confirmedCita) return;
    if (!window.confirm(`¿Estás seguro de que deseas cancelar la cita #${confirmedCita.idCita}? El horario se liberará inmediatamente.`)) {
      return;
    }

    setCancelLoading(true);
    try {
      await citaService.cancelarCita(confirmedCita.idCita);
      setConfirmedCita({ ...confirmedCita, estado: 'Cancelada' });
      setCancelFeedback('Cita cancelada exitosamente. El horario ha sido liberado.');
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || 'No se pudo cancelar la cita.');
    } finally {
      setCancelLoading(false);
    }
  };

  // ─── Vista de Comprobante / Ticket Exitoso (HU-04, HU-05 y HU-06) ─────────────
  if (confirmedCita) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Header del Ticket */}
          <div className="text-center pb-6 border-b border-slate-800 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cita #{confirmedCita.idCita} Registrada Exitosamente</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ¡Reserva Confirmada!
            </h2>
            <p className="text-xs text-slate-400">
              Tu turno ha sido reservado en el sistema y se encuentra en estado <span className={`font-semibold ${confirmedCita.estado === 'Cancelada' ? 'text-red-400' : 'text-amber-400'}`}>{confirmedCita.estado}</span>.
            </p>
          </div>

          {/* Banner de Notificación Automática (HU-05 Criterio 1) */}
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
            <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Confirmación Automática (HU-05)</span>
              <span>Notificación enviada a <strong className="text-emerald-200">{confirmedCita.clienteCorreo || 'tu correo registrado'}</strong> con los detalles de tu cita y enlace de gestión.</span>
            </div>
          </div>

          {/* Mensaje de Confirmación de Cancelación */}
          {cancelFeedback && (
            <div className="mt-3 bg-red-500/10 border border-red-500/30 p-3 rounded-2xl text-xs text-red-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{cancelFeedback}</span>
            </div>
          )}

          {/* Cuerpo del Ticket con Snapshot de Precio y Duración */}
          <div className="py-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Servicio Seleccionado</span>
                <span className="text-sm font-bold text-white block mt-0.5">{confirmedCita.servicioNombre}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Profesional / Barbero</span>
                <span className="text-sm font-bold text-amber-400 block mt-0.5">{confirmedCita.barberoNombre}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">Fecha</span>
                <span className="text-xs font-bold text-white block mt-0.5">{confirmedCita.fecha}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">Horario</span>
                <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                  {confirmedCita.horaInicio} – {confirmedCita.horaFin}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">Duración (Snapshot)</span>
                <span className="text-xs font-bold text-white block mt-0.5">{confirmedCita.duracion} minutos</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">Tarifa (Snapshot)</span>
                <span className="text-xs font-black text-amber-400 block mt-0.5">{confirmedCita.precio.toFixed(2)} Bs</span>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Titular de la Cita</span>
                <span className="text-xs font-bold text-white block">{confirmedCita.clienteNombre}</span>
                <span className="text-[11px] text-slate-400 block">📞 {confirmedCita.clienteTelefono} • ✉️ {confirmedCita.clienteCorreo}</span>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${confirmedCita.estado === 'Cancelada'
                  ? 'bg-red-500/15 text-red-300 border-red-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                {confirmedCita.estado}await citaService.cancelarCita(confirmedCita.idCi
              </span>
            </div>
          </div>

          {/* Acciones (Incluye enlace de cancelación HU-05 Criterio 3 & HU-06) */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={resetearFormulario}
              className="flex-1 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Agendar Otra Cita</span>
            </button>

            {confirmedCita.estado !== 'Cancelada' ? (
              <button
                onClick={handleCancelarCita}
                disabled={cancelLoading}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/30 transition-all cursor-pointer"
              >
                {cancelLoading ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span>Cancelar Cita (HU-06)</span>
              </button>
            ) : (
              <div className="w-full sm:w-auto px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Cita Cancelada</span>
              </div>
            )}

            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Vista Principal del Wizard de Agendamiento ───────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Auth Modal para HU-04 Criterio 2 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Header del Módulo */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Agendamiento • HU-04</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Agendar Cita en BarberLosPeluchitos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Selecciona tu servicio, el estilista de tu preferencia y el horario ideal con confirmación transaccional en tiempo real.
          </p>
        </div>

        {/* Estado de Sesión del Usuario */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                {currentUser.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-white block leading-tight">{currentUser.nombre}</span>
                <span className="text-[10px] text-emerald-400 block">Autenticado • #{currentUser.idCliente}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer transition-all"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Navegando como Invitado (Identificarse)</span>
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {concurrencyAlert && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{concurrencyAlert}</span>
          </div>
          <button onClick={() => setConcurrencyAlert(null)} className="text-amber-400 font-bold text-xs px-2 py-1">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Pasos 1 y 2 (Servicio y Barbero) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Paso 1: Catálogo de Servicios */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Seleccionar Servicio</span>
              </label>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {servicios.length} disponibles
              </span>
            </div>

            {loadingServicios ? (
              <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Cargando catálogo…</span>
              </div>
            ) : (
              <div className="space-y-2">
                {servicios.map(s => (
                  <button
                    key={s.idServicio}
                    onClick={() => setSelectedServicio(s)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${selectedServicio?.idServicio === s.idServicio
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{s.nombre}</p>
                      <p className="text-[11px] text-slate-400">⏱️ {s.duracionBase} min</p>
                    </div>
                    <span className="text-xs font-black text-amber-400 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                      {s.precioBase.toFixed(2)} Bs
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Paso 2: Selección de Barbero */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Seleccionar Profesional</span>
              </label>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {barberos.length} activo(s)
              </span>
            </div>

            {loadingBarberos ? (
              <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Cargando profesionales…</span>
              </div>
            ) : (
              <div className="space-y-2">
                {barberos.map(b => (
                  <button
                    key={b.idBarbero}
                    onClick={() => setSelectedBarbero(b)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${selectedBarbero?.idBarbero === b.idBarbero
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">
                      {b.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-white">{b.nombre}</p>
                      <p className="text-[10px] text-slate-400">📞 {b.telefono}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Paso 3 (Fecha & Horarios) y Confirmación */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between min-h-[440px]">
            <div>
              {/* Encabezado Paso 3 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>3. Seleccionar Fecha y Horario</span>
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedBarbero ? `Agenda de ${selectedBarbero.nombre}` : 'Elige un profesional'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={fecha}
                    min={getTodayString()}
                    onChange={e => setFecha(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none"
                  />
                  <button
                    onClick={pasarAlSiguienteDia}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer flex items-center gap-1"
                  >
                    <span>+1 día</span>
                  </button>
                </div>
              </div>

              {/* Parrilla de Turnos Disponibles */}
              {loadingTurnos ? (
                <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>Consultando horarios libres…</span>
                </div>
              ) : !disponibilidad || disponibilidad.turnos.length === 0 ? (
                <div className="py-12 text-center p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-3">
                  <Clock className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                  <div>
                    <p className="text-sm font-bold text-white">Sin turnos disponibles para esta fecha</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      No hay horarios libres o el profesional no atiende este día.
                    </p>
                  </div>
                  <button
                    onClick={pasarAlSiguienteDia}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <span>Ver disponibilidad del día siguiente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {disponibilidad.turnos.map(t => {
                    const isSelected = selectedTurno?.idTurno === t.idTurno;
                    return (
                      <button
                        key={t.idTurno}
                        onClick={() => setSelectedTurno(t)}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-amber-500/60 hover:bg-slate-900 hover:text-white'
                          }`}
                      >
                        <div className="flex items-center gap-1 text-xs font-bold">
                          <Clock className={`w-3 h-3 ${isSelected ? 'text-emerald-400' : 'text-amber-400'}`} />
                          <span>{t.horaInicio}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">a {t.horaFin}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumen de Selección & Botón de Confirmación (HU-04 Criterios 1, 2, 4) */}
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    Resumen de Selección
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-white font-bold">
                      {selectedServicio ? selectedServicio.nombre : '—'}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-amber-400 font-medium">
                      {selectedBarbero ? selectedBarbero.nombre : '—'}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 font-mono font-semibold">
                      {selectedTurno ? `${fecha} (${selectedTurno.horaInicio} – ${selectedTurno.horaFin})` : 'Sin horario'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total a Pagar (Snapshot)</span>
                  <span className="text-base font-black text-amber-400">
                    {selectedServicio ? `${selectedServicio.precioBase.toFixed(2)} Bs` : '0.00 Bs'}
                  </span>
                </div>
              </div>

              {/* Botón de Confirmación (Criterio 1: Habilitado solo si 3 campos están completos) */}
              <button
                onClick={handleConfirmarClick}
                disabled={!isFormComplete || bookingLoading}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${isFormComplete && !bookingLoading
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 cursor-pointer active:scale-[0.99]'
                    : 'bg-slate-800/80 text-slate-500 border border-slate-800 cursor-not-allowed'
                  }`}
              >
                {bookingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Procesando Reserva Transaccional…</span>
                  </>
                ) : !isFormComplete ? (
                  <>
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Selecciona Servicio, Barbero y Horario para Confirmar</span>
                  </>
                ) : !currentUser ? (
                  <>
                    <User className="w-4 h-4 text-slate-950" />
                    <span>Confirmar Reserva (Requiere Identificación)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Confirmar y Reservar Cita</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
