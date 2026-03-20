# Página: Autenticación (Login / Registro)

**Ruta:** `/login`  
**Layout:** `AuthLayout.tsx` (sin sidebar ni appbar)  
**Componente raíz:** `src/features/auth/Login.tsx`  
**Última actualización:** 2026-02-28

---

## Descripción

La pantalla de autenticación es el punto de entrada a SmartEconomat. Implementa un diseño de **dos paneles deslizantes** con animaciones CSS de alta calidad mediante `@keyframes` personalizados.

---

## Árbol de Componentes

```
Login.tsx  (orquestador, gestiona fases y animaciones)
├── AuthSlide.tsx      (panel izquierdo: gradiente + carrusel)
├── LoginForm.tsx      (panel derecho: formulario de acceso)
└── RegisterForm.tsx   (panel derecho: formulario de registro)
```

Y un overlay `position: fixed` renderizado condicionalmente para los mensajes de feedback.

---

## Diseño Visual

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │   Panel Slide (58%)     │  │  Panel Formulario (42%)  │  │
│  │                         │  │                          │  │
│  │  Gradiente animado      │  │  LoginForm               │  │
│  │  (azul / verde oscuro)  │  │  o RegisterForm          │  │
│  │                         │  │                          │  │
│  │  [Icono giratorio]      │  │  ● campos                │  │
│  │                         │  │  ● botón acceder         │  │
│  │  Título del slide       │  │  ● enlaces               │  │
│  │  Descripción            │  │                          │  │
│  │                         │  │                          │  │
│  │  ● ○ ○  (dots)          │  │                          │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

En **modo registro**, los paneles intercambian posición físicamente:
```
[Panel Formulario (42%)] [Panel Slide (58%)]
```

---

## Sistema de Animaciones

### A. Elastic Wall Peel (toggle login ↔ registro)

Los paneles se desplazan mediante `@keyframes` sobre `left` y `width` con una técnica de tres fases:

1. **Borde interno** se mueve hacia el destino → el panel se **estira**.
2. **Pausa** breve en máxima extensión (panel ocupa 100% del ancho).
3. **Borde externo** se desprende de la pared → el panel se **encoge** al tamaño final.

Esto crea la ilusión de que los bordes están "pegados" al borde del navegador y se despegan con resistencia.

> Duración: 1000 ms | Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard)

### B. Salida en login exitoso

- El layout completo aplica `translateX(-100%)` con `opacity: 0`.
- Un overlay blanco aparece con el mensaje **"¡Bienvenido!"** + icono de saludo.
- Tras `EXIT_DURATION + 200ms`, `AuthContext.login()` navega al dashboard.

### C. Salida y vuelta tras registro exitoso

Secuencia completa:

| Tiempo | Evento |
|--------|--------|
| 0 ms | `phase = register-exit` → layout sale a la derecha |
| ~200 ms | Overlay "¡Registro exitoso!" aparece con `overlayFadeIn` |
| EXIT_DURATION + REGISTER_MSG_MS | `phase = register-return` → layout login entra desde la izquierda |
| + EXIT_DURATION | `phase = idle` → pantalla en reposo |

---

## Colores del Sistema

Los colores del panel informativo **se leen del tema MUI activo** (`useTheme()`):

| Modo | Color origen |
|------|-------------|
| Login | `theme.palette.primary.*` |
| Registro | `theme.palette.secondary.*` |

Esto garantiza coherencia con el resto de la aplicación y soporte automático de temas (dark, highContrast, etc.).

---

## Responsividad

| Breakpoint | Comportamiento |
|-----------|---------------|
| `xs / sm` | Layout flex vertical: slide arriba (260px), formulario abajo. Sin animaciones de deslizamiento. |
| `md+` | Layout absoluto con paneles deslizantes y todas las animaciones activas. |

---

## Seguridad y Rutas

La ruta `/login` es una **ruta pública** gestionada por `PublicRoute.tsx`:
- Si el usuario ya está autenticado y la sesión fue verificada por `AuthContext`, se redirige automáticamente a `/`.
- No hay acceso al layout principal ni a rutas protegidas sin autenticación verificada.

### Verificación de sesión actual

El flujo de auth frontend quedó endurecido para no confiar solo en datos persistidos en navegador:

1. `login()` persiste `token` y `user` localmente.
2. `AuthContext` valida localmente el JWT mediante `jwtUtils`.
3. Si el token es utilizable, consulta `/api/v1/usuarios/perfil` para obtener el perfil real.
4. El perfil devuelto por backend sustituye permisos y datos persistidos localmente.
5. Hasta terminar esa verificación, las rutas protegidas muestran `Spinner` y no renderizan páginas internas.

### Consecuencias prácticas

- Un JWT expirado o mal formado provoca `logout` y redirección a `/login`.
- Un JWT cambiado manualmente en `localStorage` obliga a revalidar antes de abrir una vista protegida.
- Un array `permisos` alterado manualmente no concede acceso real, porque `AuthContext` lo sustituye con los permisos confirmados por backend.

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `src/features/auth/Login.tsx` | Orquestador principal |
| `src/features/auth/components/AuthSlide.tsx` | Panel informativo |
| `src/features/auth/components/LoginForm.tsx` | Formulario de login |
| `src/features/auth/components/RegisterForm.tsx` | Formulario de registro |
| `src/store/AuthContext.tsx` | Contexto de autenticación |
| `src/routes/PublicRoute.tsx` | Guard de ruta pública |
| `src/routes/ProtectedRoute.tsx` | Guard de sesión verificada y permiso por ruta |
| `src/utils/auth/jwtUtils.ts` | Validación local mínima del JWT |
| `src/layouts/AuthLayout.tsx` | Layout sin menú lateral |

---

## Historial de Cambios Relevantes

| Fecha | Cambio |
|-------|--------|
| 2026-03-20 | Verificación obligatoria de sesión con `/usuarios/perfil`, revalidación si cambia el token y bloqueo de rutas por permiso en frontend. |
| 2026-02-28 | Rediseño completo: paneles deslizantes con Elastic Wall Peel, carrusel en AuthSlide, icono animado, overlays de feedback para login y registro. |
| Anterior | Formulario simple centrado con toggle básico. |
