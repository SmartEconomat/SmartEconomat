# 18. Guía para el Nuevo Desarrollador

Si acabas de llegar al proyecto, esta guía te ayudará a poner en marcha tu entorno de desarrollo en minutos.

## Requisitos Previos

- **Node.js**: Versión 22.2.0 o superior (recomendado usar `nvm`).
- **Docker Desktop**: Instalado y con soporte para WSL2 activado.
- **Git**: Para control de versiones.
- **VS Code**: Con las extensiones de ESLint y Prettier recomendadas.

## Configuración del Entorno

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/usuario/SmartEconomat.git
   cd SmartEconomat/ElectronInstaller
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Variables de Entorno**:
   Copia el archivo de ejemplo (si existe) o crea un `.env` en la raíz de `ElectronInstaller/`:
   ```bash
   DEBUG=true
   ELECTRON_RENDERER_URL=http://localhost:5173
   ```

## Comandos de Desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Lanza el servidor de desarrollo de Vite y Electron en modo watch. |
| `npm run build:app` | Compila el frontend y los scripts del main. |
| `npm run lint` | Ejecuta el análisis estático de código. |
| `npm run test` | Ejecuta los tests unitarios. |

## Estructura de Trabajo
- Si necesitas modificar la **UI**, trabaja en `src/renderer`.
- Si necesitas añadir lógica de **Sistema/Docker**, trabaja en `src/main/services` y registra el canal en `src/main/ipc`.
- Si cambias un **Contrato** entre procesos, actualiza `src/shared/contracts.ts`.

## Tips de Depuración
- La aplicación abre automáticamente una **Debug Window** si la variable de entorno `DEBUG=true` está presente.
- Utiliza las **DevTools** de Chrome (Cmd+Alt+I / Ctrl+Shift+I) tanto en la ventana principal como en la de debug.
- Los logs se guardan físicamente en la carpeta `logs/` de la raíz del proyecto durante el desarrollo.
