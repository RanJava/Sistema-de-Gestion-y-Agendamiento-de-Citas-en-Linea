import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  X, 
  Phone, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Save, 
  Sparkles,
  Scissors
} from 'lucide-react';
import { barberoService } from '../services/barberoService';
import type {
  BarberoResponseDto,
  HorarioDto,
  RegistrarBarberoDto,
} from '../types/barbero';
import { DIAS_SEMANA } from '../types/barbero';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIAS_LABEL: Record<string, string> = {
  Lunes: 'LUN', Martes: 'MAR', Miercoles: 'MIÉ',
  Jueves: 'JUE', Viernes: 'VIE', Sabado: 'SÁB', Domingo: 'DOM',
};

const emptyHorario = (): HorarioDto => ({ diaSemana: 'Lunes', horaInicio: '08:00', horaFin: '17:00' });

// ─── Sub-componente: Badge de día ─────────────────────────────────────────────

const DiaBadge = ({ dia }: { dia: string }) => (
  <span className="font-mono text-[10px] uppercase font-bold bg-[#1a1713] text-[#d97706] px-2 py-0.5 border border-[#854d0e]/40">
    {DIAS_LABEL[dia] ?? dia}
  </span>
);

// ─── Sub-componente: Editor de horarios ──────────────────────────────────────

interface HorarioEditorProps {
  horarios: HorarioDto[];
  onChange: (horarios: HorarioDto[]) => void;
}

const HorarioEditor: React.FC<HorarioEditorProps> = ({ horarios, onChange }) => {
  const agregar = () => onChange([...horarios, emptyHorario()]);

  const eliminar = (i: number) => onChange(horarios.filter((_, idx) => idx !== i));

  const actualizar = (i: number, campo: keyof HorarioDto, valor: string) => {
    const copia = horarios.map((h, idx) => (idx === i ? { ...h, [campo]: valor } : h));
    onChange(copia);
  };

  return (
    <div className="space-y-2.5">
      {horarios.map((h, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 p-2.5 bg-[#0a0a0a] border border-[#24211c]">
          <select
            value={h.diaSemana}
            onChange={e => actualizar(i, 'diaSemana', e.target.value)}
            className="px-2.5 py-1.5 bg-[#121212] border border-[#38332b] text-[#f5f1e8] text-xs font-semibold uppercase tracking-wider focus:border-[#d97706] outline-none cursor-pointer"
          >
            {DIAS_SEMANA.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <input
            type="time"
            value={h.horaInicio}
            onChange={e => actualizar(i, 'horaInicio', e.target.value)}
            className="px-2 py-1.5 bg-[#121212] border border-[#38332b] text-[#f5f1e8] text-xs font-mono focus:border-[#d97706] outline-none"
          />
          <span className="text-[#8c8273] font-bold">–</span>
          <input
            type="time"
            value={h.horaFin}
            onChange={e => actualizar(i, 'horaFin', e.target.value)}
            className="px-2 py-1.5 bg-[#121212] border border-[#38332b] text-[#f5f1e8] text-xs font-mono focus:border-[#d97706] outline-none"
          />

          <button
            type="button"
            onClick={() => eliminar(i)}
            className="p-1.5 bg-[#1f080c] hover:bg-[#320e17] text-rose-400 border border-[#881337] text-xs transition-colors cursor-pointer disabled:opacity-40 ml-auto"
            title="Eliminar franja"
            disabled={horarios.length === 1}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <button 
        type="button" 
        onClick={agregar} 
        className="w-full py-2 bg-[#121212] hover:bg-[#1a1713] text-[#d97706] hover:text-[#f5f1e8] border border-dashed border-[#38332b] hover:border-[#d97706] text-xs font-heading font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Agregar franja horaria</span>
      </button>
    </div>
  );
};

// ─── Sub-componente: Formulario de registro ───────────────────────────────────

interface FormRegistroProps {
  onSuccess: (barbero: BarberoResponseDto) => void;
  onCancel: () => void;
}

const FormRegistroBarbero: React.FC<FormRegistroProps> = ({ onSuccess, onCancel }) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [horarios, setHorarios] = useState<HorarioDto[]>([emptyHorario()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !telefono.trim()) {
      setError('Nombre y teléfono son obligatorios.');
      return;
    }

    // Validación HU-02 Criterio 3: hora_fin > hora_inicio
    for (const h of horarios) {
      if (h.horaFin <= h.horaInicio) {
        setError(`Error en franja de ${h.diaSemana}: La hora de fin (${h.horaFin}) debe ser estrictamente posterior a la hora de inicio (${h.horaInicio}).`);
        return;
      }
    }

    const dto: RegistrarBarberoDto = {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      horarios,
    };

    setLoading(true);
    try {
      const res = await barberoService.registrar(dto);
      onSuccess(res.barbero);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] border border-[#24211c] p-6 sm:p-7 shadow-2xl text-left space-y-5 animate-in fade-in zoom-in-95 font-sans">
      <div className="flex items-center justify-between border-b border-[#24211c] pb-3">
        <h3 className="font-heading font-bold text-lg uppercase tracking-wider text-[#f5f1e8] flex items-center gap-2">
          <Scissors className="w-4 h-4 text-[#d97706]" />
          <span>Registrar Nuevo Maestro Barbero</span>
        </h3>
        <button onClick={onCancel} className="text-[#a39b8d] hover:text-[#f5f1e8] p-1 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-nombre" className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
              Nombre Completo *
            </label>
            <input
              id="reg-nombre"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Carlos Mendoza"
              maxLength={50}
              required
              className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-xs focus:border-[#d97706] outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-telefono" className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
              Teléfono de Contacto / WhatsApp *
            </label>
            <input
              id="reg-telefono"
              type="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="Ej. 72345678"
              maxLength={20}
              required
              className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-xs focus:border-[#d97706] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1">
            Horarios de Disponibilidad Semanal
          </label>
          <p className="text-[11px] text-[#8c8273] mb-2.5">
            Se requiere al menos una jornada. La hora de fin debe ser estrictamente posterior a la de inicio.
          </p>
          <HorarioEditor horarios={horarios} onChange={setHorarios} />
        </div>

        {error && (
          <div className="p-3.5 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#24211c]">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-5 py-2.5 bg-[#121212] hover:bg-[#1a1713] text-[#cfc7b8] text-xs font-heading font-bold uppercase tracking-wider border border-[#38332b] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="px-6 py-2.5 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] text-xs font-heading font-bold uppercase tracking-wider border border-[#d97706] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Registrando…' : 'Registrar Barbero'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Sub-componente: Tarjeta de barbero ───────────────────────────────────────

interface BarberoCardProps {
  barbero: BarberoResponseDto;
  onActualizarHorarios: (id: number, horarios: HorarioDto[]) => Promise<void>;
  onActualizarDatos: (id: number, nombre: string, telefono: string) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

const BarberoCard: React.FC<BarberoCardProps> = ({ barbero, onActualizarHorarios, onActualizarDatos, onEliminar }) => {
  const [editandoDatos, setEditandoDatos] = useState(false);
  const [editandoHorarios, setEditandoHorarios] = useState(false);
  const [nombre, setNombre] = useState(barbero.nombre);
  const [telefono, setTelefono] = useState(barbero.telefono);
  const [horarios, setHorarios] = useState<HorarioDto[]>(
    barbero.horarios.map(h => ({ diaSemana: h.diaSemana, horaInicio: h.horaInicio, horaFin: h.horaFin }))
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState<string | null>(null);

  const guardarDatos = async () => {
    setError(null);
    setLoading(true);
    try {
      await onActualizarDatos(barbero.idBarbero, nombre, telefono);
      setEditandoDatos(false);
      mostrarExito('Datos actualizados correctamente.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar datos.');
    } finally {
      setLoading(false);
    }
  };

  const guardarHorarios = async () => {
    setError(null);

    // Validación HU-02 Criterio 3
    for (const h of horarios) {
      if (h.horaFin <= h.horaInicio) {
        setError(`Error en franja de ${h.diaSemana}: La hora de fin (${h.horaFin}) debe ser estrictamente posterior a la hora de inicio (${h.horaInicio}).`);
        return;
      }
    }

    setLoading(true);
    try {
      await onActualizarHorarios(barbero.idBarbero, horarios);
      setEditandoHorarios(false);
      mostrarExito('Disponibilidad actualizada en tiempo real.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar horarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${barbero.nombre} del staff?`)) return;
    setLoading(true);
    try {
      await onEliminar(barbero.idBarbero);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar barbero.');
      setLoading(false);
    }
  };

  const mostrarExito = (msg: string) => {
    setExito(msg);
    setTimeout(() => setExito(null), 4000);
  };

  return (
    <div className={`bg-[#121212] border ${!barbero.tieneHorarioCargado ? 'border-[#881337]' : 'border-[#24211c] hover:border-[#38332b]'} p-5 sm:p-6 shadow-xl transition-all text-left space-y-4`}>
      <div className="flex items-start justify-between gap-3 border-b border-[#24211c] pb-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 bg-[#1a1713] text-[#d97706] border-2 border-[#d97706] font-heading font-bold text-lg flex items-center justify-center shrink-0">
            {barbero.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            {editandoDatos ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="px-2.5 py-1 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-xs focus:border-[#d97706] outline-none"
                  placeholder="Nombre"
                  maxLength={50}
                />
                <input
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  className="px-2.5 py-1 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-xs focus:border-[#d97706] outline-none block"
                  placeholder="Teléfono"
                  maxLength={20}
                />
              </div>
            ) : (
              <>
                <h4 className="font-heading font-bold text-base sm:text-lg uppercase text-[#f5f1e8] truncate">{barbero.nombre}</h4>
                <p className="text-xs text-[#a39b8d] font-mono flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3 h-3 text-[#d97706]" />
                  {barbero.telefono}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {editandoDatos ? (
            <>
              <button 
                onClick={guardarDatos} 
                disabled={loading} 
                className="px-3 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] text-xs font-heading font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {loading ? '…' : 'Guardar'}
              </button>
              <button 
                onClick={() => { setEditandoDatos(false); setNombre(barbero.nombre); setTelefono(barbero.telefono); }} 
                className="px-3 py-1.5 bg-[#121212] hover:bg-[#1a1713] text-[#cfc7b8] text-xs font-heading font-bold uppercase tracking-wider border border-[#38332b] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setEditandoDatos(true)} 
                className="p-2 bg-[#0a0a0a] hover:bg-[#1a1713] text-[#a39b8d] hover:text-[#d97706] border border-[#24211c] hover:border-[#d97706] transition-colors cursor-pointer" 
                title="Editar datos"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleEliminar} 
                disabled={loading} 
                className="p-2 bg-[#1f080c] hover:bg-[#320e17] text-rose-400 border border-[#881337] transition-colors cursor-pointer disabled:opacity-50" 
                title="Eliminar barbero"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Estado del Barbero */}
      {!barbero.tieneHorarioCargado && (
        <div className="bg-[#1f080c] border border-[#881337] px-3 py-1.5 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>Sin horario cargado (no aparecerá disponible en el agendamiento).</span>
        </div>
      )}

      {/* Horarios de Disponibilidad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-[#8c8273]">
            Disponibilidad Semanal
          </span>
          {!editandoHorarios && (
            <button 
              onClick={() => setEditandoHorarios(true)} 
              className="text-xs text-[#d97706] hover:text-[#f5f1e8] font-heading font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Editar Horarios</span>
            </button>
          )}
        </div>

        {editandoHorarios ? (
          <div className="space-y-3">
            <HorarioEditor horarios={horarios} onChange={setHorarios} />
            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={guardarHorarios} 
                disabled={loading} 
                className="px-4 py-2 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] text-xs font-heading font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Guardando…' : 'Guardar Disponibilidad'}</span>
              </button>
              <button
                onClick={() => {
                  setEditandoHorarios(false);
                  setHorarios(barbero.horarios.map(h => ({ diaSemana: h.diaSemana, horaInicio: h.horaInicio, horaFin: h.horaFin })));
                }}
                className="px-4 py-2 bg-[#121212] hover:bg-[#1a1713] text-[#cfc7b8] text-xs font-heading font-bold uppercase tracking-wider border border-[#38332b] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : barbero.horarios.length === 0 ? (
          <p className="text-xs text-[#736a5c] italic bg-[#0a0a0a] p-3 border border-[#24211c]">
            Sin franjas horarias configuradas.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {barbero.horarios.map(h => (
              <div key={h.idHorario} className="flex items-center justify-between p-2 bg-[#0a0a0a] border border-[#24211c] text-xs">
                <DiaBadge dia={h.diaSemana} />
                <span className="font-mono text-[#f5f1e8]">{h.horaInicio} – {h.horaFin}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {exito && (
        <div className="p-3 bg-[#061e14] border border-[#065f46] text-[#6ee7b7] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
          <span>{exito}</span>
        </div>
      )}
    </div>
  );
};

// ─── Componente principal: Panel de Administración ───────────────────────────

export const AdminBarberos: React.FC = () => {
  const [barberos, setBarberos] = useState<BarberoResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [exito, setExito] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await barberoService.obtenerTodos();
      setBarberos(data);
    } catch {
      setError('No se pudo cargar el listado de barberos. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleRegistroExito = (nuevo: BarberoResponseDto) => {
    setBarberos(prev => [...prev, nuevo]);
    setMostrarFormulario(false);
    setExito(`Barbero '${nuevo.nombre}' registrado y visible en el listado de staff.`);
    setTimeout(() => setExito(null), 5000);
  };

  const handleActualizarHorarios = async (id: number, horarios: HorarioDto[]) => {
    const res = await barberoService.actualizarHorarios(id, { horarios });
    setBarberos(prev => prev.map(b => b.idBarbero === id ? res.barbero : b));
  };

  const handleActualizarDatos = async (id: number, nombre: string, telefono: string) => {
    const res = await barberoService.actualizarDatos(id, nombre, telefono);
    setBarberos(prev => prev.map(b => b.idBarbero === id ? res.barbero : b));
  };

  const handleEliminar = async (id: number) => {
    await barberoService.eliminar(id);
    setBarberos(prev => prev.filter(b => b.idBarbero !== id));
    setExito('Barbero eliminado del staff correctamente.');
    setTimeout(() => setExito(null), 4000);
  };

  const barberosFiltrados = barberos.filter(b =>
    b.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    b.telefono.includes(busqueda)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Encabezado */}
      <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] p-6 sm:p-8 shadow-2xl relative text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-heading font-bold uppercase tracking-wider bg-[#1a1713] text-[#d97706] border border-[#d97706]/40 mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>Gestión de Staff & Turnos • HU-02</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
              Equipo de Maestros Barberos
            </h2>
            <p className="text-xs text-[#a39b8d] font-light mt-1">
              Administra los profesionales del salón y sus horarios de atención semanal en tiempo real.
            </p>
          </div>
          <button
            onClick={() => setMostrarFormulario(v => !v)}
            className="px-5 py-2.5 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] text-xs font-heading font-bold uppercase tracking-wider border border-[#d97706] transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto shrink-0"
            id="btn-nuevo-barbero"
          >
            {mostrarFormulario ? (
              <>
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Nuevo Barbero</span>
              </>
            )}
          </button>
        </div>

        {/* Stats rápidas en tarjetas sólidas */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="p-4 bg-[#0a0a0a] border border-[#24211c] text-left">
              <span className="text-2xl sm:text-3xl font-bold font-heading text-[#f5f1e8] block leading-none">{barberos.length}</span>
              <span className="text-[10px] text-[#8c8273] font-heading font-bold uppercase tracking-widest block mt-2">Total Staff</span>
            </div>
            <div className="p-4 bg-[#061e14] border border-[#065f46] text-left">
              <span className="text-2xl sm:text-3xl font-bold font-heading text-[#6ee7b7] block leading-none">{barberos.filter(b => b.tieneHorarioCargado).length}</span>
              <span className="text-[10px] text-[#8c8273] font-heading font-bold uppercase tracking-widest block mt-2">Con Disponibilidad Activa</span>
            </div>
            <div className="p-4 bg-[#1f080c] border border-[#881337] text-left">
              <span className="text-2xl sm:text-3xl font-bold font-heading text-rose-400 block leading-none">{barberos.filter(b => !b.tieneHorarioCargado).length}</span>
              <span className="text-[10px] text-[#8c8273] font-heading font-bold uppercase tracking-widest block mt-2">Sin Horarios (Ocultos)</span>
            </div>
          </div>
        )}

        {/* Buscador */}
        {barberos.length > 0 && (
          <div className="mt-6">
            <div className="relative">
              <Search className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar barbero por nombre o teléfono..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-xs focus:border-[#d97706] outline-none transition-all placeholder:text-[#736a5c]"
                id="buscar-barbero"
              />
            </div>
          </div>
        )}
      </div>

      {/* Formulario de registro */}
      {mostrarFormulario && (
        <FormRegistroBarbero
          onSuccess={handleRegistroExito}
          onCancel={() => setMostrarFormulario(false)}
        />
      )}

      {exito && (
        <div className="p-3.5 bg-[#061e14] border border-[#065f46] text-[#6ee7b7] text-xs flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#10b981] shrink-0" />
          <span>{exito}</span>
        </div>
      )}

      {/* Estado de carga / error */}
      {loading && (
        <div className="py-20 text-center text-[#a39b8d] text-sm flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d97706] border-t-transparent rounded-full animate-spin" />
          <span>Cargando equipo de barberos…</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-3.5 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={cargar} className="text-[#d97706] hover:underline font-bold text-xs cursor-pointer">Reintentar</button>
        </div>
      )}

      {/* Listado de Barberos */}
      {!loading && !error && (
        <>
          {barberosFiltrados.length === 0 ? (
            <div className="py-16 text-center bg-[#121212] border border-[#24211c] p-8 space-y-3">
              <Users className="w-10 h-10 text-[#d97706] mx-auto opacity-50" />
              <p className="text-sm font-heading font-bold uppercase tracking-wider text-[#f5f1e8]">
                {busqueda ? 'No se encontraron barberos con ese criterio.' : 'Aún no hay barberos registrados.'}
              </p>
              <p className="text-xs text-[#a39b8d]">Haz clic en "+ Nuevo Barbero" para sumar miembros al staff.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="listado-barberos">
              {barberosFiltrados.map(b => (
                <BarberoCard
                  key={b.idBarbero}
                  barbero={b}
                  onActualizarHorarios={handleActualizarHorarios}
                  onActualizarDatos={handleActualizarDatos}
                  onEliminar={handleEliminar}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminBarberos;
