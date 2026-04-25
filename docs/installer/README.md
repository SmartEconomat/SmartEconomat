# Documentación Técnica: SmartEconomat Installer (Plug-and-Play)

Bienvenido a la documentación técnica oficial de **SmartEconomat Installer**, una aplicación Electron diseñada para el despliegue transaccional, hardening y gestión del ciclo de vida del ecosistema SmartEconomat.

Esta documentación ha sido generada tras una auditoría técnica profunda del código fuente, arquitectura y procesos de la aplicación.

## 📑 Índice de Contenidos

### 1. [Resumen Ejecutivo](./01-resumen-ejecutivo.md)
Visión general del producto, problema que resuelve y valoración técnica inicial.

### 2. [Arquitectura Global](./02-arquitectura-global.md)
Detalle del Main Process, Renderer Process, Preload scripts y comunicación IPC.

### 3. [Stack Tecnológico](./03-stack-tecnologico.md)
Análisis de las herramientas, frameworks y librerías utilizadas.

### 4. [Estructura de Carpetas](./04-estructura-carpetas.md)
Organización del código fuente y recursos del proyecto.

### 5. [Flujo de Arranque](./05-flujo-arranque.md)
Ciclo de vida desde el inicio de la aplicación hasta la interactividad.

### 6. [Frontend Completo](./06-frontend.md)
Análisis de la UI/UX construida con React 19 y Material UI 7.

### 7. [Backend Interno y Lógica Node](./07-backend-logica-node.md)
Servicios nativos de Node.js para gestión de sistema y Docker.

### 8. [Seguridad](./08-seguridad.md)
Auditoría de aislamiento de contexto, validación IPC y riesgos.

### 9. [Sistema IPC](./09-sistema-ipc.md)
Catálogo detallado de canales de comunicación entre procesos.

### 10. [Base de Datos y Persistencia](./10-persistencia.md)
Gestión de datos locales, backups y estados de instalación.

### 11. [Build y Distribución](./11-build-distribucion.md)
Procesos de empaquetado, firma digital y generación de instaladores.

### 12. [Rendimiento](./12-rendimiento.md)
Evaluación de consumo de recursos y optimizaciones.

### 13. [Calidad del Código](./13-calidad-codigo.md)
Análisis de mantenibilidad, patrones de diseño y estándares.

### 14. [Testing](./14-testing.md)
Estrategias de pruebas unitarias, integración y E2E.

### 15. [Capturas de Pantalla](./15-capturas.md)
Guía visual de las interfaces principales de la aplicación.

### 16. [Deuda Técnica](./16-deuda-tecnica.md)
Identificación de áreas de mejora y riesgos técnicos.

### 17. [Roadmap Recomendado](./17-roadmap.md)
Sugerencias de evolución a corto, medio y largo plazo.

### 18. [Guía para el Desarrollador](./18-guia-desarrollador.md)
Instrucciones para configuración del entorno local y desarrollo.

### 19. [Valoración Final](./19-valoracion-final.md)
Conclusiones del arquitecto auditor.

---

## 💎 Extra Premium
- [Análisis de Riesgos y Quick Wins](./extra-premium.md)

---
**SmartEconomat Installer** - *Arquitectura Robusta para Entornos Críticos*
