import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Lock,
  Mail,
  XCircle,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { servicioService } from '../services/servicioService';
import { barberoService } from '../services/barberoService';
import { disponibilidadService } from '../services/disponibilidadService';
import { citaService } from '../services/citaService';
import { AuthModal } from './AuthModal';
import { BarberScissorsIcon } from './LandingHome';
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

  const isFormComplete = selectedServicio !== null && selectedBarbero !== null && selectedTurno !== null;

  // Confirmar Reserva
  const handleConfirmarClick = async () => {
    if (!isFormComplete || !selectedServicio || !selectedBarbero || !selectedTurno) return;

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

      setConfirmedCita(res.cita);
    } catch (err: unknown) {
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

  // ─── Vista de Comprobante / Ticket Exitoso ─────────────────────────────────
  if (confirmedCita) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200 font-sans">
        <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] p-6 sm:p-8 shadow-2xl relative text-left">
          {/* Header del Ticket */}
          <div className="text-center pb-6 border-b border-[#24211c] space-y-2">
            <div className="w-16 h-16 border-2 border-[#10b981] bg-[#061e14] text-[#10b981] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="vintage-badge">
              Cita #{confirmedCita.idCita} Registrada
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading mt-2">
              ¡RESERVA CONFIRMADA!
            </h2>
            <p className="text-xs text-[#a39b8d] font-light">
              Tu turno exclusivo ha sido asegurado en el sistema con estado{' '}
              <span className={`font-heading uppercase font-bold ${confirmedCita.estado === 'Cancelada' ? 'text-rose-400' : 'text-[#d97706]'}`}>
                {confirmedCita.estado}
              </span>.
            </p>
          </div>

          {/* Banner de Notificación Automática */}
          <div className="mt-5 bg-[#061e14] border border-[#065f46] p-4 flex items-center gap-3 text-xs text-[#6ee7b7]">
            <Mail className="w-5 h-5 text-[#10b981] shrink-0" />
            <div>
              <span className="font-heading uppercase font-bold text-white block">Notificación de Confirmación</span>
              <span>Enviada a <strong className="text-[#a7f3d0]">{confirmedCita.clienteCorreo || 'tu correo registrado'}</strong> con los detalles y link de atención.</span>
            </div>
          </div>

          {/* Mensaje de Confirmación de Cancelación */}
          {cancelFeedback && (
            <div className="mt-3 bg-[#1f080c] border border-[#881337] p-3.5 text-xs text-rose-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{cancelFeedback}</span>
            </div>
          )}

          {/* Cuerpo del Ticket tipo Comprobante Impreso */}
          <div className="py-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-[#0a0a0a] p-4 border border-[#24211c]">
              <div>
                <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Servicio Solicitado</span>
                <span className="font-heading text-sm font-bold uppercase text-[#f5f1e8] block mt-0.5">{confirmedCita.servicioNombre}</span>
              </div>
              <div>
                <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Maestro Barbero</span>
                <span className="font-heading text-sm font-bold uppercase text-[#d97706] block mt-0.5">{confirmedCita.barberoNombre}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Fecha</span>
                <span className="font-heading text-xs font-bold text-[#f5f1e8] block mt-0.5">{confirmedCita.fecha}</span>
              </div>
              <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Horario</span>
                <span className="font-heading text-xs font-bold text-[#10b981] block mt-0.5">
                  {confirmedCita.horaInicio} – {confirmedCita.horaFin}
                </span>
              </div>
              <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Duración</span>
                <span className="font-heading text-xs font-bold text-[#f5f1e8] block mt-0.5">{confirmedCita.duracion} min</span>
              </div>
              <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Tarifa</span>
                <span className="font-heading text-xs font-bold text-[#d97706] block mt-0.5">Bs {confirmedCita.precio.toFixed(2)}</span>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-[#0a0a0a] p-4 border border-[#24211c] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Titular de la Reserva</span>
                <span className="font-heading text-sm font-bold uppercase text-[#f5f1e8] block">{confirmedCita.clienteNombre}</span>
                <span className="text-[11px] text-[#a39b8d] block font-mono">Tel: {confirmedCita.clienteTelefono} • {confirmedCita.clienteCorreo}</span>
              </div>
              <span className={`px-3 py-1 text-xs font-heading font-bold uppercase tracking-wider border ${confirmedCita.estado === 'Cancelada'
                  ? 'bg-[#1f080c] text-rose-300 border-[#881337]'
                  : 'bg-[#1a1713] text-[#d97706] border-[#854d0e]'
                }`}>
                {confirmedCita.estado}
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-4 border-t border-[#24211c] flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={resetearFormulario}
              className="flex-1 w-full py-3.5 px-4 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-[#d97706] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Agendar Otra Cita</span>
            </button>

            {confirmedCita.estado !== 'Cancelada' ? (
              <button
                onClick={handleCancelarCita}
                disabled={cancelLoading}
                className="w-full sm:w-auto py-3.5 px-4 bg-transparent hover:bg-[#1f080c] text-rose-400 hover:text-rose-300 text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-[#881337] transition-colors cursor-pointer"
              >
                {cancelLoading ? (
                  <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>Cancelar Cita</span>
              </button>
            ) : (
              <div className="w-full sm:w-auto px-4 py-3 bg-[#1f080c] border border-[#881337] text-rose-400 text-xs font-heading font-bold uppercase flex items-center justify-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Cita Cancelada</span>
              </div>
            )}

            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto py-3.5 px-4 bg-[#121212] hover:bg-[#1a1713] text-[#f5f1e8] text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-[#38332b] transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-[#d97706]" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Vista Principal del Wizard de Agendamiento ───────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Header Clásico */}
      <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl text-left">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#d97706]/50 bg-[#1a1713] text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider">
            <BarberScissorsIcon className="w-4 h-4 text-[#d97706]" />
            <span>Reserva de Citas en Línea • Turno Garantizado</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
            AGENDAR CITA EN BARBER LOS PELUCHITOS
          </h2>
          <p className="text-xs sm:text-sm text-[#a39b8d] font-light max-w-2xl">
            Selecciona tu servicio de autor, el maestro barbero de tu preferencia y el horario ideal con confirmación transaccional inmediata.
          </p>
        </div>

        {/* Estado de Sesión */}
        <div className="shrink-0">
          {currentUser ? (
            <div className="bg-[#0a0a0a] px-4 py-2.5 border border-[#38332b] flex items-center gap-3">
              <div className="w-8 h-8 border border-[#d97706] bg-[#1a1713] text-[#d97706] font-heading font-bold flex items-center justify-center text-xs">
                {currentUser.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <span className="text-xs font-heading font-bold uppercase text-[#f5f1e8] block leading-tight">{currentUser.nombre}</span>
                <span className="text-[10px] text-[#10b981] font-mono block">Cliente #{currentUser.idCliente}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2.5 bg-[#0a0a0a] hover:bg-[#1a1713] text-[#f5f1e8] text-xs font-heading uppercase tracking-wider font-bold flex items-center gap-2 border border-[#38332b] hover:border-[#d97706] cursor-pointer transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Navegando como Invitado (Ingresar)</span>
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {concurrencyAlert && (
        <div className="p-4 bg-[#1f160a] border border-[#854d0e] text-[#fef3c7] text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#d97706] shrink-0" />
            <span className="font-medium">{concurrencyAlert}</span>
          </div>
          <button onClick={() => setConcurrencyAlert(null)} className="text-[#d97706] font-bold text-xs px-2 py-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Columna Izquierda: Pasos 1 y 2 (Servicio y Barbero) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Paso 1: Catálogo de Servicios */}
          <div className="bg-[#121212] border border-[#24211c] p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#24211c] pb-3">
              <label className="font-heading font-bold text-xs uppercase tracking-wider text-[#d4ccbd] flex items-center gap-2">
                <BarberScissorsIcon className="w-4 h-4 text-[#d97706]" />
                <span>1. Elegir Servicio</span>
              </label>
              <span className="font-heading text-[11px] bg-[#1a1713] text-[#d97706] px-2 py-0.5 border border-[#38332b]">
                {servicios.length} EN CARTA
              </span>
            </div>

            {loadingServicios ? (
              <div className="py-8 text-center text-xs text-[#a39b8d] flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
                <span>Cargando servicios...</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {servicios.map((s, idx) => {
                  const isSelected = selectedServicio?.idServicio === s.idServicio;
                  return (
                    <button
                      key={s.idServicio}
                      onClick={() => setSelectedServicio(s)}
                      className={`w-full text-left p-3.5 border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1a1713] border-[#d97706] text-[#f5f1e8] shadow-md'
                          : 'bg-[#0a0a0a] border-[#24211c] text-[#a39b8d] hover:border-[#38332b] hover:text-[#f5f1e8]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#8c8273]">Nº 0{idx + 1}</span>
                          <p className="font-heading font-bold text-sm uppercase text-[#f5f1e8]">{s.nombre}</p>
                        </div>
                        <p className="text-[11px] text-[#8c8273]">⏱️ {s.duracionBase} min de atención</p>
                      </div>
                      <span className={`font-heading font-bold text-xs px-2.5 py-1 border ${
                        isSelected
                          ? 'bg-[#d97706] text-[#0a0a0a] border-[#d97706]'
                          : 'bg-[#121212] text-[#d97706] border-[#38332b]'
                      }`}>
                        Bs {s.precioBase.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paso 2: Selección de Barbero */}
          <div className="bg-[#121212] border border-[#24211c] p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#24211c] pb-3">
              <label className="font-heading font-bold text-xs uppercase tracking-wider text-[#d4ccbd] flex items-center gap-2">
                <User className="w-4 h-4 text-[#d97706]" />
                <span>2. Maestro Barbero</span>
              </label>
              <span className="font-heading text-[11px] bg-[#1a1713] text-[#d97706] px-2 py-0.5 border border-[#38332b]">
                {barberos.length} DISPONIBLES
              </span>
            </div>

            {loadingBarberos ? (
              <div className="py-6 text-center text-xs text-[#a39b8d] flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
                <span>Cargando barberos...</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {barberos.map(b => {
                  const isSelected = selectedBarbero?.idBarbero === b.idBarbero;
                  return (
                    <button
                      key={b.idBarbero}
                      onClick={() => setSelectedBarbero(b)}
                      className={`w-full text-left p-3.5 border transition-all flex items-center gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1a1713] border-[#d97706] text-[#f5f1e8] shadow-md'
                          : 'bg-[#0a0a0a] border-[#24211c] text-[#a39b8d] hover:border-[#38332b] hover:text-[#f5f1e8]'
                      }`}
                    >
                      <div className="w-9 h-9 border-2 border-[#d97706] bg-[#121212] text-[#d97706] font-heading font-bold flex items-center justify-center text-xs shrink-0">
                        {b.nombre.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-sm uppercase truncate text-[#f5f1e8]">{b.nombre}</p>
                        <p className="text-[11px] text-[#8c8273] font-mono">Tel: {b.telefono}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Paso 3 (Fecha & Horarios) y Confirmación */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121212] border border-[#24211c] p-6 sm:p-8 flex flex-col justify-between min-h-[460px] shadow-xl">
            <div>
              {/* Encabezado Paso 3 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#24211c] mb-6">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-[#d4ccbd] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#d97706]" />
                    <span>3. Fecha & Turno Deseado</span>
                  </label>
                  <p className="text-xs text-[#a39b8d] mt-1 font-light">
                    {selectedBarbero ? `Horarios libres de ${selectedBarbero.nombre}` : 'Selecciona un maestro barbero'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={fecha}
                    min={getTodayString()}
                    onChange={e => setFecha(e.target.value)}
                    className="px-3.5 py-2 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-xs focus:border-[#d97706] outline-none"
                  />
                  <button
                    onClick={pasarAlSiguienteDia}
                    className="px-3 py-2 bg-[#0a0a0a] hover:bg-[#1a1713] text-[#a39b8d] hover:text-[#f5f1e8] text-xs font-heading uppercase font-bold border border-[#38332b] cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <span>+1 día</span>
                  </button>
                </div>
              </div>

              {/* Parrilla de Turnos Disponibles */}
              {loadingTurnos ? (
                <div className="py-24 text-center text-[#a39b8d] text-xs flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
                  <span className="font-heading uppercase tracking-wider">Consultando turnos libres...</span>
                </div>
              ) : !disponibilidad || disponibilidad.turnos.length === 0 ? (
                <div className="py-14 text-center p-8 bg-[#0a0a0a] border border-dashed border-[#38332b] space-y-3">
                  <Clock className="w-10 h-10 text-[#d97706] mx-auto opacity-75" />
                  <div>
                    <p className="font-heading text-base font-bold uppercase text-[#f5f1e8]">Sin turnos disponibles para esta fecha</p>
                    <p className="text-xs text-[#a39b8d] mt-1 font-light">
                      No hay horarios libres o el profesional no atiende en la jornada seleccionada.
                    </p>
                  </div>
                  <button
                    onClick={pasarAlSiguienteDia}
                    className="px-5 py-2.5 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] font-heading font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 border border-[#d97706] cursor-pointer transition-colors"
                  >
                    <span>Ver disponibilidad de mañana</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {disponibilidad.turnos.map(t => {
                    const isSelected = selectedTurno?.idTurno === t.idTurno;
                    return (
                      <button
                        key={t.idTurno}
                        onClick={() => setSelectedTurno(t)}
                        className={`p-3.5 border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#d97706] border-[#d97706] text-[#0a0a0a] shadow-lg'
                            : 'bg-[#0a0a0a] border-[#24211c] text-[#f5f1e8] hover:border-[#d97706] hover:bg-[#1a1713]'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-heading text-xs font-bold tracking-wider">
                          <Clock className={`w-3 h-3 ${isSelected ? 'text-black' : 'text-[#d97706]'}`} />
                          <span>{t.horaInicio}</span>
                        </div>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-black/80 font-bold' : 'text-[#8c8273]'}`}>
                          hasta {t.horaFin}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumen de Selección & Botón de Confirmación */}
            <div className="mt-8 pt-5 border-t border-[#24211c] space-y-4">
              <div className="bg-[#0a0a0a] p-4 border border-[#38332b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-heading text-[10px] text-[#8c8273] block uppercase tracking-wider font-bold">
                    Resumen de Selección
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-heading font-bold uppercase text-[#f5f1e8]">
                      {selectedServicio ? selectedServicio.nombre : '—'}
                    </span>
                    <span className="text-[#38332b]">•</span>
                    <span className="font-heading font-bold uppercase text-[#d97706]">
                      {selectedBarbero ? selectedBarbero.nombre : '—'}
                    </span>
                    <span className="text-[#38332b]">•</span>
                    <span className="font-heading text-[#10b981] font-bold">
                      {selectedTurno ? `${fecha} (${selectedTurno.horaInicio} – ${selectedTurno.horaFin})` : 'Sin horario'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Total a Pagar</span>
                  <span className="font-heading text-lg font-bold text-[#d97706]">
                    {selectedServicio ? `Bs ${selectedServicio.precioBase.toFixed(2)}` : 'Bs 0.00'}
                  </span>
                </div>
              </div>

              {/* Botón de Confirmación */}
              <button
                onClick={handleConfirmarClick}
                disabled={!isFormComplete || bookingLoading}
                className={`w-full py-4 px-6 font-heading font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isFormComplete && !bookingLoading
                    ? 'bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] border border-[#d97706] cursor-pointer shadow-lg active:translate-y-0.5'
                    : 'bg-[#1a1713] text-[#736a5c] border border-[#24211c] cursor-not-allowed'
                }`}
              >
                {bookingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                    <span>Procesando Reserva en Tiempo Real...</span>
                  </>
                ) : !isFormComplete ? (
                  <>
                    <Lock className="w-4 h-4 text-[#736a5c]" />
                    <span>Selecciona Servicio, Barbero y Horario para Confirmar</span>
                  </>
                ) : !currentUser ? (
                  <>
                    <User className="w-4 h-4 text-[#0a0a0a]" />
                    <span>Confirmar Reserva (Identifícate para Continuar)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#0a0a0a]" />
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
