# Documentación de Arquitectura SmartEconomat

Este documento describe la arquitectura del proyecto `SmartEconomat` (Frontend), basada en principios de escalabilidad, mantenibilidad y separación de responsabilidades. Se actualizará a medida que se agreguen nuevas funcionalidades.

## Estructura del Proyecto

El proyecto sigue una organización modular:

```text
src/
├── assets/            # Recursos estáticos (imágenes, fuentes, estilos globales).
├── components/        # Componentes reutilizables.
│   └── ui/            # Componentes de UI puros (Botones, Inputs) sin lógica de negocio.
├── features/          # Módulos funcionales de la aplicación.
│   └── auth/          # Lógica y componentes de autenticación (Login).
├── hooks/             # Custom Hooks reutilizables (useAuth, useFetch).
├── layouts/           # Estructuras de página (MainLayout, AuthLayout).
├── pages/             # Componentes de página (vistas completas mapeadas a rutas).
├── routes/            # Configuración de enrutamiento (AppRouter, Guards).
├── services/          # Comunicación con APIs (fetch, axios).
├── store/             # Estado global (Context API).
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── utils/             # Utilidades y configuración.
│   ├── config/        # Configuraciones globales (menuConfig).
│   └── theme/         # Definiciones de tema (themes.ts).
├── App.tsx            # Componente raíz.
└── main.tsx           # Punto de entrada.
```

## Principios de Arquitectura

Seguimos tres pilares fundamentales para mantener el código limpio:

### 1. Separación de Lógica y Presentación
-   **Componentes:** Se encargan exclusivamente de la interfaz visual (JSX/TSX).
-   **Hooks:** Encapsulan la lógica compleja (cálculos, efectos, llamadas a API). *Ejemplo: Si un componente crece demasiado por lógica, extraer a un custom hook.*

### 2. Composición de Componentes
-   Priorizamos la composición (`children`) sobre el paso excesivo de propiedades ("Prop Drilling") para evitar estructuras rígidas y difíciles de mantener.

### 3. Colocación (Co-location)
-   **Regla de oro:** "Mantén el código cerca de donde se usa".
-   Los recursos (estilos, tests, utilidades) específicos de un componente deben vivir junto a él, no en carpetas globales lejanas, facilitando la portabilidad y eliminación de código muerto.

## Buenas Prácticas

### Nomenclatura
-   **PascalCase** para Componentes (`BotonEnviar.tsx`).
-   **camelCase** para archivos de lógica y hooks (`useAuth.ts`, `formUtils.ts`).

### Organización
-   **Índices (`index.ts`):** Usar archivos de barril para exportaciones limpias y evitar rutas de importación desordenadas.
-   **Profundidad:** Evitar anidamiento excesivo (más de 3-4 niveles). Si es necesario importar `../../../../`, reconsiderar la estructura.

## Funcionalidades (Features)

### Autenticación (`src/features/auth`)
Módulo encargado del inicio de sesión y gestión de la sesión del usuario.
-   **Login:** Formulario de acceso con validación.

### Gestión de Estado (`src/store`)
Utilizamos Context API para el estado global esencial:
-   **AuthContext:** Gestiona el usuario autenticado y tokens.
-   **ThemeContext:** Controla el tema de la aplicación (Claro, Oscuro, Alto Contraste).

## Rutas (`src/routes`)
-   **AppRouter:** Define el mapa de navegación principal.
-   **ProtectedRoute:** Guard que protege rutas privadas verificando `isAuthenticated`.
-   **PublicRoute:** Guard que redirige a usuarios autenticados fuera de páginas públicas (como Login).

---
*Este documento es un artefacto vivo y debe actualizarse con cada nueva característica implementada.*
