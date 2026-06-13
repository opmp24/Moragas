import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAppConfig } from '../context/AppConfigContext';
import { Wallet, Key, AlertCircle, Eye, EyeOff, Moon, Sun, ChevronDown, Download } from 'lucide-react';
import { motion, useScroll, useTransform, useVelocity, useSpring } from 'framer-motion';

function ParallaxItem({ children, speed, className = '' }: { children: React.ReactNode; speed: number; className?: string }) {
  const { scrollY, scrollYProgress } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const blurValue = useTransform(smoothVelocity, (v) => `blur(${Math.min(Math.abs(v) / 150, 8)}px)`);
  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 350]);
  const floatDuration = useRef(2 + Math.random() * 2).current;
  const floatDistance = useRef(4 + Math.random() * 4).current;

  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      style={{ y, filter: blurValue }}
    >
      <motion.div
        animate={{ y: [0, -floatDistance, 0, floatDistance, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function RevealItem({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const floatDuration = useRef(2.5 + Math.random() * 2).current;
  const floatDistance = useRef(4 + Math.random() * 4).current;

  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      initial={{ opacity: 0, scale: 0.3, y: 40 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    >
      <motion.div
        animate={{ y: [0, -floatDistance, 0, floatDistance, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

function Img({ src, className }: { src: string; className?: string }) {
  return (
    <img
      src={base + src}
      alt=""
      className={`${className} shadow-lg`}
      loading="lazy"
    />
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Login() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const { config: appConfig } = useAppConfig();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -250]);
  const formOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

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

  return (
    <div className="relative min-h-[300vh]">
      {/* Fixed background */}
      <div className="fixed inset-0 bg-surface-950">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${base}/img/fondo.avif)`,
            y: bgY,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950/70 via-surface-950/50 to-surface-950/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-transparent" />
      </div>

      {/* Theme toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        onClick={toggle}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
        title="Cambiar tema"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </motion.button>

      {/* Hero section — items scroll with the login */}
      <section className="relative z-10 min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <ParallaxItem speed={0.15} className="left-[8%] top-[20%]">
            <Img src="/img/1.png" className="w-32 h-32 opacity-70" />
          </ParallaxItem>
          <ParallaxItem speed={-0.25} className="right-[12%] top-[15%]">
            <Img src="/img/Dttfy87ZMDoIdnbn9YIiK6narUQ.avif" className="w-48 h-32 opacity-60" />
          </ParallaxItem>
          <ParallaxItem speed={0.2} className="left-[5%] top-[45%]">
            <Img src="/img/mUY8RHfaogduuUwahiZ9hX276nU.avif" className="w-28 h-28 opacity-60" />
          </ParallaxItem>
          <ParallaxItem speed={-0.35} className="right-[8%] top-[40%]">
            <Img src="/img/3.png" className="w-40 h-40 opacity-50" />
          </ParallaxItem>
          <ParallaxItem speed={0.3} className="left-[15%] top-[65%]">
            <Img src="/img/5.webp" className="w-48 h-28 opacity-50" />
          </ParallaxItem>
          <ParallaxItem speed={-0.2} className="right-[15%] top-[60%]">
            <Img src="/img/NNBnMi0QPnU6xB0hnAga2ZosyRY.avif" className="w-28 h-40 opacity-50" />
          </ParallaxItem>
        </div>

        <div className="flex min-h-screen flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <Wallet className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{appConfig?.app_name || 'Moragas'}</span>
          </motion.div>

          <motion.div style={{ opacity: formOpacity }} className="w-full max-w-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl">
              <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold text-white">Bienvenido</h1>
                <p className="mt-1 text-sm text-white/60">Ingresa tu clave de acceso</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="key" className="mb-1.5 block text-sm font-medium text-white/70">
                    Clave de acceso
                  </label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                    <input
                      id="key"
                      type={showKey ? 'text' : 'password'}
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-10 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      placeholder="Ingresa tu clave"
                      autoFocus
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400"
                    >
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading || !key.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none"
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
                    'Ingresar'
                  )}
                </motion.button>

                {installPrompt && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleInstall}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
                  >
                    <Download size={16} />
                    Instalar app
                  </motion.button>
                )}
              </form>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 6, 0] }}
            transition={{ opacity: { delay: 1.5 }, y: { repeat: Infinity, duration: 2 } }}
            className="absolute bottom-10"
          >
            <ChevronDown className="text-white/30" size={28} />
          </motion.div>
        </div>
      </section>

      {/* Second section — items appear on scroll */}
      <section className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0">
          <RevealItem delay={0.1} className="left-[10%] top-[15%]">
            <Img src="/img/PJ0w31MgQo5ygygee622cJcCkRE.avif" className="w-40 h-40 opacity-60" />
          </RevealItem>
          <RevealItem delay={0.3} className="right-[15%] top-[25%]">
            <Img src="/img/uyqQY5IhacSqsI76stSxZMmxs.avif" className="w-32 h-32 opacity-50" />
          </RevealItem>
          <RevealItem delay={0.2} className="left-[20%] top-[55%]">
            <Img src="/img/wu8fR3oWcPdqbhuxVwPkVCqzAZU.avif" className="w-56 h-32 opacity-50" />
          </RevealItem>
          <RevealItem delay={0.4} className="right-[10%] top-[65%]">
            <Img src="/img/X2MHZtpTpzqMAdzDZd2NEJ9Ob8.avif" className="w-32 h-48 opacity-40" />
          </RevealItem>
        </div>

        <div className="max-w-lg text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-2xl font-bold text-white"
          >
            Controla tus finanzas desde Telegram
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-3 text-base text-white/60"
          >
            Envía un mensaje al bot y Moragas clasifica automáticamente cada gasto o ingreso con IA.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 space-y-3 text-left"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-xs text-green-400">✓</span>
              <p className="text-sm text-white/50"><strong className="text-white/70">Ejemplo:</strong> "Almuerzo 5.000" → Gasto · Comida · $5.000. "Sueldo 500.000" → Ingreso · Sueldo · $500.000</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-xs text-green-400">✓</span>
              <p className="text-sm text-white/50"><strong className="text-white/70">Ventajas:</strong> Sin apps bancarias, multi-usuario con claves individuales, dashboard con gráficos por mes/categoría/usuario, PWA instalable en el celular</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Third section — more items + footer */}
      <section className="relative z-10 flex min-h-screen items-end justify-center overflow-hidden px-6 pb-8">
        <div className="absolute inset-0">
          <RevealItem delay={0.2} className="left-[5%] top-[10%]">
            <Img src="/img/ZDmYldvtnsEYPsEwdlbH1I86n4.avif" className="w-28 h-28 opacity-40" />
          </RevealItem>
          <RevealItem delay={0.4} className="right-[8%] top-[20%]">
            <Img src="/img/Dttfy87ZMDoIdnbn9YIiK6narUQ.avif" className="w-48 h-24 opacity-40" />
          </RevealItem>
          <RevealItem delay={0.3} className="left-[50%] top-[60%]">
            <Img src="/img/mUY8RHfaogduuUwahiZ9hX276nU.avif" className="w-24 h-24 opacity-30" />
          </RevealItem>
          <RevealItem delay={0.35} className="left-[30%] top-[35%]">
            <Img src="/img/2.jpg" className="w-36 h-28 opacity-40" />
          </RevealItem>
        </div>

        <div className="w-full max-w-6xl text-center text-sm text-white/15">
          Hecho con cuidado
        </div>
      </section>
    </div>
  );
}
