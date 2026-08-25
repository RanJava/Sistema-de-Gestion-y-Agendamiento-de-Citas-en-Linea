import { useState, useEffect } from 'react';
import { Scissors, Database, Server, Layout, CheckCircle2, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { checkApiHealth, type HealthCheckResponse } from './services/api';

export function App() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

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
    // Sondeo periódico cada 10 segundos
    const interval = setInterval(testConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
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

            <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono hidden sm:inline-block">
              v1.2 MVP Base
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col justify-center">
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
            Plataforma Lista para el Desarrollo de <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Historias de Usuario</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Se ha configurado la arquitectura desacoplada en 3 capas (.NET 10 Web API con Swagger UI), el modelo de datos relacional para PostgreSQL y la SPA moderna en React 19 con Tailwind CSS.
          </p>
        </div>

        {/* Status Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mb-10">
          {/* Card 1: Backend */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Server className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Backend ASP.NET Core</h2>
            <p className="text-xs text-slate-400 mb-4">Arquitectura Limpia / 3 Capas (.NET 10)</p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span><code className="text-blue-300">Swagger UI</code> activo en <a href="http://localhost:5000/swagger" target="_blank" rel="noreferrer" className="underline hover:text-white">/swagger</a></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span><code className="text-blue-300">Health Check</code> en <code className="text-blue-300">/api/health</code></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Controladores registrados & CORS habilitado</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Persistence & PostgreSQL */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Persistencia PostgreSQL</h2>
            <p className="text-xs text-slate-400 mb-4">ApplicationDbContext & Npgsql</p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tablas: <code className="text-emerald-300">cliente</code>, <code className="text-emerald-300">barbero</code>, <code className="text-emerald-300">turno</code></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tablas: <code className="text-emerald-300">servicio</code>, <code className="text-emerald-300">cita</code>, <code className="text-emerald-300">horario</code></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Índices únicos & restricciones de integridad</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Frontend SPA */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Layout className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Frontend SPA React 19</h2>
            <p className="text-xs text-slate-400 mb-4">Vite + TypeScript + Tailwind CSS</p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Estructura <code className="text-amber-300">components/</code>, <code className="text-amber-300">pages/</code>, <code className="text-amber-300">services/</code></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Modelos y tipos TypeScript sincronizados</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Sondeo automático de estado hacia el Backend</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Roadmap info */}
        <div className="max-w-4xl mx-auto w-full bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Siguiente Paso: Implementación por Historias de Usuario</h3>
              <p className="text-xs text-slate-400">
                La base está lista. Puedes solicitar la implementación de HU-01 (Registro de Cliente), HU-02 (Barberos & Horarios), HU-03 (Disponibilidad en tiempo real), etc.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              Esperando instrucción de HU
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <p>BarberLosPeluchitos • Sistemas de Información I • UPDS Tarija</p>
      </footer>
    </div>
  );
}

export default App;
