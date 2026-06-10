import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Wallet, Key, AlertCircle, Eye, EyeOff, Moon, Sun, ArrowRight,
  TrendingUp, ShieldCheck, MessageCircle, Smartphone, BarChart3, Sparkles,
  Quote, Star, ChevronDown,
} from 'lucide-react';
import {
  motion, useMotionValue, useSpring, useTransform, AnimatePresence,
  useScroll,
} from 'framer-motion';

let bubbleId = 0;

function Bubble({ onExit }: { onExit: (id: number) => void }) {
  const id = useRef(++bubbleId).current;
  const size = 20 + Math.random() * 60;
  const startX = Math.random() * 100;
  const duration = 12 + Math.random() * 18;
  const drift = -40 + Math.random() * 80;

  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        bottom: '-10vh',
        background: `radial-gradient(circle, rgba(255,255,255,${0.03 + Math.random() * 0.08}) 0%, transparent 70%)`,
        boxShadow: `0 0 ${size * 0.3}px rgba(255,255,255,${0.02 + Math.random() * 0.04})`,
      }}
      initial={{ y: 0, x: 0, opacity: 0 }}
      animate={{
        y: `-${100 + Math.random() * 40}vh`,
        x: drift,
        opacity: [0, 0.3 + Math.random() * 0.3, 0],
        scale: [0.5, 1, 0.8],
      }}
      transition={{ duration, ease: 'linear' }}
      onAnimationComplete={() => onExit(id)}
    />
  );
}

function BubbleField() {
  const [bubbles, setBubbles] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) => [...prev, ++bubbleId]);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const removeBubble = useCallback((id: number) => {
    setBubbles((prev) => prev.filter((b) => b !== id));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {bubbles.map((id) => (
          <Bubble key={id} onExit={removeBubble} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function AnimatedGradientBg() {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 30%, #06b6d4 60%, #155e75 100%)',
      }}
      animate={{
        background: [
          'linear-gradient(135deg, #0e7490 0%, #0891b2 30%, #06b6d4 60%, #155e75 100%)',
          'linear-gradient(135deg, #155e75 0%, #0e7490 30%, #0891b2 60%, #06b6d4 100%)',
          'linear-gradient(135deg, #0891b2 0%, #06b6d4 30%, #155e75 60%, #0e7490 100%)',
          'linear-gradient(135deg, #0e7490 0%, #0891b2 30%, #06b6d4 60%, #155e75 100%)',
        ],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function DarkGradientBg() {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 60%, #020617 100%)',
      }}
      animate={{
        background: [
          'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 60%, #020617 100%)',
          'linear-gradient(135deg, #020617 0%, #0f172a 30%, #1e293b 60%, #0f172a 100%)',
          'linear-gradient(135deg, #1e293b 0%, #0f172a 30%, #020617 60%, #1e293b 100%)',
          'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 60%, #020617 100%)',
        ],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function MouseGlow() {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);
  const glowX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const glowY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: useTransform(
          [glowX, glowY],
          ([x, y]) =>
            `radial-gradient(600px at ${x}px ${y}px, rgba(6, 182, 212, 0.12) 0%, transparent 70%)`,
        ),
      }}
    />
  );
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 25 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 25 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(x * 8);
    rotateX.set(-y * 8);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX: springX, rotateY: springY, perspective: 1200 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function WaveLayer({ className, path, speed }: { className: string; path: string; speed: number }) {
  return (
    <motion.path
      className={className}
      d={path}
      animate={{
        d: [
          path,
          path.replace('C360,0', 'C360,40').replace('720,100', '720,60'),
          path,
        ],
      }}
      transition={{ duration: speed, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function MultiWaveDivider() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute bottom-0 h-32 w-full">
        <WaveLayer
          className="fill-sand-50/30 dark:fill-slate-900/20"
          path="M0,60 C360,20 720,100 1080,60 C1260,40 1350,60 1440,60 L1440,120 L0,120 Z"
          speed={6}
        />
      </svg>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute bottom-0 h-24 w-full">
        <WaveLayer
          className="fill-sand-50/60 dark:fill-slate-900/40"
          path="M0,40 C360,80 720,10 1080,50 C1260,70 1350,40 1440,40 L1440,120 L0,120 Z"
          speed={8}
        />
      </svg>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute bottom-0 h-20 w-full">
        <WaveLayer
          className="fill-sand-50 dark:fill-slate-900"
          path="M0,30 C360,60 720,0 1080,30 C1260,45 1350,30 1440,30 L1440,120 L0,120 Z"
          speed={10}
        />
      </svg>
    </div>
  );
}

function ScrollReveal({
  children,
  direction = 'left',
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up';
  delay?: number;
  className?: string;
}) {
  const x = direction === 'left' ? -120 : direction === 'right' ? 120 : 0;
  const y = direction === 'up' ? 60 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  delay,
  direction,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  delay: number;
  direction: 'left' | 'right';
}) {
  return (
    <ScrollReveal direction={direction} delay={delay}>
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-sand-50/80 p-8 backdrop-blur-sm dark:bg-slate-800/80">
        <div className="rounded-xl bg-ocean-100 p-3 dark:bg-ocean-900/50">
          <Icon className="text-ocean-600 dark:text-ocean-400" size={24} />
        </div>
        <span className="text-3xl font-bold text-surface-900 dark:text-surface-100">{value}</span>
        <span className="text-sm text-surface-500 dark:text-surface-400">{label}</span>
      </div>
    </ScrollReveal>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
  delay,
  direction,
}: {
  quote: string;
  author: string;
  role: string;
  delay: number;
  direction: 'left' | 'right';
}) {
  return (
    <ScrollReveal direction={direction} delay={delay}>
      <motion.div
        className="relative rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-800"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Quote className="absolute right-6 top-6 text-ocean-200 dark:text-ocean-800" size={32} />
        <div className="mb-4 flex gap-1 text-coral-500">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={16} fill="currentColor" />
          ))}
        </div>
        <p className="mb-6 text-surface-600 dark:text-surface-300">{quote}</p>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean-100 text-sm font-bold text-ocean-700 dark:bg-ocean-900 dark:text-ocean-300">
            {author.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{author}</p>
            <p className="text-xs text-surface-400">{role}</p>
          </div>
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

function DashboardMockup() {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-400">
          <Wallet size={14} />
          Moragas Dashboard
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Ingresos', value: '$420.000', color: 'text-green-600 dark:text-green-400' },
          { label: 'Gastos', value: '$390.000', color: 'text-red-600 dark:text-red-400' },
          { label: 'Balance', value: '$30.000', color: 'text-ocean-600 dark:text-ocean-400' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-sand-50 p-3 dark:bg-slate-700">
            <p className="text-xs text-surface-400">{item.label}</p>
            <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex h-24 items-end gap-2">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-md bg-ocean-400 dark:bg-ocean-500"
            style={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.6, delay: 0.8 + i * 0.1, ease: 'easeOut' }}
          />
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-surface-400">
        <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
      </div>
    </div>
  );
}

function ScrollImage({ children, direction = 1 }: { children: React.ReactNode; direction?: number }) {
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 1], [0, direction * 200]);

  return (
    <motion.div style={{ x }} className="will-change-transform">
      {children}
    </motion.div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(key.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clave inválida');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: MessageCircle, value: '1 mensaje', label: 'y tus finanzas están listas', delay: 0.1, direction: 'left' as const },
    { icon: TrendingUp, value: 'en tiempo real', label: 'dashboard actualizado al instante', delay: 0.2, direction: 'right' as const },
    { icon: ShieldCheck, value: 'privado y seguro', label: 'solo tú tienes acceso', delay: 0.3, direction: 'left' as const },
  ];

  const testimonials = [
    {
      quote: 'Desde que uso Moragas dejé de anotar gastos en papel. Un mensaje al bot y ya está.',
      author: 'Admin',
      role: 'Creador de la app',
      delay: 0.1,
      direction: 'left' as const,
    },
    {
      quote: 'Mi familia usa la clave que me dieron y vemos los gastos del mes en segundos.',
      author: 'Usuario',
      role: 'Acceso familiar',
      delay: 0.2,
      direction: 'right' as const,
    },
  ];

  const features = [
    { icon: MessageCircle, title: 'Envía un mensaje', desc: 'El admin escribe el gasto al bot de Telegram. "gasté 5.000 en carne" y listo.' },
    { icon: Sparkles, title: 'IA lo clasifica', desc: 'Gemini entiende el texto y extrae monto, categoría y tipo automáticamente.' },
    { icon: BarChart3, title: 'Dashboard automático', desc: 'Gráficos mensuales y por categoría. Todo visible sin hacer nada más.' },
    { icon: Smartphone, title: 'PWA instalable', desc: 'Agrégala a tu pantalla de inicio como una app nativa. Sin descargas.' },
  ];

  return (
    <>
      <MouseGlow />

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30 dark:opacity-20"
          loading="lazy"
        />
        <div className="dark:hidden"><AnimatedGradientBg /></div>
        <div className="hidden dark:block"><DarkGradientBg /></div>
        <BubbleField />

        {/* Theme toggle */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          onClick={toggle}
          className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
          title="Cambiar tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-36 left-1/2 z-20 hidden -translate-x-1/2 lg:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 2 }, y: { repeat: Infinity, duration: 2 } }}
        >
          <ChevronDown className="text-white/40" size={24} />
        </motion.div>

        <MultiWaveDivider />

        {/* Hero content */}
        <div className="relative z-10 mx-auto mt-16 flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 pb-40 pt-10 lg:flex-row lg:gap-16">
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mb-6 flex items-center justify-center gap-3 lg:justify-start"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md"
              >
                <Wallet className="text-white" size={28} />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-balance text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
            >
              Tus finanzas{' '}
              <motion.span
                className="inline-block text-ocean-200"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                en un mensaje
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mx-auto mt-4 max-w-lg text-lg text-white/80 sm:mx-0"
            >
              Envía tus gastos e ingresos por Telegram. Moragas los clasifica con IA y los muestra
              en un dashboard claro y simple.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/60 lg:justify-start"
            >
              <span className="flex items-center gap-1.5"><MessageCircle size={14} /> Telegram</span>
              <span className="flex items-center gap-1.5"><TrendingUp size={14} /> Dashboard</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Clave de acceso</span>
            </motion.div>
          </div>

          {/* Right: Login Card with 3D tilt */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-10 w-full max-w-sm lg:mt-0"
          >
            <TiltCard>
              <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mb-6 text-center"
                >
                  <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">Bienvenido</h2>
                  <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Ingresa tu clave de acceso</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="key" className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                      Clave de acceso
                    </label>
                    <div className="relative">
                      <Key className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                      <input
                        id="key"
                        type={showKey ? 'text' : 'password'}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="w-full rounded-xl border border-surface-200 bg-white px-10 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-ocean-400"
                        placeholder="Ingresa tu clave"
                        autoFocus
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400"
                    >
                      <AlertCircle size={16} className="shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading || !key.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ocean-600/25 transition-all hover:bg-ocean-700 disabled:opacity-50 disabled:shadow-none dark:bg-ocean-500 dark:hover:bg-ocean-600"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <motion.div
                        className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <>
                        Ingresar <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="bg-sand-50 px-6 py-24 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="mb-2 inline-block rounded-full bg-ocean-100 px-3 py-1 text-xs font-medium text-ocean-700 dark:bg-ocean-900 dark:text-ocean-300">
              Cómo funciona
            </span>
            <h2 className="mt-3 text-3xl font-bold text-surface-900 dark:text-surface-100">
              De Telegram a tu dashboard
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-surface-500 dark:text-surface-400">
              En tres pasos simples. Sin apps adicionales, sin configuración complicada.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-4">
            {features.map((f, i) => (
              <ScrollReveal
                key={f.title}
                direction={i % 2 === 0 ? 'left' : 'right'}
                delay={i * 0.1}
              >
                <motion.div
                  className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800"
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="rounded-2xl bg-ocean-50 p-4 dark:bg-ocean-950/40"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                  >
                    <f.icon className="text-ocean-600 dark:text-ocean-400" size={28} />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{f.title}</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">{f.desc}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SCROLL IMAGE: PHONE / TELEGRAM ===== */}
      <section className="relative h-[500px] overflow-hidden bg-gradient-to-r from-ocean-700 to-ocean-900 dark:from-slate-800 dark:to-slate-950">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80"
            alt=""
            className="h-full w-full object-cover opacity-20"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white/90">Tus finanzas desde cualquier lugar</p>
            <p className="mt-2 text-white/60">Un mensaje al bot y ya está todo registrado</p>
          </div>
        </div>
        <ScrollImage direction={-1}>
          <div className="relative z-20 flex h-[500px] items-center justify-center px-6">
            <motion.img
              src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80"
              alt="App móvil Moragas"
              className="h-80 w-auto rounded-3xl object-cover shadow-2xl"
              loading="lazy"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              whileHover={{ scale: 1.02 }}
            />
          </div>
        </ScrollImage>
      </section>

      {/* ===== DASHBOARD PREVIEW ===== */}
      <section className="bg-sand-100 px-6 py-24 dark:bg-slate-800">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-12 lg:flex-row">
            <div className="flex-1">
              <ScrollReveal direction="left">
                <span className="mb-2 inline-block rounded-full bg-ocean-100 px-3 py-1 text-xs font-medium text-ocean-700 dark:bg-ocean-900 dark:text-ocean-300">
                  Dashboard
                </span>
                <h2 className="mt-3 text-3xl font-bold text-surface-900 dark:text-surface-100">
                  Todo en un vistazo
                </h2>
                <p className="mt-4 text-surface-500 dark:text-surface-400">
                  Ingresos, gastos, balance y gráficos semanales. Todo se actualiza automáticamente
                  cuando envías un mensaje al bot.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Resumen mensual con totales',
                    'Gráfico de gastos por categoría',
                    'Historial de transacciones',
                    'Soporte multiusuario con claves',
                  ].map((item) => (
                    <motion.li
                      key={item}
                      className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-ocean-500" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>

            <div className="flex-1 w-full">
              <ScrollReveal direction="right">
                <ScrollImage direction={-1}>
                  <DashboardMockup />
                </ScrollImage>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ESTADÍSTICAS ===== */}
      <section className="bg-sand-50 px-6 py-24 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="mb-2 inline-block rounded-full bg-coral-500/10 px-3 py-1 text-xs font-medium text-coral-600 dark:text-coral-400">
              Estadísticas
            </span>
            <h2 className="mt-3 text-3xl font-bold text-surface-900 dark:text-surface-100">
              Hecho para la simplicidad
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {stats.map((s) => (
              <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} delay={s.delay} direction={s.direction} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="bg-sand-100 px-6 py-24 dark:bg-slate-800">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="mb-2 inline-block rounded-full bg-ocean-100 px-3 py-1 text-xs font-medium text-ocean-700 dark:bg-ocean-900 dark:text-ocean-300">
              Testimonios
            </span>
            <h2 className="mt-3 text-3xl font-bold text-surface-900 dark:text-surface-100">
              Lo que dicen los usuarios
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map((t) => (
              <TestimonialCard key={t.author} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-500 via-ocean-600 to-ocean-800 py-24 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
        <BubbleField />
        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Wallet className="text-white" size={32} />
            </motion.div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Empezá ahora
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-white/80">
              Pedile tu clave al admin y empezá a trackear tus finanzas con un solo mensaje.
            </p>
            <motion.a
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-ocean-700 shadow-lg transition-all hover:bg-ocean-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Ir al login <ArrowRight size={16} />
            </motion.a>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mx-auto mt-20 max-w-5xl border-t border-white/10 px-6 pt-8 text-center text-sm text-white/40">
          Moragas — Finanzas personales con Telegram
        </div>
      </section>
    </>
  );
}