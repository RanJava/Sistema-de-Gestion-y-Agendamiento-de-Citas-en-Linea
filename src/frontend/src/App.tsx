import { useState, useEffect } from 'react';
import { Scissors, RefreshCw, UserPlus, Users, Calendar, BookOpen, LogOut, LogIn, Shield, CalendarCheck, CalendarDays, History as HistoryIcon } from 'lucide-react';
import { checkApiHealth } from './services/api';
import { useAuth } from './contexts/AuthContext';
import { RegisterModal } from './components/RegisterModal';
import { LoginModal } from './components/LoginModal';
import AdminBarberos from './components/AdminBarberos';
import { AgendaDisponibilidad } from './components/AgendaDisponibilidad';
import { BookingWizard } from './components/BookingWizard';
import { MisCitasCliente } from './components/MisCitasCliente';
import { AdminCitasDia } from './components/AdminCitasDia';
import { AdminHistorialClientes } from './components/AdminHistorialClientes';
import type { Cliente } from './types';

type Tab = 'booking' | 'disponibilidad' | 'staff' | 'miscitas' | 'citasdia' | 'historialclientes';

export function App() {
  const { user, isAuthenticated, isCliente, isAdmin, logout, login } = useAuth();

  const getDefaultTab = (): Tab => {
    if (isAdmin) return 'staff';
    return 'booking';
  };

  const [activeTab, setActiveTab] = useState<Tab>(getDefaultTab());
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  // Al cambiar de rol, asegurarse de que la pestaña actual sea válida
  useEffect(() => {
    if (isAdmin && (activeTab === 'booking' || activeTab === 'miscitas' || activeTab === 'disponibilidad')) {
      setActiveTab('staff');
    }
    if (isCliente && (activeTab === 'staff' || activeTab === 'citasdia' || activeTab === 'historialclientes')) {
      setActiveTab('booking');
    }
    if (!isAuthenticated && (activeTab === 'miscitas' || activeTab === 'citasdia' || activeTab === 'staff' || activeTab === 'historialclientes')) {
      setActiveTab('booking');
    }
  }, [isAdmin, isCliente, isAuthenticated, activeTab]);

  // Derivar currentUser compatible con BookingWizard
  const currentUser: Cliente | null = isCliente && user ? {
    idCliente: user.idUsuario,
    nombre: user.nombre,
    telefono: '',
    correo: user.correo,
    fechaRegistro: '',
  } : null;

  const testConnection = async () => {
    setIsRetrying(true);
    setBackendStatus('checking');
    try {
      await checkApiHealth();
      setBackendStatus('connected');
    } catch {
      setBackendStatus('offline');
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    testConnection();
    const interval = setInterval(testConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRegisterSuccess = (cliente: Cliente, token?: string) => {
    // Auto-login tras registro: persistir token JWT y estado de usuario
    if (token) {
      login(token, {
        idUsuario: cliente.idCliente,
        nombre: cliente.nombre,
        correo: cliente.correo,
        rol: 'Cliente',
      });
    }
  };

  const handleUserLogin = (cliente: Cliente, token?: string) => {
    if (token) {
      login(token, {
        idUsuario: cliente.idCliente,
        nombre: cliente.nombre,
        correo: cliente.correo,
        rol: 'Cliente',
      });
    }
  };

  // ─── Definir tabs según rol ─────────────────────────────────────────────────

  type NavItem = { key: Tab; label: string; icon: React.ReactNode; mobileLabel: string };

  const getNavItems = (): NavItem[] => {
    if (isAdmin) {
      return [
        { key: 'staff', label: 'Gestión de Staff (HU-02)', icon: <Users className="w-3.5 h-3.5" />, mobileLabel: '👥 Staff' },
        { key: 'citasdia', label: 'Citas del Día (HU-07/08)', icon: <CalendarDays className="w-3.5 h-3.5" />, mobileLabel: '📋 Citas' },
        { key: 'historialclientes', label: 'Historial Clientes (HU-09)', icon: <HistoryIcon className="w-3.5 h-3.5" />, mobileLabel: '📜 Historial' },
      ];
    }

    const items: NavItem[] = [
      { key: 'booking', label: 'Agendar Cita (HU-04)', icon: <BookOpen className="w-3.5 h-3.5" />, mobileLabel: '✂️ Agendar' },
      { key: 'disponibilidad', label: 'Agenda y Horarios (HU-03)', icon: <Calendar className="w-3.5 h-3.5" />, mobileLabel: '📅 Agenda' },
    ];

    if (isCliente) {
      items.push({ key: 'miscitas', label: 'Mis Citas (HU-06)', icon: <CalendarCheck className="w-3.5 h-3.5" />, mobileLabel: '📋 Mis Citas' });
    }

    return items;
  };

  const navItems = getNavItems();

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

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === item.key
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Acciones de usuario */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                {isAdmin && (
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-xs font-bold text-amber-300 truncate max-w-[120px]">
                  {user.nombre}
                </span>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                  ({user.rol})
                </span>
                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  className="text-slate-400 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </button>
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Registro</span>
                </button>
              </div>
            )}

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
              <span className="hidden sm:inline">Backend:</span> {
                backendStatus === 'connected' 
                  ? 'En Línea' 
                  : backendStatus === 'checking' 
                  ? '...' 
                  : 'Offline'
              }
            </span>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden border-t border-slate-800/80 px-4 py-2 gap-2 overflow-x-auto">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeTab === item.key ? 'bg-amber-500 text-slate-950' : 'text-slate-400 bg-slate-900'
              }`}
            >
              {item.mobileLabel}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'booking' && (
          <div className="animate-in fade-in duration-200">
            <BookingWizard
              currentUser={currentUser}
              onUserLogin={handleUserLogin}
            />
          </div>
        )}

        {activeTab === 'disponibilidad' && (
          <div className="animate-in fade-in duration-200">
            <AgendaDisponibilidad />
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="animate-in fade-in duration-200">
            <AdminBarberos />
          </div>
        )}

        {activeTab === 'miscitas' && isCliente && (
          <div className="animate-in fade-in duration-200">
            <MisCitasCliente />
          </div>
        )}

        {activeTab === 'citasdia' && isAdmin && (
          <div className="animate-in fade-in duration-200">
            <AdminCitasDia />
          </div>
        )}

        {activeTab === 'historialclientes' && isAdmin && (
          <div className="animate-in fade-in duration-200">
            <AdminHistorialClientes />
          </div>
        )}
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenRegistro={() => setIsRegisterOpen(true)}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleRegisterSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <p>BarberLosPeluchitos • Sistemas de Información I • UPDS Tarija</p>
      </footer>
    </div>
  );
}

export default App;
