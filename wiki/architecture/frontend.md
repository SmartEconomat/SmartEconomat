Este documento describe la arquitectura del proyecto `SmartEconomat` (Frontend), basada en **React 19**, **Vite** y **Material UI (MUI)**. Diseñada siguiendo principios de escalabilidad, mantenibilidad y separación de responsabilidades.

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
│   ├── auth/          # Utilidades de autenticación y JWT.
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

### Módulos Principales (Features)

1. **Autenticación (`src/features/auth`)**: Gestión de login, registros vinculados, recuperación de contraseña y persistencia de sesión verificada.
2. **Productos y Catálogo**: Gestión de fichas técnicas y códigos de barras.
3. **Pedidos y Recepciones**: Flujos de compra y entrada de stock masiva/multi-pedido.
4. **Inventario y Ubicaciones**: Control físico de stock FEFO y trazabilidad.
5. **Recetas y Producción**: Escandallos, cocinado y gestión de lotes producidos.
6. **Módulo Educativo**: Panel de profesores y slots para alumnos.

## Gestión de Estado (`src/store`)
Utilizamos Context API para el estado global:
-   **AuthContext:** Gestiona el usuario autenticado, la verificación del JWT con backend y los permisos vigentes de la sesión.
-   **ThemeContext:** Controla el tema de la aplicación.
-   **ToastContext:** Gestiona las notificaciones globales del sistema.

### Flujo actual de autenticación y sesión

El frontend ya no confía en `localStorage` como fuente final de permisos o validez de sesión.

1. **Persistencia local**: se conservan `token` y `user` para recuperar estado tras refresco.
2. **Validación mínima del JWT**: `src/utils/auth/jwtUtils.ts` comprueba formato y expiración (`exp`).
3. **Verificación obligatoria con backend**: si hay un token utilizable, `AuthContext` llama a `authService.getCurrentUser()` contra `GET /api/v1/usuarios/perfil`.
4. **Sincronización de permisos**: los permisos devueltos por backend sustituyen cualquier valor previamente persistido en cliente.
5. **Estados explícitos**: `AuthContext` expone `isAuthResolved`, `isSessionVerified` y `verifiedToken` para diferenciar entre sesión pendiente, sesión verificada y último token confirmado por servidor.
6. **Cierre defensivo**: si el token es inválido, expira, cambia en `localStorage` o backend responde `401`, la sesión se limpia y el usuario vuelve a `/login`.

### Protección de rutas

- **`PublicRoute`** mantiene fuera de `/login` a usuarios con sesión ya verificada.
- **`ProtectedRoute`** valida presencia de token, validez local del JWT, sesión verificada por backend y permiso requerido por ruta.
- **`AppRouter`** envuelve las rutas definidas en `menuConfig` con `ProtectedRoute requiredPermission={item.permiso}` para bloquear navegación directa por URL.
- **Revalidación de token**: si el token actual difiere de `verifiedToken`, la vista protegida muestra un `Spinner` y fuerza una nueva verificación antes de renderizar contenido.


## Navegación y Estilo
- **React Router v7**: Para el enrutamiento y guards de seguridad.
- **Material UI (MUI) v7**: Sistema de diseño basado en componentes modernos.
- **Vite**: Herramienta de construcción ultra rápida que sustituye a CRA.

---
*Este documento es un artefacto vivo y debe actualizarse con cada nueva característica implementada.*
