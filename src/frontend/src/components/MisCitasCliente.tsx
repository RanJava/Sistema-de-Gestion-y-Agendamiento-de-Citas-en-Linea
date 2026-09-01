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
  Pencil,
  Trash2,
  ShieldOff,
  Save,
  X,
} from 'lucide-react';
import { citaService } from '../services/citaService';
import { clienteService, type RectificarCuentaDto } from '../services/clienteService';
import { useAuth } from '../contexts/AuthContext';
import { BarberScissorsIcon } from './LandingHome';
import type { CitaResponseDto } from '../types/cita';

// ─── Modal de confirmación de baja ────────────────────────────────────────────

interface ModalBajaProps {
  onConfirmar: () => void;
  onCancelar: () => void;
  procesando: boolean;
}

const ModalConfirmacionBaja: React.FC<ModalBajaProps> = ({ onConfirmar, onCancelar, procesando }) => {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const TEXTO_REQUERIDO = 'ELIMINAR MIS DATOS';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-[#881337] max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="bg-[#1f080c] border-b border-[#881337] p-5 flex items-center gap-3">
          <ShieldOff className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-rose-300">
              Eliminar mi cuenta y mis datos
            </h3>
            <p className="text-[10px] text-rose-400/70 mt-0.5">Habeas Data — CPE Art. 130 / Ley 164</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {paso === 1 ? (
            <>
              <div className="bg-[#0a0a0a] border border-[#38332b] p-4 space-y-2 text-xs text-[#d4ccbd] leading-relaxed">
                <p className="font-heading font-bold text-[#f5f1e8] uppercase tracking-wide text-[11px] mb-3">
                  ⚠️ Antes de continuar, lee esto cuidadosamente:
                </p>
                <p>
                  <strong className="text-rose-300">Tu cuenta quedará desactivada permanentemente</strong> y no podrás volver a ingresar al sistema con este correo.
                </p>
                <p>
                  Tus datos personales (<strong>nombre, correo, teléfono</strong>) serán{' '}
                  <strong className="text-rose-300">sobrescritos con valores no recuperables</strong> conforme al derecho de supresión.
                </p>
                <p className="text-[#8c8273]">
                  📋 <strong className="text-[#a39b8d]">El historial de tus citas se conserva de forma anónima</strong> (sin vínculo a tus datos personales) por obligación mercantil del Código de Comercio Art. 36, pero no podrás consultarlo nuevamente.
                </p>
                <p className="text-[#8c8273]">
                  Esta acción <strong className="text-rose-300">es irreversible</strong>.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onCancelar}
                  className="flex-1 py-2.5 bg-[#121212] hover:bg-[#1a1713] text-[#f5f1e8] text-xs font-heading font-bold uppercase tracking-wider border border-[#38332b] transition-colors cursor-pointer"
                >
                  Cancelar — Mantener mi cuenta
                </button>
                <button
                  onClick={() => setPaso(2)}
                  className="flex-1 py-2.5 bg-[#1f080c] hover:bg-[#2d0a10] text-rose-300 text-xs font-heading font-bold uppercase tracking-wider border border-[#881337] transition-colors cursor-pointer"
                >
                  Entiendo, continuar →
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-[#a39b8d]">
                Para confirmar, escribe exactamente:{' '}
                <strong className="text-rose-300 font-mono">{TEXTO_REQUERIDO}</strong>
              </p>
              <input
                type="text"
                value={textoConfirmacion}
                onChange={e => setTextoConfirmacion(e.target.value.toUpperCase())}
                placeholder={TEXTO_REQUERIDO}
                className="w-full bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-xs font-mono px-3 py-2.5 placeholder:text-[#4a4438] outline-none focus:border-rose-500 transition-colors"
              />
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setPaso(1); setTextoConfirmacion(''); }}
                  className="flex-1 py-2.5 bg-[#0a0a0a] hover:bg-[#1a1713] text-[#a39b8d] text-xs font-heading font-bold uppercase tracking-wider border border-[#38332b] transition-colors cursor-pointer"
                >
                  ← Volver
                </button>
                <button
                  onClick={onConfirmar}
                  disabled={textoConfirmacion !== TEXTO_REQUERIDO || procesando}
                  className="flex-1 py-2.5 bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 text-xs font-heading font-bold uppercase tracking-wider border border-[#881337] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {procesando ? (
                    <>
                      <div className="w-3 h-3 border border-rose-400 border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar definitivamente
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export const MisCitasCliente: React.FC = () => {
  const { user, logout } = useAuth();
  const [citas, setCitas] = useState<CitaResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // ── Estado del panel "Mi Cuenta" ──────────────────────────────────────────
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({
    nombre: user?.nombre ?? '',
    telefono: '',
    correo: user?.correo ?? '',
  });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);
  const [mensajePerfil, setMensajePerfil] = useState<string | null>(null);
  const [mostrarModalBaja, setMostrarModalBaja] = useState(false);
  const [procesandoBaja, setProcesandoBaja] = useState(false);

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

  // ── Rectificación de perfil ───────────────────────────────────────────────

  const handleGuardarPerfil = async () => {
    if (!user) return;
    setGuardandoPerfil(true);
    setErrorPerfil(null);
    setMensajePerfil(null);
    try {
      const dto: RectificarCuentaDto = {
        nombre: perfilForm.nombre.trim(),
        telefono: perfilForm.telefono.trim(),
        correo: perfilForm.correo.trim(),
      };
      const res = await clienteService.rectificarCuenta(user.idUsuario, dto);
      setMensajePerfil(res.mensaje);
      setEditandoPerfil(false);
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || err?.message || 'Error al actualizar los datos.';
      setErrorPerfil(msg);
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // ── Baja de cuenta ───────────────────────────────────────────────────────

  const handleConfirmarBaja = async () => {
    if (!user) return;
    setProcesandoBaja(true);
    try {
      await clienteService.darDeBaja(user.idUsuario);
      setMostrarModalBaja(false);
      // Cerrar sesión automáticamente: el token JWT ya no sirve y los datos PII fueron eliminados
      logout();
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || err?.message || 'Error al procesar la baja.';
      setErrorPerfil(msg);
      setMostrarModalBaja(false);
    } finally {
      setProcesandoBaja(false);
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

      {/* Modal de baja con doble confirmación */}
      {mostrarModalBaja && (
        <ModalConfirmacionBaja
          onConfirmar={handleConfirmarBaja}
          onCancelar={() => setMostrarModalBaja(false)}
          procesando={procesandoBaja}
        />
      )}

      {/* ── Panel "Mi Cuenta" ─────────────────────────────────────────────── */}
      <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] shadow-xl">
        {/* Header Mi Cuenta */}
        <div className="p-6 flex items-center justify-between gap-4 border-b border-[#1e1b16]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#d97706]/50 bg-[#1a1713] text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider mb-1">
              <User className="w-3.5 h-3.5" />
              <span>Mi Cuenta • Habeas Data</span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
              DATOS PERSONALES
            </h2>
            <p className="text-xs text-[#a39b8d] font-light">
              Rectifica o elimina tus datos conforme al Art. 130 CPE / Ley 164.
            </p>
          </div>
          {!editandoPerfil && (
            <button
              id="btn-editar-perfil"
              onClick={() => {
                setEditandoPerfil(true);
                setMensajePerfil(null);
                setErrorPerfil(null);
              }}
              className="px-4 py-2.5 bg-[#1a1713] hover:bg-[#d97706] text-[#d97706] hover:text-[#0a0a0a] text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 border border-[#d97706]/60 hover:border-[#d97706] transition-colors cursor-pointer shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar datos
            </button>
          )}
        </div>

        {/* Mensajes de perfil */}
        {mensajePerfil && (
          <div className="mx-6 mt-4 p-3 bg-[#061e14] border border-[#065f46] text-[#6ee7b7] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
            <span>{mensajePerfil}</span>
            <button onClick={() => setMensajePerfil(null)} className="ml-auto text-[#10b981] cursor-pointer">✕</button>
          </div>
        )}
        {errorPerfil && (
          <div className="mx-6 mt-4 p-3 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorPerfil}</span>
          </div>
        )}

        {/* Formulario / Vista de datos */}
        <div className="p-6 space-y-4">
          {editandoPerfil ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#8c8273]">
                    Nombre completo
                  </label>
                  <input
                    id="perfil-nombre"
                    type="text"
                    value={perfilForm.nombre}
                    onChange={e => setPerfilForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#38332b] focus:border-[#d97706] text-[#f5f1e8] text-xs px-3 py-2.5 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#8c8273]">
                    Teléfono
                  </label>
                  <input
                    id="perfil-telefono"
                    type="tel"
                    value={perfilForm.telefono}
                    onChange={e => setPerfilForm(f => ({ ...f, telefono: e.target.value }))}
                    placeholder="ej. 77123456"
                    className="w-full bg-[#0a0a0a] border border-[#38332b] focus:border-[#d97706] text-[#f5f1e8] text-xs px-3 py-2.5 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#8c8273]">
                  Correo electrónico
                </label>
                <input
                  id="perfil-correo"
                  type="email"
                  value={perfilForm.correo}
                  onChange={e => setPerfilForm(f => ({ ...f, correo: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#38332b] focus:border-[#d97706] text-[#f5f1e8] text-xs px-3 py-2.5 outline-none transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setEditandoPerfil(false); setErrorPerfil(null); }}
                  className="px-4 py-2.5 bg-transparent hover:bg-[#1a1713] text-[#a39b8d] text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 border border-[#38332b] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button
                  id="btn-guardar-perfil"
                  onClick={handleGuardarPerfil}
                  disabled={guardandoPerfil}
                  className="px-6 py-2.5 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 border border-[#d97706] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {guardandoPerfil ? (
                    <>
                      <div className="w-3 h-3 border border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0a0a0a] p-3 border border-[#1e1b16]">
                <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Nombre</span>
                <span className="font-heading font-bold text-[#f5f1e8] mt-0.5 block">{user?.nombre}</span>
              </div>
              <div className="bg-[#0a0a0a] p-3 border border-[#1e1b16]">
                <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Correo</span>
                <span className="font-heading font-bold text-[#d97706] mt-0.5 block truncate">{user?.correo}</span>
              </div>
              <div className="bg-[#0a0a0a] p-3 border border-[#1e1b16]">
                <span className="font-heading text-[10px] text-[#8c8273] uppercase block">Estado</span>
                <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-[#061e14] text-[#6ee7b7] border border-[#065f46] text-[10px] font-heading font-bold uppercase">
                  ● Activa
                </span>
              </div>
            </div>
          )}

          {/* Zona de peligro — Baja de cuenta */}
          {!editandoPerfil && (
            <div className="mt-6 border-t border-[#38332b] pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d0608] border border-[#4a1020] p-4">
                <div className="space-y-1">
                  <p className="font-heading font-bold text-xs uppercase tracking-wider text-rose-300">
                    Eliminar mi cuenta y mis datos
                  </p>
                  <p className="text-[10px] text-[#8c8273] leading-relaxed max-w-sm">
                    Ejercer el derecho de supresión (Habeas Data). Tu historial de citas se conservará de forma anónima.
                  </p>
                </div>
                <button
                  id="btn-eliminar-cuenta"
                  onClick={() => setMostrarModalBaja(true)}
                  className="px-4 py-2.5 bg-transparent hover:bg-[#1f080c] text-rose-400 hover:text-rose-300 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 border border-[#881337] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar mi cuenta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel de Citas ────────────────────────────────────────────────── */}
      <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#d97706]/50 bg-[#1a1713] text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Panel de Cliente • Mis Reservas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
            HISTORIAL DE CITAS &amp; RESERVAS
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

      {/* Mensajes globales */}
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
