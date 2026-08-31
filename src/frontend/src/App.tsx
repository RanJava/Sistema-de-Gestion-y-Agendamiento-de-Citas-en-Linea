import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  UserPlus, 
  Users, 
  Calendar, 
  BookOpen, 
  LogOut, 
  LogIn, 
  Shield, 
  CalendarCheck, 
  CalendarDays, 
  History as HistoryIcon,
  Home as HomeIcon
} from 'lucide-react';
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
import { LandingHome, BarberScissorsIcon } from './components/LandingHome';
import type { Cliente } from './types';

type Tab = 'home' | 'booking' | 'disponibilidad' | 'staff' | 'miscitas' | 'citasdia' | 'historialclientes';

export function App() {
  const { user, isAuthenticated, isCliente, isAdmin, logout, login } = useAuth();

  const getDefaultTab = (): Tab => {
    if (isAdmin) return 'staff';
    return 'home';
  };

  const [activeTab, setActiveTab] = useState<Tab>(getDefaultTab());
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  // Al cambiar de rol, asegurarse de que la pestaña actual sea válida
  useEffect(() => {
    if (isAdmin && (activeTab === 'home' || activeTab === 'booking' || activeTab === 'miscitas' || activeTab === 'disponibilidad')) {
      setActiveTab('staff');
    }
    if (isCliente && (activeTab === 'staff' || activeTab === 'citasdia' || activeTab === 'historialclientes')) {
      setActiveTab('home');
    }
    if (!isAuthenticated && (activeTab === 'miscitas' || activeTab === 'citasdia' || activeTab === 'staff' || activeTab === 'historialclientes')) {
      setActiveTab('home');
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
        { key: 'staff', label: 'Gestión de Staff', icon: <Users className="w-4 h-4" />, mobileLabel: 'Staff' },
        { key: 'citasdia', label: 'Citas del Día', icon: <CalendarDays className="w-4 h-4" />, mobileLabel: 'Citas' },
        { key: 'historialclientes', label: 'Historial Clientes', icon: <HistoryIcon className="w-4 h-4" />, mobileLabel: 'Historial' },
      ];
    }

    const items: NavItem[] = [
      { key: 'home', label: 'Inicio / Salón', icon: <HomeIcon className="w-4 h-4" />, mobileLabel: 'Inicio' },
      { key: 'booking', label: 'Agendar Cita', icon: <BookOpen className="w-4 h-4" />, mobileLabel: 'Agendar' },
      { key: 'disponibilidad', label: 'Agenda & Horarios', icon: <Calendar className="w-4 h-4" />, mobileLabel: 'Horarios' },
    ];

    if (isCliente) {
      items.push({ key: 'miscitas', label: 'Mis Citas', icon: <CalendarCheck className="w-4 h-4" />, mobileLabel: 'Mis Citas' });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e4dc] flex flex-col justify-between selection:bg-[#d97706] selection:text-black font-sans">
      {/* Top Banner de Barbería Tradicional */}
      <div className="bg-[#121212] border-b border-[#24211c] py-1 px-4 text-center text-[11px] text-[#a39b8d] tracking-widest uppercase font-heading flex items-center justify-between max-w-7xl mx-auto w-full">
        <span className="hidden sm:inline">TARIJA • BOLIVIA</span>
        <span className="text-[#d97706] font-medium mx-auto sm:mx-0">ATENCIÓN PERSONALIZADA • TURNOS EN TIEMPO REAL</span>
        <span className="hidden sm:inline">LUN - SÁB: 08:00 - 20:00</span>
      </div>

      {/* Header / Navbar Clásico Premium */}
      <header className="border-b border-[#24211c] bg-[#0a0a0a]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo Insignia */}
          <div 
            onClick={() => setActiveTab(isAdmin ? 'staff' : 'home')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-11 h-11 border-2 border-[#d97706] bg-[#121212] flex items-center justify-center text-[#d97706] group-hover:bg-[#d97706] group-hover:text-black transition-colors duration-200">
              <BarberScissorsIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="font-heading font-bold text-xl sm:text-2xl tracking-[0.12em] text-[#f5f1e8] uppercase block leading-none">
                BARBER<span className="text-[#d97706]">LOS PELUCHITOS</span>
              </span>
              <span className="block text-[10px] text-[#a39b8d] uppercase tracking-[0.2em] font-medium mt-1">
                Salón Tradicional & Agendamiento
              </span>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1 border border-[#24211c] bg-[#121212] p-1">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-4 py-2 text-xs uppercase tracking-wider font-heading font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === item.key
                    ? 'bg-[#d97706] text-[#0a0a0a] font-bold shadow-sm'
                    : 'text-[#a39b8d] hover:text-[#f5f1e8] hover:bg-[#1a1713]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Acciones de usuario & Estado de Sistema */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 bg-[#121212] px-3.5 py-2 border border-[#24211c]">
                {isAdmin && (
                  <Shield className="w-4 h-4 text-[#d97706]" />
                )}
                <span className="text-xs font-bold font-heading uppercase text-[#f5f1e8] tracking-wider truncate max-w-[130px]">
                  {user.nombre}
                </span>
                <span className="text-[10px] text-[#8c8273] font-mono uppercase hidden sm:inline">
                  [{user.rol}]
                </span>
                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  className="text-[#a39b8d] hover:text-rose-400 p-1 transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="py-2.5 px-4 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border border-[#d97706]"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Ingresar</span>
                </button>
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="py-2.5 px-4 bg-[#121212] hover:bg-[#1c1915] text-[#f5f1e8] text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-[#38332b] hover:border-[#d97706] transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-[#d97706]" />
                  <span className="hidden sm:inline">Registro</span>
                </button>
              </div>
            )}

            <button
              onClick={testConnection}
              disabled={isRetrying}
              title="Reintentar verificación de conexión"
              className="p-2 bg-[#121212] hover:bg-[#1c1915] text-[#a39b8d] hover:text-[#f5f1e8] border border-[#24211c] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-[#d97706]' : ''}`} />
            </button>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border ${
              backendStatus === 'connected' 
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' 
                : backendStatus === 'checking'
                ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'connected' 
                  ? 'bg-emerald-400' 
                  : backendStatus === 'checking' 
                  ? 'bg-amber-400 animate-pulse' 
                  : 'bg-rose-400'
              }`} />
              <span className="hidden sm:inline">API:</span> {
                backendStatus === 'connected' 
                  ? 'ONLINE' 
                  : backendStatus === 'checking' 
                  ? '...' 
                  : 'OFFLINE'
              }
            </span>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden border-t border-[#24211c] bg-[#121212] px-4 py-2 gap-1.5 overflow-x-auto">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`px-3 py-1.5 text-xs font-heading uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                activeTab === item.key ? 'bg-[#d97706] text-[#0a0a0a] font-bold' : 'text-[#a39b8d] bg-[#0a0a0a]'
              }`}
            >
              {item.mobileLabel}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-200">
            <LandingHome
              onStartBooking={() => setActiveTab('booking')}
              onExploreSchedule={() => setActiveTab('disponibilidad')}
            />
          </div>
        )}

        {activeTab === 'booking' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
            <BookingWizard
              currentUser={currentUser}
              onUserLogin={handleUserLogin}
            />
          </div>
        )}

        {activeTab === 'disponibilidad' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
            <AgendaDisponibilidad />
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
            <AdminBarberos />
          </div>
        )}

        {activeTab === 'miscitas' && isCliente && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
            <MisCitasCliente />
          </div>
        )}

        {activeTab === 'citasdia' && isAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
            <AdminCitasDia />
          </div>
        )}

        {activeTab === 'historialclientes' && isAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
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

      {/* Footer Vintage Clásico */}
      <footer className="border-t border-[#24211c] bg-[#0a0a0a] text-[#8c8273] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#f5f1e8] font-heading font-bold text-lg tracking-wider uppercase">
              <BarberScissorsIcon className="w-5 h-5 text-[#d97706]" />
              <span>BARBER LOS PELUCHITOS</span>
            </div>
            <p className="text-xs text-[#736a5c] leading-relaxed max-w-xs mx-auto md:mx-0">
              Maestría artesanal, afeitado tradicional a navaja y agendamiento en línea de alta precisión.
            </p>
          </div>

          <div className="space-y-1 text-xs">
            <span className="font-heading font-bold text-sm text-[#d4ccbd] uppercase tracking-wider block mb-2">
              Ubicación & Contacto
            </span>
            <p>Calle Tradición Esq. San Martín, Tarija - Bolivia</p>
            <p>Teléfono / WhatsApp: (+591) 700-00000</p>
            <p className="text-[#d97706]">consultas@barberlospeluchitos.com</p>
          </div>

          <div className="space-y-1 text-xs md:text-right">
            <span className="font-heading font-bold text-sm text-[#d4ccbd] uppercase tracking-wider block mb-2">
              Proyecto Académico
            </span>
            <p>Sistemas de Información I • Semestre VI</p>
            <p>Universidad Privada Domingo Savio (UPDS)</p>
            <p className="text-[#736a5c] mt-2">© 2024 - 2026 Todos los derechos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
