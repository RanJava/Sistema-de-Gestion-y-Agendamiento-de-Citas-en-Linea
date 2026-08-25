import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, Shield, User, AlertCircle, Sparkles, Info } from 'lucide-react';
import { loginCliente, loginAdmin } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegistro: () => void;
}

type TabType = 'cliente' | 'admin';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onOpenRegistro }) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('cliente');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loginFn = activeTab === 'cliente' ? loginCliente : loginAdmin;
      const res = await loginFn({ correo: correo.trim(), contrasena });

      login(res.token, {
        idUsuario: res.idUsuario,
        nombre: res.nombre,
        correo: res.correo,
        rol: res.rol,
      });

      // Reset y cerrar
      setCorreo('');
      setContrasena('');
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { mensaje?: string } } };
        setError(axiosErr.response?.data?.mensaje ?? 'Error de autenticación.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error de conexión. Verifica que el backend esté en línea.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setError(null);
    setCorreo('');
    setContrasena('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Autenticación JWT</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Iniciar Sesión
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Ingresa tus credenciales para acceder al sistema de BarberLosPeluchitos.
          </p>
        </div>

        {/* Pestañas Cliente / Admin */}
        <div className="flex gap-1 bg-slate-950/70 p-1 rounded-2xl border border-slate-800 mb-5">
          <button
            onClick={() => switchTab('cliente')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cliente'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Acceso Cliente</span>
          </button>
          <button
            onClick={() => switchTab('admin')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Acceso Administrador</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credenciales sugeridas para Admin */}
        {activeTab === 'admin' && (
          <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-200 mb-1">Credenciales de Prueba (Seed)</p>
              <p className="font-mono text-[11px]">
                Correo: <span className="text-blue-200 select-all">admin@peluchitos.com</span>
              </p>
              <p className="font-mono text-[11px]">
                Contraseña: <span className="text-blue-200 select-all">AdminPeluchitos2026!</span>
              </p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder={activeTab === 'admin' ? 'admin@peluchitos.com' : 'cliente@peluchitos.com'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-amber-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Contraseña</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-amber-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Autenticando…</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión como {activeTab === 'cliente' ? 'Cliente' : 'Administrador'}</span>
              </>
            )}
          </button>
        </form>

        {/* Link a Registro */}
        {activeTab === 'cliente' && (
          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => { onClose(); onOpenRegistro(); }}
                className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Regístrate aquí</span>
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
