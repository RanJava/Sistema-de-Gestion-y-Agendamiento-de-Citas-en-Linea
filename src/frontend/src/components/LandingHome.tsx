import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpRight
} from 'lucide-react';
import { servicioService } from '../services/servicioService';
import { barberoService } from '../services/barberoService';
import type { ServicioResponseDto } from '../types/servicio';
import type { BarberoResponseDto } from '../types/barbero';

interface LandingHomeProps {
  onStartBooking: (servicioId?: number, barberoId?: number) => void;
  onExploreSchedule: () => void;
}

// Iconos artesanales con trazo clásico de barbería (stroke 2.2px)
export const BarberScissorsIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

export const BarberRazorIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19L19 4" />
    <path d="M14 4l6 6-3 3-6-6 3-3z" />
    <path d="M4 19l4 1 6-6-2-2-8 7z" />
    <circle cx="6" cy="18" r="1" />
  </svg>
);

export const BarberChairIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h12v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4z" />
    <path d="M4 13h16" />
    <path d="M12 13v7" />
    <path d="M7 20h10" />
    <path d="M9 4V2h6v2" />
  </svg>
);

export const BarberTowelIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
    <path d="M4 12h16" />
    <path d="M8 8V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
  </svg>
);

export const LandingHome: React.FC<LandingHomeProps> = ({
  onStartBooking,
  onExploreSchedule,
}) => {
  const [servicios, setServicios] = useState<ServicioResponseDto[]>([]);
  const [barberos, setBarberos] = useState<BarberoResponseDto[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servData, barbData] = await Promise.all([
          servicioService.obtenerTodos().catch(() => []),
          barberoService.obtenerDisponibles().catch(() => []),
        ]);
        setServicios(servData);
        setBarberos(barbData);
      } catch {
        // Fallback manejado por los valores por defecto
      }
    };
    loadData();
  }, []);

  // Servicios de muestra o fallback con enriquecimiento descriptivo
  const serviciosDestacados = servicios.length > 0 ? servicios : [
    { idServicio: 1, nombre: 'Corte Clásico & Estilizado', duracionBase: 45, precioBase: 50 },
    { idServicio: 2, nombre: 'Ritual de Barba con Toalla Caliente', duracionBase: 35, precioBase: 40 },
    { idServicio: 3, nombre: 'Servicio Completo Peluchitos Signature', duracionBase: 75, precioBase: 85 },
    { idServicio: 4, nombre: 'Perfilado de Barba & Navaja', duracionBase: 25, precioBase: 30 },
  ];

  return (
    <div className="w-full flex flex-col font-sans">
      {/* ────────────────────────────────────────────────────────────────────────
          SECCIÓN 1: HERO (FONDO CARBÓN PROFUNDO #0a0a0a CON IMAGEN DE BARBERÍA)
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[600px] lg:min-h-[660px] bg-[#0a0a0a] border-b border-[#24211c] overflow-hidden flex items-center justify-center">
        {/* Imagen de Fondo con Overlay Oscuro Gradual */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity scale-105 transform transition-transform duration-1000"
          style={{ backgroundImage: `url('/barber_hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/90" />
        <div className="absolute inset-0 vintage-pinstripes opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Columna Texto & CTA */}
            <div className="lg:col-span-8 text-left space-y-6">
              {/* Badge de Tradición */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#d97706]/60 bg-[#121212]/90 text-[#d97706] text-xs uppercase tracking-[0.2em] font-semibold">
                <BarberScissorsIcon className="w-4 h-4 text-[#d97706]" />
                <span>Barbería Tradicional • Est. 2024 • Tarija</span>
              </div>

              {/* Titular Principal en Mayúsculas Condensadas */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#f5f1e8] uppercase font-heading leading-[0.95]">
                  EL ARTE DEL <span className="text-[#d97706]">CORTE CLÁSICO</span>
                  <span className="block text-2xl sm:text-4xl lg:text-5xl text-[#d4ccbd] font-normal mt-1 tracking-wider">
                    Y EL CUIDADO MASCULINO
                  </span>
                </h1>
                <div className="gold-divider mt-4" />
              </div>

              {/* Párrafo Descriptivo */}
              <p className="text-base sm:text-lg text-[#b8b0a2] max-w-2xl font-light leading-relaxed">
                Combinamos la maestría de la barbería tradicional con la precisión y puntualidad de nuestro sistema de agendamiento digital en tiempo real. Sin filas, con el barbero de tu elección.
              </p>

              {/* Botones de Acción Sólidos (Corte Recto) */}
              <div className="pt-3 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onStartBooking()}
                  className="px-7 py-4 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] font-bold text-sm sm:text-base tracking-wider uppercase transition-all duration-150 flex items-center gap-3 border border-[#d97706] cursor-pointer shadow-lg shadow-black/60 active:translate-y-0.5"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Reservar Turno en Línea</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onExploreSchedule}
                  className="px-6 py-4 bg-[#121212] hover:bg-[#1c1915] text-[#f5f1e8] hover:text-[#d97706] font-semibold text-sm sm:text-base tracking-wider uppercase transition-all duration-150 flex items-center gap-2.5 border border-[#38332b] cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-[#d97706]" />
                  <span>Ver Disponibilidad</span>
                </button>
              </div>

              {/* Tira de Garantías Rápidas */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[#24211c] text-xs text-[#a39b8d]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#d97706] shrink-0" />
                  <span>Corte y Afeitado a Navaja</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#d97706] shrink-0" />
                  <span>Toallas Calientes & Tónicos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#d97706] shrink-0" />
                  <span>Turno Puntual Garantizado</span>
                </div>
              </div>
            </div>

            {/* Columna Sello Artesanal & Card Insignia */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
              {/* Sello de Calidad Rotado */}
              <div className="artisan-seal bg-[#121212]/90 border-2 border-[#d97706] text-[#d97706] p-4 absolute -top-8 -right-2 lg:-right-4 hidden sm:flex z-20">
                <span className="text-[9px] uppercase tracking-widest font-bold">100% Calidad</span>
                <BarberScissorsIcon className="w-6 h-6 my-1 text-[#d97706]" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-center">Maestros<br/>Barberos</span>
              </div>

              {/* Tarjeta Visual Destacada (Estilo Cartel Vintage) */}
              <div className="w-full max-w-sm bg-[#121212] border-2 border-[#2c2720] p-6 text-left relative shadow-2xl">
                <div className="border border-[#3d362c] p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-[#2c2720] pb-3">
                    <span className="font-heading text-xs tracking-[0.2em] text-[#d97706] uppercase">Horarios de Salón</span>
                    <span className="text-[11px] text-[#8c8273] font-mono">TARIJA - BO</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-[#cfc7b8]">
                    <div className="flex justify-between items-center">
                      <span className="text-[#a39b8d]">Lunes a Viernes:</span>
                      <span className="font-bold text-[#f5f1e8]">08:00 — 20:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#a39b8d]">Sábados:</span>
                      <span className="font-bold text-[#f5f1e8]">08:30 — 19:30</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#a39b8d]">Domingos:</span>
                      <span className="text-[#d97706] font-medium">Previa Reserva</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2c2720]">
                    <div className="bg-[#1a1713] p-3 border border-[#332b21] flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-[#d97706] shrink-0" />
                      <p className="text-[11px] text-[#b0a89a] leading-tight">
                        Protocolos de esterilización y toallas individuales en cada servicio.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          SECCIÓN 2: CARTA DE SERVICIOS (FONDO CREMA CÁLIDO #f5f1e8)
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="bg-cream-paper py-20 border-b border-[#d6cdc0] text-[#1a1816]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Cabecera de Sección */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="vintage-badge-cream">
              Catálogo de Especialidades
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#1a1816] font-heading">
              CARTA DE SERVICIOS & TRATAMIENTOS
            </h2>
            <div className="gold-divider-center" />
            <p className="text-[#595247] text-sm sm:text-base font-normal pt-2">
              Cada servicio incluye diagnóstico capilar, asesoramiento de imagen y el ritual tradicional con productos premium seleccionados.
            </p>
          </div>

          {/* Cuadrícula de Tarjetas Tipo Menú Impreso */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviciosDestacados.map((servicio, idx) => (
              <div 
                key={servicio.idServicio}
                className="bg-cream-card p-6 flex flex-col justify-between border-2 border-[#d4ccbd] hover:border-[#854d0e] transition-colors duration-200 shadow-sm relative group"
              >
                {/* Número de Catálogo */}
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-xs font-bold text-[#78350f] bg-[#fef3c7] px-2 py-0.5 border border-[#854d0e]/30">
                    Nº 0{idx + 1}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-[#595247] font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#854d0e]" />
                    <span>{servicio.duracionBase} min</span>
                  </div>
                </div>

                {/* Título y Descripción */}
                <div className="space-y-3 mb-6">
                  <h3 className="text-xl font-bold font-heading uppercase text-[#1a1816] leading-snug group-hover:text-[#854d0e] transition-colors">
                    {servicio.nombre}
                  </h3>
                  <p className="text-xs text-[#5c5447] leading-relaxed">
                    {servicio.nombre.toLowerCase().includes('barba')
                      ? 'Perfilado milimétrico, tratamiento de vapor con toalla caliente y aceites hidratantes.'
                      : servicio.nombre.toLowerCase().includes('completo')
                      ? 'Nuestra experiencia cumbre: corte de autor, afeitado a navaja, exfoliación y masaje capilar.'
                      : 'Corte de tijera o máquina de alta precisión, lavado relajante y peinado con cera mate.'}
                  </p>
                </div>

                {/* Precio y Botón */}
                <div className="pt-4 border-t border-[#d6cdc0] flex items-center justify-between mt-auto">
                  <div>
                    <span className="block text-[10px] text-[#736a5c] uppercase font-semibold">Inversión</span>
                    <span className="text-2xl font-bold font-heading text-[#78350f]">
                      Bs {servicio.precioBase}
                    </span>
                  </div>
                  <button
                    onClick={() => onStartBooking(servicio.idServicio)}
                    className="px-3.5 py-2 bg-[#1a1816] hover:bg-[#854d0e] text-[#f5f1e8] text-xs font-bold uppercase tracking-wider transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Elegir</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Banner de Consulta Rápida */}
          <div className="mt-12 bg-[#ede8dc] border border-[#d6cdc0] p-6 text-center max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="font-heading font-bold text-base uppercase text-[#1a1816]">¿Buscas un servicio a medida o combo personalizado?</h4>
              <p className="text-xs text-[#595247]">Nuestros barberos adaptan la sesión a la morfología de tu rostro y tipo de cabello.</p>
            </div>
            <button
              onClick={() => onStartBooking()}
              className="px-5 py-2.5 bg-[#854d0e] hover:bg-[#78350f] text-[#fef3c7] font-bold text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
            >
              Reservar Todo
            </button>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          SECCIÓN 3: TRADICIÓN & VALORES (FONDO CARBÓN PROFUNDO #0a0a0a)
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0a0a0a] py-20 border-b border-[#24211c] text-[#e8e4dc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Encabezado */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="vintage-badge">
              Filosofía BarberLosPeluchitos
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading">
              LA DISTINCIÓN DE LO BIEN HECHO
            </h2>
            <div className="gold-divider-center" />
            <p className="text-[#9e9484] text-sm sm:text-base font-light pt-2">
              No somos un salón de paso. Creamos un espacio de desconexión donde cada detalle, navaja y producto responde a los más altos estándares.
            </p>
          </div>

          {/* Cuadrícula de 4 Pilares con Iconos Artesanales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Pilar 1 */}
            <div className="bg-charcoal-card p-6 border border-[#24211c] hover:border-[#d97706]/50 transition-all duration-200 flex flex-col space-y-4">
              <div className="w-12 h-12 border border-[#d97706] bg-[#1a1713] text-[#d97706] flex items-center justify-center">
                <BarberScissorsIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading uppercase text-[#f5f1e8] tracking-wide">
                Corte de Autor
              </h3>
              <p className="text-xs text-[#9c9383] leading-relaxed">
                Técnicas de tijera clásica combinadas con transiciones limpias y degradados precisos según tu fisonomía.
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="bg-charcoal-card p-6 border border-[#24211c] hover:border-[#d97706]/50 transition-all duration-200 flex flex-col space-y-4">
              <div className="w-12 h-12 border border-[#d97706] bg-[#1a1713] text-[#d97706] flex items-center justify-center">
                <BarberRazorIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading uppercase text-[#f5f1e8] tracking-wide">
                Ritual Tradicional
              </h3>
              <p className="text-xs text-[#9c9383] leading-relaxed">
                Afeitado clásico a navaja con toalla vaporizada al eucalipto, espuma caliente y loción astringente.
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="bg-charcoal-card p-6 border border-[#24211c] hover:border-[#d97706]/50 transition-all duration-200 flex flex-col space-y-4">
              <div className="w-12 h-12 border border-[#d97706] bg-[#1a1713] text-[#d97706] flex items-center justify-center">
                <BarberChairIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading uppercase text-[#f5f1e8] tracking-wide">
                Confort & Privacidad
              </h3>
              <p className="text-xs text-[#9c9383] leading-relaxed">
                Sillones ergonómicos de cuero vintage, atmósfera acústica cuidada y café de cortesía en cada visita.
              </p>
            </div>

            {/* Pilar 4 */}
            <div className="bg-charcoal-card p-6 border border-[#24211c] hover:border-[#d97706]/50 transition-all duration-200 flex flex-col space-y-4">
              <div className="w-12 h-12 border border-[#d97706] bg-[#1a1713] text-[#d97706] flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading uppercase text-[#f5f1e8] tracking-wide">
                Cero Tiempo de Espera
              </h3>
              <p className="text-xs text-[#9c9383] leading-relaxed">
                Tu cita está estrictamente reservada para ti. Llegas, te sientas y disfrutas tu atención sin demoras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          SECCIÓN 4: MAESTROS BARBEROS (FONDO CREMA CÁLIDO #f5f1e8)
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="bg-cream-paper py-20 border-b border-[#d6cdc0] text-[#1a1816]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="vintage-badge-cream">
              Equipo de Especialistas
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#1a1816] font-heading">
              CONOCE A NUESTROS MAESTROS BARBEROS
            </h2>
            <div className="gold-divider-center" />
            <p className="text-[#595247] text-sm sm:text-base font-normal pt-2">
              Profesionales titulados con trayectoria en el cuidado de imagen masculina y técnicas tradicionales de barbería.
            </p>
          </div>

          {/* Grilla de Barberos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {barberos.length > 0 ? (
              barberos.map((barbero) => (
                <div 
                  key={barbero.idBarbero}
                  className="bg-cream-card border-2 border-[#d4ccbd] p-6 text-center flex flex-col items-center justify-between relative hover:border-[#854d0e] transition-colors"
                >
                  <div className="w-20 h-20 bg-[#1a1816] text-[#f5f1e8] border-2 border-[#854d0e] flex items-center justify-center text-2xl font-heading font-bold mb-4">
                    {barbero.nombre.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1 mb-4">
                    <h3 className="text-xl font-bold font-heading uppercase text-[#1a1816]">
                      {barbero.nombre}
                    </h3>
                    <p className="text-xs text-[#78350f] font-semibold tracking-wider uppercase">
                      Maestro Barbero Titulado
                    </p>
                  </div>

                  <div className="w-full bg-[#fef3c7] border border-[#854d0e]/20 py-2 px-3 mb-5 text-[11px] text-[#78350f]">
                    <span>Atención: {barbero.horarios?.length ? `${barbero.horarios.length} jornadas semanales` : 'Horarios continuos'}</span>
                  </div>

                  <button
                    onClick={() => onStartBooking(undefined, barbero.idBarbero)}
                    className="w-full py-2.5 bg-[#854d0e] hover:bg-[#78350f] text-[#fef3c7] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reservar con {barbero.nombre.split(' ')[0]}</span>
                  </button>
                </div>
              ))
            ) : (
              // Fallback cards si el backend está cargando o inicializando
              [
                { nombre: 'Carlos Mendoza', exp: 'Corte Clásico & Fade' },
                { nombre: 'Roberto Vargas', exp: 'Especialista en Barba & Ritual' },
                { nombre: 'Alejandro Ramos', exp: 'Visagismo & Tijera Libre' },
              ].map((staff, idx) => (
                <div 
                  key={idx}
                  className="bg-cream-card border-2 border-[#d4ccbd] p-6 text-center flex flex-col items-center justify-between"
                >
                  <div className="w-20 h-20 bg-[#1a1816] text-[#f5f1e8] border-2 border-[#854d0e] flex items-center justify-center text-2xl font-heading font-bold mb-4">
                    {staff.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1 mb-4">
                    <h3 className="text-xl font-bold font-heading uppercase text-[#1a1816]">
                      {staff.nombre}
                    </h3>
                    <p className="text-xs text-[#78350f] font-semibold tracking-wider uppercase">
                      {staff.exp}
                    </p>
                  </div>
                  <button
                    onClick={() => onStartBooking()}
                    className="w-full py-2.5 bg-[#854d0e] hover:bg-[#78350f] text-[#fef3c7] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar Cita</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          SECCIÓN 5: BANNER CTA FINAL (FONDO CARBÓN #0a0a0a)
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0a0a0a] py-20 border-b border-[#24211c] relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="vintage-badge">
            Tu Asiento te Espera
          </span>
          <h2 className="text-4xl sm:text-6xl font-bold uppercase tracking-tight text-[#f5f1e8] font-heading leading-tight">
            VIVE LA EXPERIENCIA COMPLETA DE <span className="text-[#d97706]">BARBER LOS PELUCHITOS</span>
          </h2>
          <p className="text-[#b8b0a2] max-w-xl mx-auto text-sm sm:text-base font-light">
            Selecciona tu servicio, tu barbero preferido y la hora exacta en segundos a través de nuestro sistema de reservas garantizadas.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => onStartBooking()}
              className="px-9 py-4 bg-[#d97706] hover:bg-[#b45309] text-[#0a0a0a] font-bold text-base tracking-wider uppercase transition-all duration-150 flex items-center gap-3 border border-[#d97706] cursor-pointer shadow-xl shadow-black/80 active:translate-y-0.5"
            >
              <Calendar className="w-5 h-5" />
              <span>Agendar mi Cita Ahora</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
