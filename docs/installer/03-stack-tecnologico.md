# 3. Stack Tecnológico Completo

El proyecto utiliza un stack moderno y vanguardista, priorizando la seguridad y la experiencia del desarrollador.

## Tecnologías Base

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| **Core** | Electron | 40.7.0* | Framework de escritorio multi-plataforma. |
| **Runtime** | Node.js | >= 22.2.0 | Ejecución de lógica de sistema y scripts nativos. |
| **Frontend** | React | 19.2.0 | Biblioteca para la construcción de interfaces. |
| **Lenguaje** | TypeScript | 5.9.3 | Tipado estricto para prevenir errores en tiempo de desarrollo. |
| **Estilos** | MUI / Emotion | 7.3.7 / 11 | Sistema de diseño profesional y componentes premium. |

> \* *Nota: La versión de Electron parece ser una referencia de vanguardia o pre-release según el package.json.*

## Librerías Críticas

### 1. Validación y Esquemas
- **Zod (3.24)**: Utilizada para validar las configuraciones del usuario antes de iniciar el despliegue Docker. Garantiza que los puertos, correos y contraseñas cumplan los requisitos.
- **Ajv (8.17)**: Validación rápida de esquemas JSON.

### 2. Infraestructura y Sistema
- **Nodemailer (8.0)**: Permite probar la configuración SMTP del usuario directamente desde el instalador.
- **Selfsigned (2.4)**: Generación automática de certificados TLS para habilitar HTTPS local sin intervención manual.
- **Sharp (0.34)**: Procesamiento de imágenes para la generación dinámica de iconos.

### 3. Build y Herramientas de Desarrollo
- **electron-vite (3.1)**: Pipeline de construcción extremadamente rápido basado en Vite.
- **electron-builder (26.8)**: Generación de instaladores (NSIS, DMG, AppImage) y gestión de auto-updates.
- **Vitest (3.2)**: Framework de tests unitarios de alto rendimiento.
- **Playwright (1.59)**: Pruebas End-to-End (E2E) simulando la instalación real.

## Motivo de Elección vs Alternativas

| Librería | Por qué se eligió | Alternativa moderna |
|----------|-------------------|---------------------|
| **MUI 7** | Estándar de la industria, robustez y accesibilidad superior. | Tailwind CSS (más ligero pero requiere más configuración de componentes). |
| **Vite** | Velocidad de recarga (HMR) y tiempos de build infinitamente mejores que Webpack. | Turbopack (aún joven para Electron). |
| **Zod** | Integración perfecta con TypeScript y sintaxis declarativa. | Yup / Joi (Zod es ahora el estándar de facto en TS). |
| **Playwright** | Más rápido y confiable que Selenium o Spectron para apps de escritorio. | Cypress (limitado en Electron nativo). |

## Otras Dependencias Relevantes
- **electron-log**: Centralización de logs en archivos físicos para depuración post-mortem.
- **rcedit**: Manipulación de recursos de binarios Windows (iconos, metadatos).
- **dayjs**: Manipulación ligera de fechas y tiempos.
