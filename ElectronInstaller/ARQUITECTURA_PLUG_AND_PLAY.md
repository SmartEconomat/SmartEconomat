# SmartEconomat Plug-and-Play: Arquitectura de Producto Self-Hosted

## 1. Análisis técnico completo

### 1.1 Estado actual real del repositorio

- Backend NestJS y frontend React ya están productivizados con contenedores separados.
- Existe `docker-compose.prod.yml` con cuatro servicios (`db`, `redis`, `backend`, `frontend`) y segmentación de red interna/externa.
- Existen scripts operativos reutilizables:
  - Linux/macOS: `scripts/setup-smarteconomat-local.sh`, `scripts/setup-local-prod-https.sh`, `scripts/deploy.sh`.
  - Windows: `scripts/setup-smarteconomat-local.ps1`.
- La carpeta `ElectronInstaller` tiene únicamente `package.json` con `electron-builder`; no existe aplicación funcional (`main`, `preload`, UI, orquestación, panel).

### 1.2 Brecha entre estado actual y objetivo plug-and-play

Para llegar al objetivo tipo WordPress/Nextcloud (instalación guiada no técnica), faltan cinco bloques críticos:

1. Capa de instalación guiada desktop (wizard + validación + ejecución automatizada).
2. Capa de configuración segura (`.env.prod` generado desde inputs del usuario).
3. Capa de operaciones locales (start/stop/restart/logs/backup/restore).
4. Capa de hardening mínimo (secretos, puertos, Redis con password, acciones destructivas protegidas).
5. Capa de observabilidad operativa básica (healthchecks, diagnóstico y reporte de fallos legible).

### 1.3 Problemas potenciales detectados

1. **Dependencia de Docker en host final**

- Problema: si Docker Engine/Desktop no está instalado o el daemon no está operativo, toda la instalación falla.
- Impacto: bloqueo total del onboarding.

2. **Conflictos de puertos y red local**

- Problema: puertos `80/443` ocupados por otro software (Nginx/Apache/IIS/traefik).
- Impacto: despliegue incompleto o no accesible.

3. **Fragilidad de certificados TLS locales**

- Problema: trust store por SO es distinto; la confianza de cert autofirmado puede fallar.
- Impacto: advertencias de navegador y mala UX inicial.

4. **Gestión de secretos insuficiente por defecto**

- Problema: si no se fuerza complejidad y rotación inicial, credenciales débiles entran a producción local.
- Impacto: riesgo de compromiso temprano.

5. **Riesgo operativo por acciones destructivas**

- Problema: limpieza de volúmenes/restore mal ejecutado puede perder datos.
- Impacto: pérdida irreversible.

6. **Acoplamiento de runtime con build local**

- Problema: construir imágenes en host final aumenta variabilidad (toolchain, red, disco).
- Impacto: tiempos largos y fallos no deterministas.

7. **Ausencia de estado transaccional de instalación**

- Problema: si falla a mitad de proceso, no existe journal para reanudar o rollback seguro.
- Impacto: instalaciones “zombie”.

### 1.4 Riesgos técnicos clave

- Riesgo de timeout al compilar componentes pesados (incluida base de datos customizada).
- Riesgo de drift entre plantilla de `.env.prod` y variables realmente consumidas por backend/frontend/compose.
- Riesgo de UX opaca: error técnico sin traducción a acción concreta para usuario no técnico.
- Riesgo de soporte: sin bundle de diagnóstico, el equipo no puede reproducir incidencias fácilmente.

### 1.5 Decisiones de alcance ya fijadas

- Distribución principal: instalador Electron con despliegue Docker en la misma máquina local.
- Modo de conectividad: online permitido (no offline estricto en v1).
- TLS inicial: autofirmado inmediato con opción de migrar a Let’s Encrypt después.
- Panel de gestión local: obligatorio en v1 con backup/restore incluido.

---

## 2. Arquitectura propuesta

## 2.1 Principios de diseño

1. **Instalación declarativa y repetible**: todo paso debe poder reintentarse sin dañar datos.
2. **Seguridad por defecto**: secretos fuertes, superficie mínima de puertos, confirmaciones duras.
3. **Observabilidad mínima integrada**: logs y health visibles desde el panel.
4. **Compatibilidad cross-platform real**: flujo homogéneo con scripts especializados por SO.
5. **Separación estricta de responsabilidades**: Electron orquesta; Docker ejecuta; backend/DB mantienen contratos.

## 2.2 Componentes del sistema final

### A. SmartEconomat Installer (Electron)

- **Main Process (`src/main`)**
  - Detección de SO/arquitectura.
  - Gestión de procesos (`docker`, `docker compose`, scripts).
  - Máquina de estados de instalación.
  - Journal de ejecución (`installation-journal.json`).

- **Preload (`src/preload`)**
  - IPC segura con API allowlist (sin exponer Node completo al renderer).
  - Puente tipado para operaciones (`preflight`, `deploy`, `logs`, `backup`, etc.).

- **Renderer (`src/renderer`)**
  - Wizard de instalación.
  - Panel de gestión local.
  - Vista de logs y diagnósticos.

### B. Runtime local (Docker Compose producción)

- `frontend` (Nginx + SPA React) expuesto en `80/443`.
- `backend` (NestJS) en red interna.
- `db` (PostgreSQL + extensión UUIDv7) en red interna.
- `redis` en red interna con autenticación obligatoria.
- Volúmenes persistentes para DB, Redis y uploads.

### C. Motor de configuración

- `env.schema.json` para validar todos los campos esperados.
- `env.template.prod` versionado.
- Renderizador seguro de `.env.prod` con enmascarado de secretos en UI/logs.

### D. Motor operativo local (Local Control Plane)

Abstracción de comandos con políticas:

- `startStack`, `stopStack`, `restartStack`.
- `tailLogs(service, lines)`.
- `backupNow(label)`.
- `restoreFrom(artifact)`.
- `pruneSafe(level)`.

Todos encapsulados en un ejecutor con:

- lista blanca de comandos,
- timeout por operación,
- códigos de error normalizados,
- auditoría de acciones.

## 2.3 Estructura de proyecto recomendada

```text
ElectronInstaller/
  package.json
  electron-builder.yml
  src/
    main/
      index.ts
      ipc/
        installer.ipc.ts
        runtime.ipc.ts
      services/
        os-detector.service.ts
        preflight.service.ts
        docker-orchestrator.service.ts
        env-renderer.service.ts
        tls.service.ts
        backup-restore.service.ts
        diagnostics.service.ts
      state/
        install-state.machine.ts
      security/
        secret-store.service.ts
        command-allowlist.ts
    preload/
      index.ts
      api/
        installer-api.ts
    renderer/
      app/
      pages/
        WelcomePage.tsx
        PreflightPage.tsx
        ConfigPage.tsx
        DeployPage.tsx
        FinishPage.tsx
        ControlPanelPage.tsx
      components/
      hooks/
      types/
  scripts/
    install/
      linux/bootstrap.sh
      macos/bootstrap.sh
      windows/bootstrap.ps1
    ops/
      backup.sh
      backup.ps1
      restore.sh
      restore.ps1
      health-check.sh
      health-check.ps1
  resources/
    templates/
      env.template.prod
      env.schema.json
    compose/
      docker-compose.prod.yml
```

## 2.4 Arquitectura de seguridad mínima propuesta

1. `backend`, `db`, `redis` sin puertos publicados al host.
2. Solo `frontend` publica `80/443`.
3. `REDIS_PASSWORD` obligatorio y no visible en interfaz.
4. Generación de secretos aleatorios en primera instalación:

- `JWT_SECRET`
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`

5. Protección de acciones destructivas con doble confirmación + frase de validación.
6. Logs redactados (sin secretos, sin tokens, sin passwords).

---

## 3. Flujo de instalación detallado

## 3.1 Flujo end-to-end

1. Usuario instala y abre SmartEconomat Installer.
2. Wizard ejecuta **Preflight**.
3. Wizard captura configuración inicial.
4. Installer genera `.env.prod` y certificados TLS locales.
5. Installer construye/levanta stack Docker.
6. Installer verifica salud de servicios.
7. Installer ejecuta inicialización de datos/migraciones.
8. Installer presenta panel operativo con estado en tiempo real.

## 3.2 Preflight por etapas

### Etapa A: Sistema

- Detectar `os`, `arch`, versión y privilegios.
- Verificar espacio disco mínimo (ej. >= 10 GB).
- Verificar RAM mínima (ej. >= 6 GB recomendado).
- Verificar acceso escritura a carpeta de datos.

### Etapa B: Docker

- Comprobar `docker version` y daemon.
- Comprobar `docker compose version`.
- Comprobar permisos de usuario para Docker.

### Etapa C: Red y puertos

- Verificar puertos `80/443` libres.
- Si están ocupados: sugerir puertos alternativos o detener servicio conflictivo.

### Etapa D: Dependencias de certificados

- Linux/macOS: `openssl`, utilidades de trust local según distro.
- Windows: PowerShell admin + importación al almacén de certificados.

### Salida

- Semáforo por check (`OK`, `WARN`, `BLOCKER`) con acción recomendada.
- Botón `Reintentar` por check individual.

## 3.3 Wizard de configuración inicial

Campos mínimos:

- Usuario administrador inicial.
- Contraseña administrador (política fuerte).
- Nombre de instancia (ej. `smarteconomat-local`).
- Host local preferido (dominio local/IP).
- Política TLS inicial (autofirmado por defecto).
- Zona horaria.
- Preferencias de backup automático (frecuencia y retención).

Validaciones:

- Usuario: longitud y caracteres seguros.
- Password: complejidad mínima.
- Valores de entorno: validación contra `env.schema.json`.

## 3.4 Provisionado automático

1. Generar `.env.prod` desde template + inputs validados.
2. Crear certificados autofirmados e intentar trust local asistido.
3. Ejecutar `docker compose -f docker-compose.prod.yml up -d --build`.
4. Poll de healthchecks por servicio con timeout global.
5. Si falla: diagnóstico guiado + rollback parcial seguro.

## 3.5 Inicialización de aplicación

- Ejecutar migraciones de base de datos.
- Inicializar usuario admin si no existe.
- Validar endpoint principal frontend y API.
- Registrar journal final de instalación (`SUCCESS`/`FAILED`).

## 3.6 Operación post-instalación (panel local)

Operaciones obligatorias v1:

- Levantar servicios.
- Parar servicios.
- Reiniciar servicios.
- Ver logs por servicio.
- Limpiar contenedores/imágenes huérfanas con modo seguro.
- Ejecutar backup.
- Restaurar backup.
- Diagnóstico de estado (health + recursos).

---

## 4. Decisiones clave justificadas

1. **Electron como shell operativo y no solo instalador temporal**

- Justificación: reduce curva de soporte y habilita control post-instalación sin CLI.

2. **Docker Compose como runtime v1**

- Justificación: menor complejidad que Kubernetes para self-hosted mononodo.

3. **Preflight bloqueante antes de tocar infraestructura**

- Justificación: evita instalaciones corruptas y reduce tickets de soporte.

4. **TLS autofirmado inmediato + Let’s Encrypt posterior**

- Justificación: permite arranque local instantáneo sin depender de dominio público.

5. **Panel con backup/restore en v1**

- Justificación: sin recuperación de datos no existe operación real de producción.

6. **Comandos encapsulados con allowlist**

- Justificación: previene ejecución arbitraria desde UI, reduce superficie de ataque.

7. **Journal transaccional de instalación**

- Justificación: habilita reintentos consistentes y debugging reproducible.

8. **Hardening de Redis y red interna obligatorios**

- Justificación: protege sesiones/cache ante exposiciones accidentales.

---

## 5. Posibles alternativas

## Alternativa A: Instalación Web (sin Electron)

- Pros: menos componentes desktop.
- Contras: mala gestión local de Docker, peor UX en SO heterogéneos, más fricción de permisos.
- Veredicto: no recomendada para objetivo plug-and-play real.

## Alternativa B: Binario backend + frontend empaquetado (sin Docker)

- Pros: arranque potencialmente más rápido.
- Contras: empaquetado complejo por SO, menor aislamiento, upgrades más frágiles.
- Veredicto: no recomendada en v1.

## Alternativa C: Installer dual (Local + Remoto SSH)

- Pros: cubre operación en servidor dedicado.
- Contras: complejidad alta (SSH keys, firewall, transferencias, drift remoto).
- Veredicto: buena para v2 enterprise, fuera de v1.

## Alternativa D: Runtime Kubernetes k3s

- Pros: escalabilidad y resiliencia.
- Contras: sobrecoste operativo y curva de soporte desproporcionada para self-hosted inicial.
- Veredicto: no recomendada para primera versión.

---

## 6. Riesgos y mitigaciones

| Riesgo                                    | Severidad | Mitigación técnica                                                            |
| ----------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| Docker no disponible o daemon caído       | Alta      | Preflight bloqueante + guía de reparación + reintento parcial                 |
| Puertos 80/443 ocupados                   | Alta      | Detección previa + opciones de remapeo + instrucciones por SO                 |
| Certificados autofirmados no confiados    | Media     | Trust asistido + fallback con instrucciones guiadas                           |
| Secretos débiles                          | Alta      | Generación aleatoria por defecto + política de complejidad obligatoria        |
| Exposición accidental de backend/db/redis | Alta      | Compose con redes internas y sin publish de puertos internos                  |
| Pérdida de datos por limpieza agresiva    | Alta      | Modo seguro por defecto + doble confirmación + snapshots previos              |
| Fallo a mitad de instalación              | Alta      | Journal transaccional + rollback por fase + reanudar desde último checkpoint  |
| Deriva entre `.env` y código              | Media     | `env.schema.json` versionado + validación estricta previa a deploy            |
| Falta de trazabilidad de incidentes       | Media     | Bundle de diagnóstico exportable (logs + estado + versión)                    |
| Update rompe compatibilidad de backup     | Alta      | Metadata de versión en backup + validación de compatibilidad antes de restore |

---

# 🔥 PROMPT FINAL PARA IA EJECUTORA

Actúa como **equipo senior full-stack + DevOps + Desktop** y ejecuta la implementación completa del producto **SmartEconomat Plug-and-Play** sobre este repositorio, con calidad de producción y sin tareas a medias.

## Objetivo de implementación

Construir una solución instalable tipo WordPress/Nextcloud que permita:

1. Ejecutar instalador desktop (Electron).
2. Capturar configuración inicial de usuario/secretos/entorno.
3. Generar automáticamente `.env.prod`.
4. Construir y levantar stack Docker de producción.
5. Inicializar y verificar aplicación.
6. Exponer un panel local de gestión operativa (start/stop/restart/logs/backup/restore/clean).

## Restricciones obligatorias

- Mantener backend como fuente de verdad (DTOs/enums/contratos).
- No usar `any` en TypeScript.
- No duplicar lógica HTTP existente del frontend/back.
- No romper estructura actual del repositorio.
- Priorizar estabilidad y seguridad por defecto.

## Alcance exacto a implementar

### 1) Electron app completa (desde cero funcional)

Crear en `ElectronInstaller`:

- `src/main/index.ts`
- `src/main/ipc/installer.ipc.ts`
- `src/main/ipc/runtime.ipc.ts`
- `src/main/services/`
  - `os-detector.service.ts`
  - `preflight.service.ts`
  - `docker-orchestrator.service.ts`
  - `env-renderer.service.ts`
  - `tls.service.ts`
  - `backup-restore.service.ts`
  - `diagnostics.service.ts`
- `src/main/security/`
  - `command-allowlist.ts`
  - `secret-store.service.ts`
- `src/preload/index.ts`
- `src/renderer/` (UI React o HTML+TS, preferible React para mantenibilidad)
  - páginas: Welcome, Preflight, Config, Deploy, Finish, ControlPanel
  - componentes: ServiceStatusCard, LogsViewer, ConfirmDangerDialog, BackupRestorePanel

Condiciones de seguridad Electron:

- `contextIsolation: true`
- `nodeIntegration: false`
- API IPC con allowlist estricta
- Validación de payloads de IPC con schema

### 2) Dockerfiles de producción optimizados

Revisar y optimizar:

- `backend/Dockerfile.prod`
- `frontend/Dockerfile.prod`
- `database/Dockerfile`

Objetivos:

- multi-stage build eficiente
- minimizar tamaño de imagen
- usuarios no-root en runtime
- capas cacheables
- healthchecks coherentes
- etiquetas OCI de versión/build

### 3) `docker-compose.prod.yml` endurecido

Aplicar o ajustar:

- servicios: `frontend`, `backend`, `db`, `redis`
- redes separadas: externa/interna
- solo `frontend` publica puertos
- `redis` con `REDIS_PASSWORD` obligatorio
- `env_file: .env.prod`
- volúmenes persistentes explícitos
- `restart: unless-stopped`
- healthchecks robustos
- límites de recursos razonables
- logging con rotación

Agregar perfiles opcionales:

- `profile: tools` para tareas de mantenimiento/diagnóstico si aplica.

### 4) Sistema de configuración automática

Implementar en `ElectronInstaller/resources/templates`:

- `env.template.prod`
- `env.schema.json`

Implementar flujo:

1. UI captura inputs iniciales.
2. Validación estricta (schema + reglas de negocio).
3. Generación de secretos aleatorios seguros si el usuario no provee.
4. Render de `.env.prod` en ruta de runtime local.
5. Nunca mostrar secretos completos en UI/logs.

### 5) Scripts automáticos por sistema operativo

Crear scripts de bootstrap:

- Linux: `ElectronInstaller/scripts/install/linux/bootstrap.sh`
- macOS: `ElectronInstaller/scripts/install/macos/bootstrap.sh`
- Windows: `ElectronInstaller/scripts/install/windows/bootstrap.ps1`

Responsabilidades:

- verificar Docker/Compose
- verificar privilegios
- validar puertos
- preparar carpetas persistentes
- preparar certificados autofirmados
- devolver códigos de salida normalizados

Scripts de operación:

- backup/restore/health-check para Bash y PowerShell
- soportar ejecución desde Electron sin shell arbitraria

### 6) Panel local de gestión (v1)

Implementar en UI del installer:

- Start stack
- Stop stack
- Restart stack
- Logs por servicio (stream + filtros básicos)
- Clean safe (containers/images dangling; volúmenes solo con confirmación fuerte)
- Backup manual + programado
- Restore desde artefacto
- Estado de salud en tiempo real

### 7) Backup y restore reales

Backup debe incluir:

- dump de PostgreSQL consistente
- `uploads`
- metadata del backup (`appVersion`, `schemaVersion`, fecha, checksum)

Restore debe:

- validar compatibilidad mínima de versión
- pedir confirmación explícita
- detener stack de forma controlada
- restaurar DB y archivos
- levantar stack y verificar salud

### 8) Flujo de instalación transaccional

Implementar máquina de estados:

- `IDLE`
- `PREFLIGHT`
- `CONFIG_VALIDATION`
- `ENV_RENDER`
- `TLS_SETUP`
- `DOCKER_DEPLOY`
- `INITIALIZE_APP`
- `VERIFY`
- `DONE`
- `FAILED`

Requisitos:

- journal persistente por instalación
- reintento por fase
- rollback parcial seguro cuando proceda

### 9) Seguridad mínima obligatoria

- no exponer puertos de backend/db/redis
- secretos aleatorios robustos por defecto
- redacción de secretos en logs
- comandos OS encapsulados en allowlist
- doble confirmación para operaciones destructivas
- sanitización de entradas de usuario antes de shell execution

### 10) CI/CD y calidad

Configurar pipeline (si ya existe, extender):

- lint
- build
- tests unitarios mínimos del installer
- smoke test de compose

Añadir pruebas mínimas:

- validación de `env.schema`
- preflight service
- env renderer
- parser de estado de healthchecks
- operaciones backup metadata

### 11) Entregables obligatorios

1. Código completo en `ElectronInstaller` funcional.
2. Dockerfiles prod optimizados.
3. `docker-compose.prod.yml` endurecido y documentado.
4. Scripts cross-platform completos.
5. Panel operativo v1 funcional.
6. Documentación de operación:

- `ElectronInstaller/README.md`
- runbook de instalación
- troubleshooting por SO

### 12) Orden de ejecución recomendado

1. Base Electron (main/preload/renderer + IPC seguro).
2. Preflight y generación de `.env.prod`.
3. Orquestación Docker + healthchecks.
4. Panel de control y logs.
5. Backup/restore.
6. Hardening seguridad.
7. Tests + documentación + empaquetado final.

### 13) Criterios de aceptación (DoD)

- Instalación limpia en Linux, macOS y Windows.
- Usuario no técnico puede completar instalación guiada sin CLI.
- Stack queda operativo y accesible al finalizar wizard.
- Panel permite operar ciclo de vida y mantenimiento básico.
- Backup/restore validado end-to-end.
- Sin secretos expuestos en UI/logs.
- Build/lint/tests relevantes en verde.

### 14) Modo de trabajo exigido

- No dejar TODOs sin resolver.
- Si una estrategia falla, aplicar alternativa automáticamente.
- Mantener cambios pequeños pero completos por módulo.
- Ejecutar verificación real antes de declarar finalización.
- Reportar al final:
  - archivos creados/modificados,
  - comandos ejecutados,
  - resultados de pruebas,
  - riesgos residuales.
