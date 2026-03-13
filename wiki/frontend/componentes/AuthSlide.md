# Documentación de Componente: AuthSlide

**Tipo:** Componente de presentación (UI)  
**Ubicación:** `src/features/auth/components/AuthSlide.tsx`  
**Última actualización:** 2026-02-28

---

## Descripción General

`AuthSlide` es el panel informativo lateral de la pantalla de autenticación. Ocupa el **58%** del viewport horizontal en desktop y contiene:

- Un **fondo degradado animado** que cambia de color según el modo activo (login/registro).
- Un **icono animado** que cambia y gira suavemente al alternar de modo.
- Un **carrusel de slides informativos** con dots de navegación y auto-avance.

---

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `isLogin` | `boolean` | ✅ | Determina qué color de fondo, icono y slides mostrar. |

---

## Comportamiento del Fondo

Utiliza **dos capas de gradiente superpuestas** con `position: absolute` y animación de `opacity`. Este truco permite la transición fluida entre colores porque CSS **no puede animar `background` directamente** con gradientes.

```
Capa Login   (opacity: 1→0 en registro)  →  gradiente primary del tema MUI
Capa Registro (opacity: 0→1 en registro) →  gradiente secondary del tema MUI
```

Los colores se leen del **tema MUI activo** mediante `useTheme()`:
- `theme.palette.primary.dark / main / light` → panel login
- `theme.palette.secondary.dark / main / light` → panel registro

Esto garantiza que el componente sea compatible con cualquier variante de tema (light, dark, highContrast).

---

## Icono Animado

El icono cambia según `isLogin`:

| Modo | Icono |
|------|-------|
| Login | `LockOutlinedIcon` |
| Registro | `PersonAddOutlinedIcon` |

Al cambiar, se usa `key={isLogin ? 'icon-lock' : 'icon-person'}` para que React **desmonte y remonte** el nodo, disparando la animación `iconSpinNatural`:

```
0%  → rotate(-360deg) scale(0.75), opacity: 0   (fuera de vista, atrás)
55% → opacity: 1                                 (empieza a verse)
65% → rotate(8deg) scale(1.04)                   (overshoot)
100%→ rotate(0deg) scale(1)                      (posición final siempre vertical)
```

Duración: **1.1 s** con easing `cubic-bezier(0.34, 1.2, 0.64, 1)` (spring suave).

---

## Carrusel de Slides

Cada modo tiene **3 slides** informativos definidos en constantes estáticas:

**LOGIN_SLIDES:**
1. "Bienvenido a SmartEconomat" — presentación general
2. "Control en tiempo real" — stock y movimientos
3. "Siempre disponible" — acceso 24/7

**REGISTER_SLIDES:**
1. "Únete a SmartEconomat" — llamada a la acción
2. "Todo en un lugar" — listado de funcionalidades
3. "Interfaz moderna y sencilla" — UX

### Auto-avance

El carrusel avanza automáticamente cada **4 segundos** mediante `setInterval`. El timer se reinicia cuando cambia `isLogin`.

### Dots de navegación

- Posición: **`absolute`, `bottom: 32px`** — fijados al fondo del panel, independientes del contenido.
- Dot activo: píldora expandida (28×10 px), color `rgba(255,255,255,0.95)`.
- Dots inactivos: círculo (10×10 px), color `rgba(255,255,255,0.40)`.
- Transición: `all 0.35s cubic-bezier(0.4, 0, 0.2, 1)`.

### Animación de texto

Al cambiar de slide se aplica `textFadeUp` mediante `key={slideKey}`:
```
from: { opacity: 0, transform: 'translateY(16px)' }
to:   { opacity: 1, transform: 'translateY(0)' }
```
Duración: 0.5 s con `cubic-bezier(0.22, 1, 0.36, 1)`.

---

## Estructura Visual

```
┌─────────────────────────────────────┐
│  [Capa gradiente login]             │ ← absolute, z:0
│  [Capa gradiente registro]          │ ← absolute, z:0
│  [Destello radial decorativo]       │ ← absolute, z:1
│                                     │
│         [Icono animado]             │ ← z:2, relativo
│                                     │
│         Título del slide            │
│         Descripción del slide       │
│                                     │
│         ● ○ ○   ← dots navigación  │ ← absolute, bottom:32px, z:3
└─────────────────────────────────────┘
```

---

## Responsividad

| Breakpoint | Comportamiento |
|-----------|---------------|
| `xs–md` | El componente no se renderiza (el wrapper padre lo oculta con `height: 260px` y layout flex) |
| `md+` | Ocupa el 100% del alto del contenedor absoluto padre |

---

## Dependencias

- `useTheme` de `@mui/material/styles` — para los colores del tema
- `LockOutlinedIcon`, `PersonAddOutlinedIcon` de `@mui/icons-material`
