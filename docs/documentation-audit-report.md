# Informe Final de Auditoria Documental

Fecha: 2026-04-26

## 1) Archivos modificados

- `README.md` (reescritura completa)
- `docs/README.md` (reescritura completa)

## 2) Archivos creados

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
- `docs/changelog.md`
- `docs/documentation-audit-report.md`

## 3) Archivos eliminados

- `docs/PRODUCTION.md`
- `docs/Windows-Deployment.md`
- `docs/reference/variables-entorno.md`
- `docs/reference/variables-entorno-env.md`

## 4) Inconsistencias detectadas entre documentacion y codigo

1. README anterior indicaba que no hacia falta Node/npm en host en cualquier caso; el codigo si requiere Node para ejecucion local fuera de Docker y desarrollo por paquete.
2. Referencias a `wiki/` en varios documentos no corresponden a una carpeta real del repositorio.
3. Scripts de backend documentados con SWC en dev no coincidian con `start:dev` real (`nest start --watch`).
4. Variables de hot reload y polling desalineadas respecto a `docker-compose.dev.yml` actual.
5. Swagger documentado en rutas antiguas; el backend expone `/api/v1/docs`.
6. Documentos de despliegue duplicados y parcialmente contradictorios (`DEPLOYMENT`, `PRODUCTION`, `Windows-Deployment`).
7. Doble documentacion de variables de entorno en `docs/reference` con contenidos solapados y conflicto.
8. Rutas de screenshots/documentacion de installer antiguas en algunos documentos heredados.
9. Parte de la documentacion asumia artefactos/estructura inexistente en raiz (`package.json` raiz).
10. Cobertura de ElectronInstaller repartida en varios documentos sin unico punto canonico.

## 5) Riesgos tecnicos encontrados

- **Riesgo de operacion**: uso de variables mal nombradas o incompletas en produccion puede romper backend/redis/tls.
- **Riesgo de onboarding**: documentacion extensa y dispersa dificulta entrada de nuevos desarrolladores.
- **Riesgo de regresion**: ausencia de un contrato documental unico para env/deploy facilita configuraciones inconsistentes.
- **Riesgo de deuda**: coexistencia de docs legacy muy detalladas sin jerarquia clara puede reintroducir contradicciones.

## 6) Recomendaciones prioritarias

1. Mantener solo los documentos canonicos de `docs/README.md` como fuente principal.
2. En cada PR que cambie scripts/env/rutas API, actualizar el documento canonico correspondiente.
3. Añadir comprobacion automatica en CI para detectar enlaces markdown rotos.
4. Consolidar gradualmente la documentacion de modulos/frontend en resumentes por dominio y archivar detalle historico.
5. Marcar explicitamente documentos legacy de baja prioridad como "referencia historica" para evitar uso operativo.

## 7) Estado de cumplimiento del objetivo

- Documentacion principal reorganizada y alineada con codigo.
- Duplicados criticos eliminados (env) y despliegue consolidado en un unico documento.
- README profesional y orientado a uso real.
- Informe de auditoria y riesgos incluido.

---

## 8) Revisión mayor 2026-05-15 (estructura y saneamiento)

**Alcance:** segunda pasada enterprise sobre `docs/` (navegación, enlaces rotos, duplicados obvios y artefactos no mantenibles).

### Cambios realizados

- Reescritura de [README.md](./README.md) como **hub** con mapa mental, taxonomía de carpetas, convenciones terminológicas y enlaces a `.github/ai/`.
- Nueva ruta de onboarding: [onboarding/README.md](./onboarding/README.md).
- Fusión del contenido operativo de `CENTRALIZACION_CONFIGURACION.md` en [configuration.md](./configuration.md) (dominios y URLs derivadas); fichero duplicado eliminado.
- Corrección de [architecture/index.md](./architecture/index.md): enlaces rotos sustituidos por rutas reales y nota explícita sobre `docs/archive/obsolete/`.
- Corrección de enlaces `file://` absolutos en documentación de componentes (`TutorialHelper`, `LearningModeToggle`, `InteractiveTour`) y rutas de ejemplo en `PROMO_UI_KIT.md`.
- [frontend/README.md](./frontend/README.md): enlace canónico a arquitectura frontend (`architecture/frontend.md`).
- `ElectronInstaller/README.md`: runbooks apuntan a `ElectronInstaller/docs/...` (rutas válidas desde la raíz del repo).
- Eliminación de `docs/.pptx-export/` (artefactos y dependencias de exportación a diapositivas, no mantenidos como documentación).
- Eliminación de `docs/por_corregir/` (nota histórica sustituida por enlaces en seguridad/variables).
- Traslado de memoria/presentación HTML a [archive/tfg-artifacts/](./archive/tfg-artifacts/) con README explicativo.
- Traslado de `I18N_REPORT.md` a [audits/i18n-implementacion-informe-2026-04-14.md](./audits/i18n-implementacion-informe-2026-04-14.md); índice actualizado en [audits/README.md](./audits/README.md).

### Riesgos residuales

- Subárboles muy grandes (`frontend/componentes`, `frontend/accesibilidad`, `planning/`) siguen dependiendo de mantenimiento incremental; el hub prioriza rutas estables y runbooks raíz.
- No hay workflow en CI que valide enlaces relativos en `docs/` (el script y el workflow asociados se retiraron).

### Fase 2 (convención de rutas y CI)

- Renombrado `docs/guia_usuario/` → `docs/guia-usuario/`; `guia_usuario.html` → `guia-usuario.html`.
- ~~Workflow `docs-internal-links.yml`~~ (retirado): la validación de enlaces en `docs/` queda a criterio manual en revisión de PR.
