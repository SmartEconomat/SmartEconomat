# Onboarding de desarrollo

Ruta corta para incorporarse al repositorio. Orden sugerido de lectura y comandos.

## 1. Entorno y arranque

1. [Instalación e infraestructura local](../installation.md) — Docker Compose, puertos y servicios.
2. [Configuración de runtime](../configuration.md) — entornos, TLS, proxy y dominios.
3. [Variables de entorno](../environment-variables.md) — inventario consolidado.
4. [Inicio rápido (guía breve)](../getting-started/inicio-rapido.md) — checklist opcional.

## 2. Arquitectura y contratos

1. [Arquitectura full-stack](../architecture.md) — visión por capas.
2. [Índice de arquitectura detallada](../architecture/index.md) — backend, frontend, datos y ADRs.
3. [Reglas de negocio](../business-rules.md) — comportamiento esperado del dominio.
4. Normativa interna del repo (fuente para agentes y revisiones): [`.github/ai/ARCHITECTURE.md`](../../.github/ai/ARCHITECTURE.md) y [`.github/ai/PROJECT_RULES.md`](../../.github/ai/PROJECT_RULES.md).

## 3. Flujo de trabajo

1. [Desarrollo](../development.md) — scripts, convenciones y contribución.
2. [Pruebas](../testing.md) — Jest, Vitest, Playwright y gates `qa:gate`.
3. [Despliegue](../deployment.md) — Compose producción y CI/CD.

## 4. Cuando algo falla

1. [Resolución de incidencias](../troubleshooting.md) — síntomas frecuentes.
2. [FAQ](../faq.md).
3. Guías por tema en [../operations/troubleshooting/](../operations/troubleshooting/README.md).
