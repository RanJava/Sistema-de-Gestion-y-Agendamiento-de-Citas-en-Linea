import React, { useState, useEffect, useCallback } from 'react';
import { barberoService } from '../services/barberoService';
import type {
  BarberoResponseDto,
  HorarioDto,
  RegistrarBarberoDto,
} from '../types/barbero';
import { DIAS_SEMANA } from '../types/barbero';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIAS_LABEL: Record<string, string> = {
  Lunes: 'Lun', Martes: 'Mar', Miercoles: 'Mié',
  Jueves: 'Jue', Viernes: 'Vie', Sabado: 'Sáb', Domingo: 'Dom',
};

const emptyHorario = (): HorarioDto => ({ diaSemana: 'Lunes', horaInicio: '08:00', horaFin: '17:00' });

// ─── Sub-componente: Badge de día ─────────────────────────────────────────────

const DiaBadge = ({ dia }: { dia: string }) => (
  <span className="dia-badge">{DIAS_LABEL[dia] ?? dia}</span>
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
    <div className="horario-editor">
      {horarios.map((h, i) => (
        <div key={i} className="horario-row">
          <select
            value={h.diaSemana}
            onChange={e => actualizar(i, 'diaSemana', e.target.value)}
            className="horario-select"
          >
            {DIAS_SEMANA.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <input
            type="time"
            value={h.horaInicio}
            onChange={e => actualizar(i, 'horaInicio', e.target.value)}
            className="horario-time"
          />
          <span className="horario-separator">–</span>
          <input
            type="time"
            value={h.horaFin}
            onChange={e => actualizar(i, 'horaFin', e.target.value)}
            className="horario-time"
          />

          <button
            type="button"
            onClick={() => eliminar(i)}
            className="btn-icon btn-remove"
            title="Eliminar franja"
            disabled={horarios.length === 1}
          >
            ✕
          </button>
        </div>
      ))}

      <button type="button" onClick={agregar} className="btn-add-horario">
        + Agregar franja horaria
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
    <div className="admin-card">
      <h3 className="card-title">Registrar nuevo barbero</h3>
      <form onSubmit={handleSubmit} className="barbero-form">
        <div className="form-group">
          <label htmlFor="reg-nombre">Nombre completo</label>
          <input
            id="reg-nombre"
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Carlos Mamani"
            maxLength={50}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reg-telefono">Teléfono de contacto</label>
          <input
            id="reg-telefono"
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="Ej. 72345678"
            maxLength={20}
            required
          />
        </div>

        <div className="form-group">
          <label>Horarios de disponibilidad</label>
          <p className="form-hint">Se requiere al menos un horario. La hora de fin debe ser posterior a la de inicio.</p>
          <HorarioEditor horarios={horarios} onChange={setHorarios} />
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Registrando…' : 'Registrar barbero'}
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
      mostrarExito('Disponibilidad actualizada. Los cambios ya se reflejan en el módulo de agendamiento.');
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
    <div className={`barbero-card ${!barbero.tieneHorarioCargado ? 'sin-horario' : ''}`}>
      <div className="barbero-card-header">
        <div className="barbero-avatar">
          {barbero.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="barbero-info">
          {editandoDatos ? (
            <div className="datos-edit">
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="inline-input"
                placeholder="Nombre"
                maxLength={50}
              />
              <input
                type="tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                className="inline-input"
                placeholder="Teléfono"
                maxLength={20}
              />
            </div>
          ) : (
            <>
              <h4 className="barbero-nombre">{barbero.nombre}</h4>
              <p className="barbero-telefono">📞 {barbero.telefono}</p>
            </>
          )}
        </div>
        <div className="barbero-badges">
          {!barbero.tieneHorarioCargado && (
            <span className="badge badge-warning" title="Este barbero no aparecerá en el módulo de agendamiento">
              Sin horario
            </span>
          )}
        </div>
        <div className="barbero-card-actions">
          {editandoDatos ? (
            <>
              <button onClick={guardarDatos} disabled={loading} className="btn-xs btn-primary">
                {loading ? '…' : 'Guardar'}
              </button>
              <button onClick={() => { setEditandoDatos(false); setNombre(barbero.nombre); setTelefono(barbero.telefono); }} className="btn-xs btn-secondary">Cancelar</button>
            </>
          ) : (
            <div className="card-actions-row">
              <button onClick={() => setEditandoDatos(true)} className="btn-xs btn-ghost" title="Editar datos">✏️ Editar</button>
              <button onClick={handleEliminar} disabled={loading} className="btn-xs btn-danger-ghost" title="Eliminar barbero">🗑️</button>
            </div>
          )}
        </div>
      </div>

      {/* Horarios */}
      <div className="barbero-horarios-section">
        <div className="horarios-header">
          <span className="horarios-label">Disponibilidad semanal</span>
          {!editandoHorarios && (
            <button onClick={() => setEditandoHorarios(true)} className="btn-xs btn-ghost">
              ✏️ Editar horarios
            </button>
          )}
        </div>

        {editandoHorarios ? (
          <div>
            <HorarioEditor horarios={horarios} onChange={setHorarios} />
            <div className="horarios-edit-actions">
              <button onClick={guardarHorarios} disabled={loading} className="btn-xs btn-primary">
                {loading ? 'Guardando…' : 'Guardar disponibilidad'}
              </button>
              <button
                onClick={() => {
                  setEditandoHorarios(false);
                  setHorarios(barbero.horarios.map(h => ({ diaSemana: h.diaSemana, horaInicio: h.horaInicio, horaFin: h.horaFin })));
                }}
                className="btn-xs btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : barbero.horarios.length === 0 ? (
          <p className="horarios-empty">Sin franjas horarias configuradas.</p>
        ) : (
          <div className="horarios-lista">
            {barbero.horarios.map(h => (
              <div key={h.idHorario} className="horario-chip">
                <DiaBadge dia={h.diaSemana} />
                <span>{h.horaInicio} – {h.horaFin}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}
    </div>
  );
};

// ─── Componente principal: Panel de Administración ───────────────────────────

const AdminBarberos: React.FC = () => {
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
    <div className="admin-panel">
      {/* Encabezado */}
      <div className="admin-header">
        <div>
          <h2 className="admin-title">👥 Gestión de Staff</h2>
          <p className="admin-subtitle">
            Administra los barberos y sus horarios de disponibilidad semanal.
          </p>
        </div>
        <button
          onClick={() => setMostrarFormulario(v => !v)}
          className="btn-primary"
          id="btn-nuevo-barbero"
        >
          {mostrarFormulario ? '✕ Cancelar' : '+ Nuevo barbero'}
        </button>
      </div>

      {/* Formulario de registro */}
      {mostrarFormulario && (
        <FormRegistroBarbero
          onSuccess={handleRegistroExito}
          onCancel={() => setMostrarFormulario(false)}
        />
      )}

      {exito && <div className="alert alert-success">{exito}</div>}

      {/* Stats rápidas */}
      {!loading && (
        <div className="admin-stats">
          <div className="stat-chip">
            <span className="stat-num">{barberos.length}</span>
            <span className="stat-label">Total staff</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num">{barberos.filter(b => b.tieneHorarioCargado).length}</span>
            <span className="stat-label">Con disponibilidad</span>
          </div>
          <div className="stat-chip stat-warning">
            <span className="stat-num">{barberos.filter(b => !b.tieneHorarioCargado).length}</span>
            <span className="stat-label">Sin horario (ocultos)</span>
          </div>
        </div>
      )}

      {/* Buscador */}
      {barberos.length > 0 && (
        <div className="admin-search">
          <input
            type="search"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar por nombre o teléfono…"
            className="search-input"
            id="buscar-barbero"
          />
        </div>
      )}

      {/* Estado de carga / error */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" /> Cargando staff…
        </div>
      )}
      {error && !loading && (
        <div className="alert alert-error">
          {error}
          <button onClick={cargar} className="btn-link">Reintentar</button>
        </div>
      )}

      {/* Listado */}
      {!loading && !error && (
        <>
          {barberosFiltrados.length === 0 ? (
            <div className="empty-state">
              {busqueda ? 'No se encontraron barberos con ese criterio.' : 'Aún no hay barberos registrados. ¡Agrega el primero!'}
            </div>
          ) : (
            <div className="barberos-grid" id="listado-barberos">
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
