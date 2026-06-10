---
name: Moragas
description: Finanzas personales con Telegram
colors:
  primary-teal: "#0891b2"
  primary-teal-deep: "#155e75"
  neutral-sand: "#fdf2e9"
  neutral-sand-deep: "#7d4f35"
  accent-coral: "#f97316"
  accent-coral-deep: "#c2410c"
  dark-bg: "#0f172a"
  dark-surface: "#1e293b"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 2vw, 1.25rem)"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.938rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.813rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.primary-teal-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary-teal}"
    rounded: "{rounded.md}"
    padding: "12px 28px"
  input:
    backgroundColor: "#ffffff"
    textColor: "#0f172a"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
---

# Design System: Moragas

## 1. Overview

**Creative North Star: "Primera Impresión"**

Moragas vive en dos mundos. La landing page es el único momento en que el usuario ve la marca: una ráfaga de animaciones, curvas oceánicas y calidez de arena que sorprende y deleita. El dashboard interior es sobrio, plano y funcional — el espectáculo termina y empieza el trabajo. El sistema no intenta ser elegante a la fuerza ni bancario formal. Es fresco, directo, con un pie en la playa y otro en la planilla de gastos.

La paleta Oceano + Arena usa teal profundo como ancla (el mar en calma) y arenas cálidas como fondo (la textura de la playa). El coral aparece en micro-dosis como acento de energía. Sin sombras: toda la profundidad se logra por capas tonales, manteniendo el sistema plano, moderno y nítido.

**Key Characteristics:**
- Animaciones sorprendentes en la landing, cero fricción en el dashboard
- Teal arena y coral: color que evoca vacaciones sin ser infantil
- Plano por capas tonales: sin sombras, profundidad vía contraste de color
- Tipografía limpia: Inter como voz única, pesos y tamaño como jerarquía
- Inputs con borde visible, botones con hover oscuro, feedback táctil

## 2. Colors

Oceano + Arena: el teal profundo evoca el mar en calma, los neutrals cálidos son la arena, el coral es el acento de atardecer.

### Primary

- **Oceano** (#0891B2 / teal-600): El color primario. Botones principales, enlaces, acentos activos. Usar sobre fondos arena (light) o deep navy (dark).
- **Oceano Profundo** (#155E75 / teal-800): Hover de botones primarios, headers, fondos de sección en dark mode.

### Accent

- **Coral** (#F97316 / orange-500): Acento secundario. Solo para pequeños detalles: badges, íconos decorativos, etiquetas de "ingreso". ≤5% de cualquier pantalla.

### Neutral

- **Arena Claro** (#FDF2E9): Fondo base en light mode. Cálido sin ser crema empalagoso.
- **Arena** (#FAE4D4): Superficies elevadas (cards, contenedores secundarios).
- **Arena Medio** (#E8B08E): Bordes y dividers en light mode.

- **Deep Navy** (#0F172A / surface-900): Fondo base en dark mode.
- **Navy Superficie** (#1E293B / surface-800): Cards y contenedores en dark mode.

- **Ink** (#0F172A): Texto principal.
- **Ink Secundario** (#475569): Texto secundario, etiquetas.
- **Ink Muted** (#94A3B8): Placeholders, texto deshabilitado.

### Named Rules

**La Regla de la Primera Impresión.** La landing page usa color y animación sin restricción. El dashboard aplica la paleta con moderación (<15% de color primario por pantalla). La rareza del color en el interior es lo que hace que la landing sea memorable.

**La Regla de la Profundidad Plana.** Sin box-shadow en ningún componente. La elevación se representa exclusivamente por cambios de tono: en light mode, superficie → 50 más oscura que fondo; en dark mode, superficie → 50 más clara que fondo.

## 3. Typography

**Display Font:** Inter (con system-ui como fallback)
**Body Font:** Inter (con system-ui como fallback)
**Mono Font:** JetBrains Mono (para montos y datos financieros en tablas)

**Character:** Inter es una sans-serif limpia y profesional que funciona tanto para titulares impactantes como para texto de lectura. Single-family evita el ruido visual y mantiene la app con un tono directo. En landing, se usa en pesos bold con tracking tight para impacto. En dashboard, weights regulares y medium para legibilidad.

### Hierarchy

- **Display** (700, clamp(2.5rem, 5vw, 4.5rem), 1.1, -0.03em): Hero de landing page. Solo en la landing. Nunca en el dashboard.
- **Headline** (600, clamp(1.5rem, 3vw, 2rem), 1.2): Títulos de sección en landing y dashboard.
- **Title** (600, clamp(1.125rem, 2vw, 1.25rem), 1.3): Títulos de cards, encabezados de panel.
- **Body** (400, 0.938rem, 1.6): Texto de lectura, descripciones. Máximo 75ch en landing, sin límite en dashboard.
- **Label** (500, 0.813rem, 1, 0.01em): Labels de formularios, tabs, metadata. Nunca en uppercase.

## 4. Elevation

Sistema completamente plano. No existen sombras ni box-shadow en ningún componente (el `shadow-sm` de Tailwind está prohibido). La profundidad se logra por capas tonales:

- **Light mode:** Fondo base = Arena Claro (#FDF2E9). Superficie elevada = Arena (#FAE4D4). Un step de 8% de oscuridad.
- **Dark mode:** Fondo base = Deep Navy (#0F172A). Superficie elevada = Navy Superficie (#1E293B). Un step de 12% de claridad.

La transición entre capas es instantánea (sin animación de elevación).

### Named Rules

**La Regla Sin Sombras.** box-shadow está terminantemente prohibido en toda la codebase. Cualquier `shadow-` en Tailwind es un bug. La profundidad tonal reemplaza a las sombras en 100% de los casos.

## 5. Components

### Buttons

- **Shape:** Rectangular con esquillas suaves (10px). Sin sombras.

- **Primary Oceano:** Fondo Oceano (#0891B2), texto blanco, padding 12px 28px. Hover → Oceano Profundo (#155E75). Transición rápida de color (150ms ease-out).
- **Ghost:** Sin fondo, texto Oceano (#0891B2). Hover → fondo Arena (#FAE4D4). Para acciones secundarias.
- **Danger:** Fondo Coral (#F97316), texto blanco. Solo para acciones destructivas.

- **Loading:** Misma apariencia, con spinner SVG inline y opacidad reducida (70%).

### Inputs / Fields

- **Style:** Borde de 1px sólido Arena Medio (#E8B08E), fondo blanco, esquinas suaves (6px).
- **Focus:** Borde cambia a Oceano (#0891B2), ring de 1px Oceano. Sin glow ni sombra.
- **Placeholder:** Ink Muted (#94A3B8) con 4.5:1 de contraste.
- **Dark mode:** Borde navy-600 (#475569), fondo navy-800 (#1E293B), texto inverso.

### Cards

- **Style:** Sin border-radius exagerado (10px). Sin borde. Sin sombra.
- **Elevación:** La card usa un tono más oscuro que el fondo (Arena #FAE4D4 sobre Arena Claro #FDF2E9 en light; navy-800 sobre navy-900 en dark).
- **Padding interno:** 16px (md) estándar, 24px (lg) para cards principales.

### Navigation

- **Style:** Header transparente con backdrop-blur en la landing. Header sólido con bordes en el dashboard.
- **Active state:** Fondo Oceano al 10% (light: #E0F2FE, dark: rgba(8,145,178,0.15)).
- **Mobile:** Menú hamburguesa con overlay de fondo.

## 6. Do's and Don'ts

### Do:
- **Do** usar la landing page como el único momento de alto impacto visual. Animaciones, colores vibrantes, movimiento.
- **Do** usar capas tonales para profundidad. Fondo base → superficie elevada: un step de diferencia.
- **Do** mantener el dashboard sobrio. Máximo 15% de área con color primario.
- **Do** usar Inter en todos los pesos y tamaños. Una familia, sin mezclar.
- **Do** animar con framer-motion usando ease-out exponencial y respetando `prefers-reduced-motion`.
- **Do** usar texto con contraste ≥4.5:1 en body y placeholders.

### Don't:
- **Don't** usar box-shadow, shadow-sm, ni sombras en ningún componente.
- **Don't** usar border-radius >16px en cards o contenedores. Solo botones pueden tener 10px.
- **Don't** usar gradient text, glassmorphism, side-stripe borders, ni ninguno de los AI slops listados en Impeccable bans.
- **Don't** repetir las animaciones de la landing en el dashboard. La sorpresa funciona una sola vez.
- **Don't** usar colores fríos (azul slate, gris azulado) en light mode. La calidez de la arena es obligatoria.
- **Don't** poner texto en all-caps salvo badges de ≤4 palabras.
