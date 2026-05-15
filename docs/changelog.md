# Changelog de Documentacion

## 2026-04-26

### Reorganizacion canonica

- Nuevo `README.md` raiz alineado con codigo real.
- Nuevo `docs/README.md` como indice oficial.
- Creados documentos canonicos:
  - `docs/architecture.md`
  - `docs/business-rules.md`
  - `docs/installation.md`
  - `docs/configuration.md`
  - `docs/environment-variables.md`
  - `docs/development.md`
  - `docs/deployment.md`
  - `docs/testing.md`
  - `docs/troubleshooting.md`
  - `docs/faq.md`
  - `docs/documentation-audit-report.md`

### Consolidacion y limpieza

- Consolidada la guia de despliegue en `docs/deployment.md`.
- Eliminados documentos obsoletos de despliegue:
  - `docs/PRODUCTION.md`
  - `docs/Windows-Deployment.md`
- Eliminados duplicados de variables de entorno:
  - `docs/reference/variables-entorno.md`
  - `docs/reference/variables-entorno-env.md`

### Criterio aplicado

- Codigo como fuente de verdad.
- Sin asumir funcionalidades no implementadas.
- Reduccion de contradicciones y enlaces legacy.

## 2026-05-15

### Hub y saneamiento de `docs/`

- `docs/README.md` reescrito como mapa mental, taxonomía de carpetas y convenciones terminológicas.
- Añadido `docs/onboarding/README.md` para ruta de incorporación.
- Fusionado contenido de `CENTRALIZACION_CONFIGURACION.md` en `docs/configuration.md` y eliminado el duplicado.
- Corregido `docs/architecture/index.md` (enlaces rotos) y referencias cruzadas en `overview.md`, `backend-quick-reference.md` y `trabajo-en-equipo.md`.
- Eliminados `docs/.pptx-export/` y `docs/por_corregir/`.
- HTML de memoria TFG movidos a `docs/archive/tfg-artifacts/`.
- Informe i18n movido a `docs/audits/i18n-implementacion-informe-2026-04-14.md`.
- Enlaces `file://` corregidos en documentación de componentes frontend; runbooks del instalador en `ElectronInstaller/README.md` alineados con `ElectronInstaller/docs/`.
- `docs/testing.md`: descripción de `qa:gate` alineada con `package.json` (incluye corrección del bloque ElectronInstaller).
- README de backend y frontend del paquete: enlaces a `wiki/` sustituidos por `docs/configuration.md`.

### Fase 2 (mismo día)

- Carpeta `docs/guia_usuario/` renombrada a `docs/guia-usuario/`; `guia_usuario.html` → `guia-usuario.html` (convención kebab-case).
- Script `scripts/check-docs-internal-links.mjs` y workflow GitHub Actions `docs-internal-links.yml` para validar enlaces relativos bajo `docs/` (se excluye `docs/archive/` del barrido).

