import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getAppConfig, adminUpdateAppConfig } from '../lib/api';
import { ICON_SVG_PATHS } from '../lib/iconSvgPaths';
import type { AppConfig } from '../types';

interface AppConfigContextValue {
  config: AppConfig | null;
  loading: boolean;
  updateConfig: (token: string, data: { app_name?: string; primary_color?: string; app_icon?: string }) => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextValue>({
  config: null,
  loading: true,
  updateConfig: async () => {},
});

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function generatePalette(hex: string): Record<string, string> {
  const [r, g, b] = hexToRgb(hex);
  const mix = (base: number, target: number, ratio: number) => Math.round(base + (target - base) * ratio);
  return {
    '50': `${mix(r, 255, 0.95)} ${mix(g, 255, 0.95)} ${mix(b, 255, 0.95)}`,
    '100': `${mix(r, 255, 0.85)} ${mix(g, 255, 0.85)} ${mix(b, 255, 0.85)}`,
    '200': `${mix(r, 255, 0.65)} ${mix(g, 255, 0.65)} ${mix(b, 255, 0.65)}`,
    '300': `${mix(r, 255, 0.45)} ${mix(g, 255, 0.45)} ${mix(b, 255, 0.45)}`,
    '400': `${mix(r, 255, 0.2)} ${mix(g, 255, 0.2)} ${mix(b, 255, 0.2)}`,
    '500': `${r} ${g} ${b}`,
    '600': `${mix(r, 0, 0.15)} ${mix(g, 0, 0.15)} ${mix(b, 0, 0.15)}`,
    '700': `${mix(r, 0, 0.3)} ${mix(g, 0, 0.3)} ${mix(b, 0, 0.3)}`,
    '800': `${mix(r, 0, 0.5)} ${mix(g, 0, 0.5)} ${mix(b, 0, 0.5)}`,
    '900': `${mix(r, 0, 0.7)} ${mix(g, 0, 0.7)} ${mix(b, 0, 0.7)}`,
    '950': `${mix(r, 0, 0.85)} ${mix(g, 0, 0.85)} ${mix(b, 0, 0.85)}`,
  };
}

function applyColor(color: string) {
  const palette = generatePalette(color);
  const root = document.documentElement;
  for (const [shade, rgb] of Object.entries(palette)) {
    root.style.setProperty(`--primary-${shade}`, rgb);
  }
}

function updatePwaManifest(name: string, color: string, iconName: string = 'wallet') {
  const iconPaths = ICON_SVG_PATHS[iconName] || ICON_SVG_PATHS.wallet;
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 24 24"><rect x="0" y="0" width="24" height="24" rx="4" fill="${color}"/><g stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">${iconPaths}</g></svg>`;
  const iconBlob = new Blob([svgIcon], { type: 'image/svg+xml' });
  const iconUrl = URL.createObjectURL(iconBlob);

  const manifest = {
    name,
    short_name: name,
    description: 'Finanzas personales con Telegram',
    theme_color: color,
    background_color: '#f9fafb',
    display: 'standalone',
    orientation: 'portrait',
    start_url: (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/',
    icons: [
      { src: iconUrl, sizes: '192x192', type: 'image/svg+xml' },
      { src: iconUrl, sizes: '512x512', type: 'image/svg+xml' },
    ],
  };

  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestUrl = URL.createObjectURL(manifestBlob);

  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (link) link.href = manifestUrl;

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = color;

  document.title = name;
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppConfig()
      .then(cfg => {
        setConfig(cfg);
        applyColor(cfg.primary_color);
        updatePwaManifest(cfg.app_name, cfg.primary_color, cfg.app_icon);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = useCallback(async (token: string, data: { app_name?: string; primary_color?: string; app_icon?: string }) => {
    const updated = await adminUpdateAppConfig(token, data);
    setConfig(updated);
    applyColor(updated.primary_color);
    updatePwaManifest(updated.app_name, updated.primary_color, updated.app_icon);
  }, []);

  return (
    <AppConfigContext.Provider value={{ config, loading, updateConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}
