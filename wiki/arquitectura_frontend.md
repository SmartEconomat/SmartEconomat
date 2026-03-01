# Documentación de Arquitectura SmartEconomat

Este documento describe la arquitectura del proyecto `SmartEconomat` (Frontend), basada en principios de escalabilidad, mantenibilidad y separación de responsabilidades. Se actualizará a medida que se agreguen nuevas funcionalidades.

## Estructura del Proyecto

El proyecto sigue una organización modular:

```text
src/
├── assets/            # Recursos estáticos (imágenes, fuentes, estilos globales).
├── components/        # Componentes reutilizables.
│   └── ui/            # Componentes de UI puros (Botones, Inputs) sin lógica de negocio.
├── features/          # Módulos funcionales de la aplicación (Principalmente Auth).
├── layouts/           # Estructuras de página (MainLayout, AuthLayout).
├── pages/             # Componentes de página (Vistas que contienen la mayor parte de la cohesión lógica).
├── routes/            # Configuración de enrutamiento (AppRouter, Guards).
├── services/          # Comunicación con APIs y lógica de procesamiento de datos (Axios).
│   └── *.types.ts     # Definiciones de tipos específicas de cada servicio.
├── store/             # Gestión de estado global (Context API).
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── ToastContext.tsx
├── types/             # Tipos compartidos globales.
├── utils/             # Funciones de utilidad y configuración.
│   ├── config/        # Configuraciones globales (menuConfig).
│   └── theme/         # Definiciones de tema (themes.ts).
├── App.tsx            # Componente raíz.
└── main.tsx           # Punto de entrada.

```

## Principios de Arquitectura

Seguimos tres pilares fundamentales para mantener el código limpio:

### 1. Separación de Lógica y Datos
-   **Componentes (Pages):** Se encargan de la orquestación visual y la unión de los datos con la interfaz. Gran parte de la lógica de negocio inmediata reside aquí.
-   **Services:** Encapsulan toda la comunicación con el backend (Axios) y el procesamiento previo de los datos para que lleguen limpios a los componentes.
-   **Hooks:** Se utilizan para encapsular lógica reutilizable (como el estado de un formulario o la gestión de modales). *Nota: Si un componente crece en exceso, su lógica debe migrarse a hooks o services según corresponda.*

### 2. Composición de Componentes
- Priorizamos la composición (`children`) sobre el paso excesivo de propiedades ("Prop Drilling").

### 3. Colocación (Co-location)
- Recursos específicos (estilos locales, tipos específicos) viven en la misma carpeta o archivo que el componente o servicio que los usa.

## Funcionalidades (Features)

### Autenticación (`src/features/auth`)
Módulo encargado del inicio de sesión y gestión de la sesión del usuario.

## Gestión de Estado (`src/store`)
Utilizamos Context API para el estado global:
-   **AuthContext:** Gestiona el usuario autenticado y tokens JWT.
-   **ThemeContext:** Controla el tema de la aplicación.
-   **ToastContext:** Gestiona las notificaciones globales del sistema.


## Rutas (`src/routes`)
-   **AppRouter:** Define el mapa de navegación principal.
-   **ProtectedRoute:** Guard que protege rutas privadas verificando `isAuthenticated`.
-   **PublicRoute:** Guard que redirige a usuarios autenticados fuera de páginas públicas (como Login).

---
*Este documento es un artefacto vivo y debe actualizarse con cada nueva característica implementada.*
