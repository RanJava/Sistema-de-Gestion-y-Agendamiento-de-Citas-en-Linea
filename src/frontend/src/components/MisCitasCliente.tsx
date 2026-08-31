import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  User,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { citaService } from '../services/citaService';
import { useAuth } from '../contexts/AuthContext';
import { BarberScissorsIcon } from './LandingHome';
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
        return 'bg-[#1a1713] text-[#d97706] border-[#854d0e]';
      case 'Atendida':
        return 'bg-[#061e14] text-[#6ee7b7] border-[#065f46]';
      case 'Cancelada':
        return 'bg-[#1f080c] text-rose-300 border-[#881337]';
      default:
        return 'bg-[#121212] text-[#a39b8d] border-[#38332b]';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans text-left">
      {/* Header Clásico */}
      <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#d97706]/50 bg-[#1a1713] text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Panel de Cliente • Mis Reservas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
            HISTORIAL DE CITAS & RESERVAS
          </h2>
          <p className="text-xs text-[#a39b8d] font-light">
            Consulta el estado de tus turnos confirmados y cancela citas pendientes si lo requieres.
          </p>
        </div>

        <button
          onClick={cargarCitas}
          disabled={loading}
          className="px-4 py-2.5 bg-[#121212] hover:bg-[#1a1713] text-[#f5f1e8] hover:text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 border border-[#38332b] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#d97706]' : ''}`} />
          <span>Actualizar Lista</span>
        </button>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="p-4 bg-[#061e14] border border-[#065f46] text-[#6ee7b7] text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" />
          <span className="font-medium">{mensaje}</span>
          <button onClick={() => setMensaje(null)} className="ml-auto text-[#10b981] font-bold text-xs px-2 cursor-pointer">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="py-24 text-center text-[#a39b8d] text-xs flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
          <span className="font-heading uppercase tracking-wider">Cargando tus citas del salón...</span>
        </div>
      ) : citas.length === 0 ? (
        <div className="py-16 text-center bg-[#121212] border border-dashed border-[#38332b] p-8 space-y-3">
          <Receipt className="w-10 h-10 text-[#d97706] mx-auto opacity-75" />
          <p className="font-heading font-bold uppercase text-[#f5f1e8] text-base">No tienes citas registradas actualmente</p>
          <p className="text-xs text-[#8c8273]">
            Puedes reservar tu turno exclusivo desde la pestaña <strong>"Agendar Cita"</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {citas.map(cita => (
            <div
              key={cita.idCita}
              className="bg-[#121212] border border-[#24211c] p-6 hover:border-[#38332b] transition-all shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Info Principal */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-heading font-bold text-base uppercase text-[#f5f1e8]">
                      Cita #{cita.idCita}
                    </span>
                    <span className={`px-3 py-0.5 text-xs font-heading font-bold uppercase tracking-wider border ${getEstadoBadge(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                      <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Servicio</span>
                      <span className="font-heading font-bold uppercase text-[#f5f1e8] flex items-center gap-1.5 mt-0.5">
                        <BarberScissorsIcon className="w-3.5 h-3.5 text-[#d97706]" />
                        {cita.servicioNombre}
                      </span>
                    </div>
                    <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                      <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Maestro Barbero</span>
                      <span className="font-heading font-bold uppercase text-[#d97706] flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                        {cita.barberoNombre}
                      </span>
                    </div>
                    <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                      <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Fecha</span>
                      <span className="font-heading font-bold uppercase text-[#f5f1e8] mt-0.5 block">{cita.fecha}</span>
                    </div>
                    <div className="bg-[#0a0a0a] p-3 border border-[#24211c]">
                      <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Horario</span>
                      <span className="font-heading font-bold text-[#10b981] flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {cita.horaInicio} – {cita.horaFin}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#8c8273] pt-1">
                    <span>⏱️ Duración: <strong className="text-[#d4ccbd]">{cita.duracion} min</strong></span>
                    <span>•</span>
                    <span>Inversión: <strong className="font-heading font-bold text-[#d97706] text-sm">Bs {cita.precio.toFixed(2)}</strong></span>
                  </div>
                </div>

                {/* Acción Cancelar */}
                {cita.estado === 'Pendiente' && (
                  <button
                    onClick={() => handleCancelar(cita.idCita)}
                    disabled={cancelando === cita.idCita}
                    className="px-4 py-3 bg-transparent hover:bg-[#1f080c] text-rose-400 hover:text-rose-300 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 border border-[#881337] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {cancelando === cita.idCita ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        <span>Cancelando...</span>
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

export default MisCitasCliente;
