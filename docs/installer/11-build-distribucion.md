# 11. Build y Distribución

La aplicación cuenta con un pipeline de construcción y empaquetado altamente automatizado, preparado para generar binarios profesionales para Windows, macOS y Linux.

## Herramientas de Empaquetado

- **Electron Builder**: Utilizado como motor de empaquetado principal. Gestiona la creación de instaladores NSIS, imágenes DMG y AppImages.
- **NSIS (Nullsoft Scriptable Install System)**: El instalador de Windows es altamente personalizado mediante scripts `.nsh`.
    - Soporta instalación "por máquina" (requiere privilegios).
    - Permite cambiar el directorio de instalación.
    - Crea accesos directos en el escritorio y menú de inicio con la marca SmartEconomat.

## Proceso de Firma Digital (Windows)

El proyecto incluye scripts específicos para la seguridad de los binarios:
- `sign:win:artifact`: Firma el ejecutable `.exe` y el instalador utilizando `signtool`.
- `verify:win:signature`: Verifica que la firma sea válida y provenga de una entidad de confianza.
- **Smart App Control**: La app incluye lógica para detectar si el sistema de seguridad de Windows 11 está activo y avisar al desarrollador si el binario necesita una firma EV (Extended Validation).

## Scripts de Build Principales

| Comando | Acción |
|---------|--------|
| `npm run build:app` | Compila el código TS y genera los assets del frontend. |
| `npm run build:win` | Genera el instalador `.exe` para Windows (NSIS). |
| `npm run build:mac` | Genera la imagen `.dmg` para macOS (Apple Silicon/Intel). |
| `npm run build:linux`| Genera el paquete `AppImage`. |
| `npm run build:windows-from-linux` | Utiliza Wine/Docker para compilar el instalador de Windows desde un entorno Linux (ideal para CI/CD). |

## Artefactos Generados
Los instaladores se depositan en la carpeta `dist/` con el siguiente formato de nombre:
`SmartEconomat-[version]-[os]-[arch].[ext]`

## Auto-Update (Futuro)
Aunque la infraestructura está preparada mediante `electron-updater`, actualmente el flujo de actualización parece ser manual (descarga de nueva versión) o mediante la reinstalación asistida por el panel de control.

> [!TIP]
> Para entornos empresariales, se recomienda integrar el build con **GitHub Actions** para automatizar la firma y la subida de "Releases" cada vez que se cree un tag de versión.
