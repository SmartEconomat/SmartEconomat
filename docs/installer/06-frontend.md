# 6. Frontend Completo

El frontend es una aplicación **React 19** sofisticada, diseñada para ser tanto un asistente de instalación paso a paso como un panel de control administrativo.

## Arquitectura del Frontend

### 1. Gestión de Estado (Context API)
En lugar de librerías pesadas de estado global, utiliza un enfoque de **Context API** para temas (`ThemeContext`) y gestión del flujo (`useInstallerFlow`). Este hook centraliza:
- El paso actual del wizard.
- Los logs acumulados en tiempo real.
- El estado de salud de los servicios Docker.
- Los resultados del preflight.

### 2. Sistema de Diseño (MUI 7)
Utiliza la versión 7 de **Material UI**, lo que le otorga una estética moderna y "glassmorphism":
- **Componentes**: Botones con gradientes, tarjetas con desenfoque de fondo (`backdropFilter`) y tipografía premium (`Manrope`).
- **Layouts**: Diseño responsivo que se adapta de un formato compacto para el asistente a uno expandido para el panel de control.

## Módulos Principales

| Módulo | Funcionalidad | Componentes Clave |
|--------|---------------|-------------------|
| **Welcome** | Presentación y selección de idioma. | `WelcomePage` |
| **Preflight** | Diagnóstico en tiempo real y autoreparación. | `PreflightPage`, `StatusCircle` |
| **Config** | Formularios dinámicos validados con Zod. | `ConfigPage`, `SmtpConfigPage` |
| **Deploy** | Visualización de logs de Docker y progreso. | `DeployPage`, `LogsViewer` |
| **Control Panel**| Gestión del ciclo de vida post-instalación. | `ControlPanelPage`, `ServiceCard` |
| **Backup** | Creación y restauración de copias de seguridad. | `BackupRestorePanel` |

## Características Técnicas Destacadas

- **Transiciones Suaves**: Uso de componentes de animación para pasar de un paso a otro, mejorando la percepción de calidad.
- **Validación en Tiempo Real**: Los formularios utilizan esquemas de Zod en el frontend para dar feedback inmediato al usuario antes de enviar los datos al proceso principal.
- **Visualizador de Logs**: Implementación de un visualizador de logs de alto rendimiento que maneja grandes volúmenes de salida de Docker sin bloquear la interfaz.
- **Modo Debug**: Una ruta especial (`#/debug`) permite abrir una consola de ingeniería que muestra eventos internos de la aplicación que no se ven en la UI normal.

## UX/UI (User Experience)
- **Hardening Visual**: El diseño evita que el usuario se sienta abrumado por la complejidad técnica de Docker, presentando los errores de forma accionable (botón "Auto-repair").
- **Prevención de Errores**: Diálogos de confirmación para acciones peligrosas (`ConfirmDangerDialog`) como la eliminación de volúmenes o la desinstalación.
