import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, Shield, User, AlertCircle } from 'lucide-react';
import { loginCliente, loginAdmin } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { BarberScissorsIcon } from './LandingHome';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-150 font-sans">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#a39b8d] hover:text-[#f5f1e8] p-1.5 hover:bg-[#1a1713] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#d97706]/50 bg-[#1a1713] text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Acceso Seguro • BarberLosPeluchitos</span>
          </div>
          <h3 className="text-2xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
            Iniciar Sesión
          </h3>
          <p className="text-xs text-[#a39b8d] mt-1 font-light">
            Ingresa tus credenciales para gestionar citas y preferencias en nuestro salón.
          </p>
        </div>

        {/* Pestañas Cliente / Admin */}
        <div className="grid grid-cols-2 gap-1 bg-[#0a0a0a] p-1 border border-[#24211c] mb-5">
          <button
            onClick={() => switchTab('cliente')}
            className={`py-2 px-3 text-xs font-heading uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'cliente'
              ? 'bg-[#d97706] text-[#0a0a0a]'
              : 'text-[#a39b8d] hover:text-[#f5f1e8] hover:bg-[#121212]'
              }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Cliente</span>
          </button>
          <button
            onClick={() => switchTab('admin')}
            className={`py-2 px-3 text-xs font-heading uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'admin'
              ? 'bg-[#d97706] text-[#0a0a0a]'
              : 'text-[#a39b8d] hover:text-[#f5f1e8] hover:bg-[#121212]'
              }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Administrador</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}


        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder={activeTab === 'admin' ? 'admin@peluchitos.com' : 'cliente@peluchitos.com'}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-sm focus:border-[#d97706] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-sm focus:border-[#d97706] outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] font-heading font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-[#d97706] transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Ingresar como {activeTab === 'cliente' ? 'Cliente' : 'Administrador'}</span>
              </>
            )}
          </button>
        </form>

        {/* Link a Registro */}
        {activeTab === 'cliente' && (
          <div className="mt-6 pt-4 border-t border-[#24211c] text-center">
            <p className="text-xs text-[#a39b8d]">
              ¿Primera vez en el salón?{' '}
              <button
                onClick={() => { onClose(); onOpenRegistro(); }}
                className="text-[#d97706] hover:text-[#b45309] font-heading uppercase tracking-wider font-bold cursor-pointer inline-flex items-center gap-1 ml-1"
              >
                <BarberScissorsIcon className="w-3 h-3" />
                <span>Crear Cuenta</span>
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
