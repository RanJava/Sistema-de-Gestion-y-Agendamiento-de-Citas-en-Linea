import { useState } from 'react';
import { X, User, Phone, Mail, Lock, CheckCircle, AlertTriangle, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { registrarCliente } from '../services/clienteService';
import type { Cliente } from '../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (cliente: Cliente) => void;
}

export function RegisterModal({ isOpen, onClose, onSuccess }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrado, setRegistrado] = useState<Cliente | null>(null);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // 1. Nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre completo es obligatorio.';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    } else if (formData.nombre.trim().length > 50) {
      newErrors.nombre = 'El nombre no puede exceder los 50 caracteres.';
    }

    // 2. Teléfono
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono o WhatsApp de contacto es obligatorio.';
    } else if (formData.telefono.trim().length < 7) {
      newErrors.telefono = 'El número de teléfono debe tener al menos 7 dígitos.';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.telefono.trim())) {
      newErrors.telefono = 'Formato de teléfono no válido.';
    }

    // 3. Correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(formData.correo.trim())) {
      newErrors.correo = 'Ingresa un formato de correo electrónico válido.';
    } else if (formData.correo.trim().length > 100) {
      newErrors.correo = 'El correo no puede superar los 100 caracteres.';
    }

    // 4. Contraseña
    if (!formData.contrasena) {
      newErrors.contrasena = 'La contraseña es obligatoria.';
    } else if (formData.contrasena.length < 6) {
      newErrors.contrasena = 'La contraseña debe contener al menos 6 caracteres.';
    }

    // 5. Confirmar Contraseña
    if (formData.contrasena !== formData.confirmarContrasena) {
      newErrors.confirmarContrasena = 'Las contraseñas no coinciden.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo modificado
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
    if (apiError) setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registrarCliente({
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        correo: formData.correo.trim().toLowerCase(),
        contrasena: formData.contrasena,
      });

      setRegistrado(response.cliente);
      if (onSuccess) {
        onSuccess(response.cliente);
      }
    } catch (err: any) {
      console.error('Error en registro:', err);
      if (err.response?.status === 409) {
        setApiError(err.response.data?.mensaje || 'El correo electrónico ya se encuentra registrado en el sistema.');
        setErrors((prev) => ({ ...prev, correo: 'Este correo ya está en uso.' }));
      } else if (err.response?.data?.errors) {
        // Errores de validación de ModelState de ASP.NET Core
        const backendErrors = err.response.data.errors;
        const mappedErrors: { [key: string]: string } = {};
        for (const key in backendErrors) {
          mappedErrors[key.toLowerCase()] = backendErrors[key][0];
        }
        setErrors(mappedErrors);
        setApiError('Por favor verifica los campos resaltados.');
      } else if (err.response?.data?.mensaje) {
        setApiError(err.response.data.mensaje);
      } else {
        setApiError('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setFormData({
      nombre: '',
      telefono: '',
      correo: '',
      contrasena: '',
      confirmarContrasena: '',
    });
    setErrors({});
    setApiError(null);
    setRegistrado(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-amber-950/20 text-slate-100">
        {/* Header con gradiente */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Registro de Cuenta de Cliente</h2>
              <p className="text-xs text-slate-400">HU-01 • BarberLosPeluchitos</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {registrado ? (
            /* Vista de Éxito */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">¡Cuenta Creada Exitosamente!</h3>
              <p className="text-sm text-slate-300 max-w-sm mx-auto">
                Bienvenido <span className="text-amber-400 font-semibold">{registrado.nombre}</span>. Tu cuenta ha sido registrada en el sistema conforme a la Ley 164 y D.S. 1793.
              </p>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-2 mt-4">
                <div className="flex justify-between text-slate-400">
                  <span>ID de Cliente:</span>
                  <span className="font-mono text-slate-200">#{registrado.idCliente}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Correo:</span>
                  <span className="text-slate-200 font-medium">{registrado.correo}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Teléfono:</span>
                  <span className="text-slate-200">{registrado.telefono}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Fecha de Registro:</span>
                  <span className="text-slate-200">{registrado.fechaRegistro}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de Registro */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Alerta de Error de API */}
              {apiError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Campo Nombre */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre Completo <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Juan Pérez"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border ${
                      errors.nombre ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-amber-500'
                    } text-sm text-white placeholder-slate-500 outline-none transition-all`}
                  />
                </div>
                {errors.nombre && <p className="text-xs text-rose-400 mt-1">{errors.nombre}</p>}
              </div>

              {/* Campo Teléfono */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Teléfono / WhatsApp <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej. +591 71234567"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border ${
                      errors.telefono ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-amber-500'
                    } text-sm text-white placeholder-slate-500 outline-none transition-all`}
                  />
                </div>
                {errors.telefono && <p className="text-xs text-rose-400 mt-1">{errors.telefono}</p>}
              </div>

              {/* Campo Correo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Correo Electrónico <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="ejemplo@correo.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border ${
                      errors.correo ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-amber-500'
                    } text-sm text-white placeholder-slate-500 outline-none transition-all`}
                  />
                </div>
                {errors.correo && <p className="text-xs text-rose-400 mt-1">{errors.correo}</p>}
              </div>

              {/* Campo Contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contraseña <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      name="contrasena"
                      value={formData.contrasena}
                      onChange={handleChange}
                      placeholder="Mín. 6 caracteres"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border ${
                        errors.contrasena ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-amber-500'
                      } text-sm text-white placeholder-slate-500 outline-none transition-all`}
                    />
                  </div>
                  {errors.contrasena && <p className="text-xs text-rose-400 mt-1">{errors.contrasena}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirmar Contraseña <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      name="confirmarContrasena"
                      value={formData.confirmarContrasena}
                      onChange={handleChange}
                      placeholder="Repite la contraseña"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border ${
                        errors.confirmarContrasena ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-amber-500'
                      } text-sm text-white placeholder-slate-500 outline-none transition-all`}
                    />
                  </div>
                  {errors.confirmarContrasena && (
                    <p className="text-xs text-rose-400 mt-1">{errors.confirmarContrasena}</p>
                  )}
                </div>
              </div>

              {/* Nota de Seguridad Normativa */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Protección de datos conforme a la <strong>Ley N° 164</strong> y <strong>D.S. N° 1793</strong> (cifrado con salting).
                </span>
              </div>

              {/* Botón de Envío */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando cuenta...</span>
                    </>
                  ) : (
                    <>
                      <span>Crear Cuenta de Cliente</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
