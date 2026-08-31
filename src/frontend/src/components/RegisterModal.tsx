import { useState } from 'react';
import { X, User, Phone, Mail, Lock, CheckCircle, AlertTriangle, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { registrarCliente } from '../services/clienteService';
import { BarberScissorsIcon } from './LandingHome';
import type { Cliente } from '../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (cliente: Cliente, token?: string) => void;
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
        onSuccess(response.cliente, response.token);
      }
    } catch (err: any) {
      console.error('Error en registro:', err);
      if (err.response?.status === 409) {
        setApiError(err.response.data?.mensaje || 'El correo electrónico ya se encuentra registrado en el sistema.');
        setErrors((prev) => ({ ...prev, correo: 'Este correo ya está en uso.' }));
      } else if (err.response?.data?.errors) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-lg overflow-hidden bg-[#121212] border border-[#24211c] border-t-4 border-t-[#d97706] shadow-2xl text-[#f5f1e8]">
        {/* Header Tradicional */}
        <div className="px-6 py-5 bg-[#0a0a0a] border-b border-[#24211c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-[#d97706] bg-[#1a1713] flex items-center justify-center text-[#d97706]">
              <BarberScissorsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
                Registro de Nuevo Cliente
              </h2>
              <p className="text-xs text-[#a39b8d] font-heading uppercase tracking-wider">
                BarberLosPeluchitos • Registro Oficial
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-[#a39b8d] hover:text-[#f5f1e8] hover:bg-[#1a1713] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {registrado ? (
            /* Vista de Éxito Editorial */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 border-2 border-[#10b981] bg-[#061e14] text-[#10b981] flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
                ¡Cuenta Registrada con Éxito!
              </h3>
              <p className="text-sm text-[#d4ccbd] max-w-sm mx-auto font-light">
                Bienvenido <span className="text-[#d97706] font-bold font-heading">{registrado.nombre}</span>. Tu membresía ha sido creada en el sistema.
              </p>

              <div className="p-4 bg-[#0a0a0a] border border-[#24211c] text-left text-xs space-y-2.5 mt-4">
                <div className="flex justify-between text-[#a39b8d]">
                  <span className="font-heading uppercase">Código de Cliente:</span>
                  <span className="font-mono text-[#f5f1e8] font-bold">#{registrado.idCliente}</span>
                </div>
                <div className="flex justify-between text-[#a39b8d]">
                  <span className="font-heading uppercase">Correo Registrado:</span>
                  <span className="text-[#f5f1e8] font-medium">{registrado.correo}</span>
                </div>
                <div className="flex justify-between text-[#a39b8d]">
                  <span className="font-heading uppercase">Teléfono / WhatsApp:</span>
                  <span className="text-[#f5f1e8]">{registrado.telefono}</span>
                </div>
                <div className="flex justify-between text-[#a39b8d]">
                  <span className="font-heading uppercase">Fecha:</span>
                  <span className="text-[#f5f1e8]">{registrado.fechaRegistro}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full py-3.5 px-4 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] font-heading font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-[#d97706] transition-colors cursor-pointer"
                >
                  <span>Continuar al Salón</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de Registro */
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Alerta de Error de API */}
              {apiError && (
                <div className="p-3 bg-[#1f080c] border border-[#881337] text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Campo Nombre */}
              <div>
                <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
                  Nombre Completo <span className="text-[#d97706]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Carlos Mendoza"
                    className={`w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border ${
                      errors.nombre ? 'border-rose-600' : 'border-[#38332b] focus:border-[#d97706]'
                    } text-sm text-[#f5f1e8] placeholder-[#736a5c] outline-none transition-all`}
                  />
                </div>
                {errors.nombre && <p className="text-xs text-rose-400 mt-1">{errors.nombre}</p>}
              </div>

              {/* Campo Teléfono */}
              <div>
                <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
                  Teléfono / WhatsApp <span className="text-[#d97706]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej. +591 70012345"
                    className={`w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border ${
                      errors.telefono ? 'border-rose-600' : 'border-[#38332b] focus:border-[#d97706]'
                    } text-sm text-[#f5f1e8] placeholder-[#736a5c] outline-none transition-all`}
                  />
                </div>
                {errors.telefono && <p className="text-xs text-rose-400 mt-1">{errors.telefono}</p>}
              </div>

              {/* Campo Correo */}
              <div>
                <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
                  Correo Electrónico <span className="text-[#d97706]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="cliente@ejemplo.com"
                    className={`w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border ${
                      errors.correo ? 'border-rose-600' : 'border-[#38332b] focus:border-[#d97706]'
                    } text-sm text-[#f5f1e8] placeholder-[#736a5c] outline-none transition-all`}
                  />
                </div>
                {errors.correo && <p className="text-xs text-rose-400 mt-1">{errors.correo}</p>}
              </div>

              {/* Campo Contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
                    Contraseña <span className="text-[#d97706]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-3" />
                    <input
                      type="password"
                      name="contrasena"
                      value={formData.contrasena}
                      onChange={handleChange}
                      placeholder="Mín. 6 caracteres"
                      className={`w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border ${
                        errors.contrasena ? 'border-rose-600' : 'border-[#38332b] focus:border-[#d97706]'
                      } text-sm text-[#f5f1e8] placeholder-[#736a5c] outline-none transition-all`}
                    />
                  </div>
                  {errors.contrasena && <p className="text-xs text-rose-400 mt-1">{errors.contrasena}</p>}
                </div>

                <div>
                  <label className="block text-xs font-heading uppercase tracking-wider font-bold text-[#d4ccbd] mb-1.5">
                    Confirmar Contraseña <span className="text-[#d97706]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#736a5c] absolute left-3.5 top-3" />
                    <input
                      type="password"
                      name="confirmarContrasena"
                      value={formData.confirmarContrasena}
                      onChange={handleChange}
                      placeholder="Repite la clave"
                      className={`w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border ${
                        errors.confirmarContrasena ? 'border-rose-600' : 'border-[#38332b] focus:border-[#d97706]'
                      } text-sm text-[#f5f1e8] placeholder-[#736a5c] outline-none transition-all`}
                    />
                  </div>
                  {errors.confirmarContrasena && (
                    <p className="text-xs text-rose-400 mt-1">{errors.confirmarContrasena}</p>
                  )}
                </div>
              </div>

              {/* Nota de Seguridad Normativa */}
              <div className="flex items-center gap-2 p-3 bg-[#0a0a0a] border border-[#24211c] text-[11px] text-[#a39b8d]">
                <Shield className="w-4 h-4 text-[#d97706] shrink-0" />
                <span>
                  Protección de datos conforme a la <strong>Ley N° 164</strong> y <strong>D.S. N° 1793</strong> (cifrado con salting criptográfico).
                </span>
              </div>

              {/* Botón de Envío */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] font-heading font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-[#d97706] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando cliente...</span>
                    </>
                  ) : (
                    <>
                      <span>Completar Registro</span>
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
