import React, { useState } from 'react';
import { User, Mail, Phone, Lock, X, AlertCircle } from 'lucide-react';
import { registrarCliente } from '../services/clienteService';
import { BarberScissorsIcon } from './LandingHome';
import type { Cliente } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cliente: Cliente, token?: string) => void;
  initialMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMessage,
}) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await registrarCliente({
        nombre: nombre.trim(),
        correo: correo.trim(),
        telefono: telefono.trim(),
        contrasena,
      });

      onSuccess(res.cliente, res.token);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in font-sans">
      <div className="bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-[#f5f1e8]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#a39b8d] hover:text-[#f5f1e8] p-1.5 hover:bg-[#1a1713] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#d97706]/50 bg-[#1a1713] text-[#d97706] text-xs font-heading font-bold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Identificación Requerida • Cita Segura</span>
          </div>
          <h3 className="text-2xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
            Registro Rápido de Cliente
          </h3>
          <p className="text-xs text-[#a39b8d] mt-1 font-light">
            {initialMessage || 'Para confirmar y asegurar tu turno exclusivo en BarberLosPeluchitos, completa tus datos.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
              Nombre Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Dennis Morales"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-sm focus:border-[#d97706] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-sm focus:border-[#d97706] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
              Teléfono Celular *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="Ej: 71234567"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#38332b] text-[#f5f1e8] text-sm focus:border-[#d97706] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
              Contraseña Segura (mín. 6 caracteres) *
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
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <BarberScissorsIcon className="w-4 h-4" />
                <span>Continuar con la Reserva</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
