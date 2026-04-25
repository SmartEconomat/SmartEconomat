# 16. Deuda Técnica Detectada

Aunque el proyecto es de alta calidad, existen áreas donde se ha sacrificado la perfección en favor de la funcionalidad o debido a limitaciones técnicas.

## Matriz de Deuda Técnica

| Prioridad | Problema | Impacto | Solución Propuesta |
|-----------|----------|---------|--------------------|
| **Alta** | Dependencia de Docker Desktop en Windows | Los usuarios deben instalar Docker Desktop manualmente si falla el auto-repair. | Explorar el uso de **Docker Engine nativo en WSL2** o **Podman** como alternativas. |
| **Media** | Tamaño de los artefactos de instalación | Los instaladores superan los 500MB al incluir todo el stack. | Implementar un **descargador asíncrono** (downloader) para los componentes pesados. |
| **Media** | Acoplamiento con Windows | Muchas funciones usan comandos `powershell` directos. | Abstraer más la capa de sistema para mejorar la paridad con Linux/macOS. |
| **Baja** | Gestión de secretos en texto plano en `.env` | Los secretos son visibles para cualquier usuario local con acceso a la carpeta. | Integrar el uso del **Secret Storage** nativo de Electron/OS (Keytar). |
| **Baja** | Sandbox desactivado | Reduce una capa de aislamiento de seguridad de Electron. | Refactorizar las llamadas a sistema para que ocurran solo en utilidades muy específicas que puedan sandboxed. |

## Riesgos Técnicos
1. **Cambios en Docker CLI**: Si una actualización futura de Docker cambia el formato de salida de `docker compose`, el parseo actual de healthchecks podría fallar.
2. **Certificados TLS**: El uso de certificados autofirmados puede ser bloqueado por políticas de grupo (GPO) muy estrictas en entornos corporativos/educativos.
3. **Versiones de Node**: La app requiere Node 22+. Si el entorno del desarrollador tiene una versión inferior, el build fallará de forma críptica.
