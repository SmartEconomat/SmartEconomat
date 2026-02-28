# Documentación de Componente: Login (Controlador de Autenticación)

**Tipo:** Feature Controller (Página)  
**Ubicación:** `src/features/auth/Login.tsx`  
**Última actualización:** 2026-02-28

---

## Descripción General

`Login.tsx` es el **componente orquestador** de toda la pantalla de autenticación. No contiene formularios propios, sino que gestiona:

- El **layout de dos paneles deslizantes** (Slide informativo + Formulario).
- Las **animaciones de transición** entre modos (login ↔ registro).
- Los **flujos de feedback** post-login y post-registro con animaciones de salida y pantallas de confirmación.

---

## Arquitectura del Layout

```
┌─────────────────────────┬──────────────────┐
│                         │                  │
│     AuthSlide (58%)     │  Formulario (42%)│
│   Panel informativo     │  LoginForm /     │
│   con gradiente y       │  RegisterForm    │
│   carrusel de slides    │                  │
│                         │                  │
└─────────────────────────┴──────────────────┘
     ↕ se intercambian de posición con animación Elastic Wall Peel
```

Ambos paneles usan `position: absolute` en desktop para que la transición de `left` sea animable con `@keyframes` personalizados.

---

## Fases de la Pantalla (`AuthPhase`)

| Fase | Descripción |
|------|-------------|
| `idle` | Estado base. Muestra login o registro. |
| `login-exit` | El layout sale hacia la **izquierda** tras login exitoso. Overlay "¡Bienvenido!" visible. |
| `register-exit` | El layout sale hacia la **derecha** tras registro exitoso. Overlay de éxito visible. |
| `register-return` | El layout de login vuelve al viewport desde la **izquierda**. |

---

## Animaciones Implementadas

### 1. Elastic Wall Peel (intercambio de paneles)

Efecto donde los **bordes internos** de los paneles se mueven primero, estirando el panel como una goma elástica, y luego el **borde externo** (pegado al borde del navegador) se despega.

| Keyframe | Uso |
|----------|-----|
| `formPeelToLeft` | Panel formulario va de derecha → izquierda (login → registro) |
| `formPeelToRight` | Panel formulario va de izquierda → derecha (registro → login) |
| `slidePeelToRight` | Panel slide va de izquierda → derecha (login → registro) |
| `slidePeelToLeft` | Panel slide va de derecha → izquierda (registro → login) |

Secuencia del keyframe (ejemplo: form va a la izquierda):
```
0%  → left: 58%, width: 42%   (posición inicial)
42% → left: 0%,  width: 100%  (borde interno llegó, borde externo aún pegado al muro)
44% → left: 0%,  width: 100%  (pausa de tensión máxima)
100%→ left: 0%,  width: 42%   (borde externo se despega, tamaño final)
```

### 2. Salida en login exitoso (`layoutExitLeft`)

El layout completo se traslada a `translateX(-100%)` con fade-out.  
Duración: `EXIT_DURATION` (1500 ms por defecto).

### 3. Salida en registro exitoso (`layoutExitRight`)

El layout completo se traslada a `translateX(+100%)` con fade-out.

### 4. Vuelta a login tras registro (`layoutEnterLeft`)

El layout de login entra desde `translateX(-100%)` hacia `translateX(0)`.

### 5. Overlay de feedback

Aparece sobre el layout con `position: fixed` y `zIndex: 9999`.  
- **Login exitoso:** icono WavingHand + "¡Bienvenido!"  
- **Registro exitoso:** icono CheckCircleOutline + "¡Registro exitoso! Usuario pendiente de confirmación."

---

## Flujo de Login Exitoso

```
Usuario pulsa "Acceder"
    ↓
LoginForm llama onLoginSuccess(user, token)
    ↓
phase = 'login-exit'  →  layout sale a la izquierda + overlay "Bienvenido" aparece
    ↓ (EXIT_DURATION + 200ms)
login(user, token)  →  AuthContext navega al dashboard
```

## Flujo de Registro Exitoso

```
Usuario pulsa "Registrarse"
    ↓
RegisterForm llama onRegisterSuccess()
    ↓
phase = 'register-exit'  →  layout sale a la derecha + overlay "Registro exitoso" aparece
    ↓ (EXIT_DURATION + REGISTER_MSG_MS)
phase = 'register-return'  →  layout login vuelve desde la izquierda
    ↓ (EXIT_DURATION + 100ms)
phase = 'idle'  →  formulario de login en reposo
```

---

## Props de los hijos

| Componente | Props que recibe |
|-----------|-----------------|
| `AuthSlide` | `isLogin: boolean` |
| `LoginForm` | `onToggleForm: () => void`, `onLoginSuccess: (user, token) => void` |
| `RegisterForm` | `onToggleForm: () => void`, `onRegisterSuccess: () => void` |

---

## Constantes de animación

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `SLIDE_W` | 58 | Ancho del panel slide (%) |
| `FORM_W` | 42 | Ancho del panel formulario (%) |
| `PEEL_DURATION` | 1000 ms | Duración del efecto Elastic Wall Peel |
| `EXIT_DURATION` | 1500 ms | Duración de la animación de salida del layout |
| `REGISTER_MSG_MS` | 2500 ms | Tiempo visible del mensaje de registro exitoso |

---

## Dependencias

- `AuthSlide` — Panel informativo animado
- `LoginForm` — Formulario de inicio de sesión
- `RegisterForm` — Formulario de registro
- `useAuth` — Contexto de autenticación (`AuthContext.tsx`)
