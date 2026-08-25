import { useState, useEffect } from 'react';
import { Scissors, Server, Layout, CheckCircle2, RefreshCw, AlertCircle, UserPlus, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { checkApiHealth, type HealthCheckResponse } from './services/api';
import { RegisterModal } from './components/RegisterModal';
import type { Cliente } from './types';

export function App() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [lastRegisteredClient, setLastRegisteredClient] = useState<Cliente | null>(null);

  const testConnection = async () => {
    setIsRetrying(true);
    setBackendStatus('checking');
    try {
      const data = await checkApiHealth();
      setHealthData(data);
      setBackendStatus('connected');
    } catch {
      setBackendStatus('offline');
      setHealthData(null);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    testConnection();
    const interval = setInterval(testConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                BarberLosPeluchitos
              </span>
              <span className="block text-[11px] text-slate-400 font-medium -mt-1">
                Sistema de Gestión & Agendamiento
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón de Registro HU-01 */}
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registrarse (HU-01)</span>
            </button>

            <button
              onClick={testConnection}
              disabled={isRetrying}
              title="Reintentar verificación de conexión"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              backendStatus === 'connected' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : backendStatus === 'checking'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected' 
                  ? 'bg-emerald-400 animate-pulse' 
                  : backendStatus === 'checking' 
                  ? 'bg-amber-400 animate-bounce' 
                  : 'bg-rose-400'
              }`} />
              Backend: {
                backendStatus === 'connected' 
                  ? 'En Línea' 
                  : backendStatus === 'checking' 
                  ? 'Verificando...' 
                  : 'Desconectado'
              }
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-center">
        {/* Banner de último cliente registrado si existe */}
        {lastRegisteredClient && (
          <div className="max-w-3xl mx-auto w-full mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-white">Último cliente registrado:</p>
                <p className="text-xs">{lastRegisteredClient.nombre} ({lastRegisteredClient.correo}) • ID #{lastRegisteredClient.idCliente}</p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
              HU-01 OK
            </span>
          </div>
        )}

        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 border ${
            backendStatus === 'connected'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {backendStatus === 'connected' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Backend Conectado: {healthData?.system ?? 'API Activa'}
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                Esperando respuesta del servicio en /api/health
              </>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Módulo <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">HU-01: Registro de Clientes</span> Implementado
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Se ha implementado el endpoint <code className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded text-sm">POST /api/cuentas/registro</code> con hash seguro BCrypt (Ley 164 / D.S. 1793), validación de unicidad de correo y el formulario interactivo en el cliente.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Probar Formulario de Registro</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="http://localhost:5000/swagger"
              target="_blank"
              rel="noreferrer"
              className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-700/80 flex items-center gap-2 transition-all"
            >
              <span>Ver Swagger Docs</span>
            </a>
          </div>
        </div>

        {/* Status Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mb-10">
          {/* Card 1: Backend HU01 */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Server className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">CuentasController</h2>
            <p className="text-xs text-slate-400 mb-4">Controlador y Repositorio HU-01</p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span><code className="text-blue-300">POST /api/cuentas/registro</code></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span><code className="text-blue-300">GET /api/cuentas/verificar-correo</code></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span><code className="text-blue-300">IClienteRepository</code> + EF Core</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Seguridad & Ley 164 */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Seguridad & Normativa</h2>
            <p className="text-xs text-slate-400 mb-4">Ley 164 & D.S. 1793 Art. 56</p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cifrado irreversible con <strong>BCrypt (workFactor 11)</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Control estricto de unicidad en correo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Contraseñas nunca almacenadas en texto plano</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Frontend Formulario */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Layout className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Formulario Reactivo</h2>
            <p className="text-xs text-slate-400 mb-4">RegisterModal Component</p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Validaciones de formato, longitud y coincidencia</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Manejo de errores 409 (Correo Duplicado) y 400</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Respuesta visual con datos creados</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Modal de Registro HU-01 */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(cliente) => {
          setLastRegisteredClient(cliente);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <p>BarberLosPeluchitos • Sistemas de Información I • UPDS Tarija</p>
      </footer>
    </div>
  );
}

export default App;
