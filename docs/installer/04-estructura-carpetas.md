# 4. Estructura de Carpetas

La organización sigue una estructura modular y limpia, diseñada para separar claramente las responsabilidades de cada proceso de Electron.

## Árbol del Proyecto (`ElectronInstaller/`)

```text
src/
├── main/               # Lógica del proceso principal (Node.js)
│   ├── ipc/            # Manejadores de comunicación Main <-> Renderer
│   ├── security/       # Configuraciones de seguridad y CSP
│   ├── services/       # Servicios de negocio (Docker, TLS, Preflight)
│   ├── state/          # Máquina de estados de la instalación
│   └── index.ts        # Punto de entrada de la aplicación
├── preload/            # Scripts de puente (ContextBridge)
├── renderer/           # Interfaz de usuario (React)
│   ├── app/            # Componente raíz y estilos globales
│   ├── assets/         # Imágenes, SVGs y fuentes
│   ├── components/     # Componentes React reutilizables
│   ├── hooks/          # Lógica compartida en el frontend (useInstallerFlow)
│   ├── pages/          # Vistas del asistente (Welcome, Preflight, etc.)
│   ├── store/          # Gestión de estado (Context API)
│   └── main.tsx        # Punto de entrada del frontend
├── shared/             # Tipos y constantes compartidos entre procesos
└── types/              # Definiciones de tipos adicionales
```

## Recursos y Configuración

- **`resources/`**: Contiene iconos, plantillas de configuración y scripts NSIS para el instalador nativo.
- **`scripts/`**: Colección de scripts `.mjs` para automatizar el build, firma, verificación de iconos y otras tareas de CI/CD.
- **`dist/`**: Archivos compilados listos para empaquetar.
- **`out/`**: Salida de la compilación de `electron-vite`.
- **`test/`**: Suites de pruebas unitarias e integración.

## Valoración de la Estructura
La estructura es **excelente**. 
- **Puntos positivos**: La separación de los manejadores IPC en archivos dedicados (`installer.ipc.ts`, `runtime.ipc.ts`) evita que el archivo `main.ts` se vuelva inmanejable. El uso de una carpeta `shared/` garantiza que los contratos de datos sean consistentes en ambos procesos.
- **Oportunidad de mejora**: A medida que crezca, se podría considerar un patrón de "Feature-based structure" en el renderer para agrupar componentes y hooks por funcionalidad, aunque actualmente la estructura por tipo de archivo funciona bien debido al tamaño del proyecto.
