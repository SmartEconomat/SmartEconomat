# Variables de entorno SmartEconomat (.env)

Guia completa de variables usadas en `.env.dev`, `.env.prod` y `.env.example`.

## Objetivo

- Explicar que hace cada variable.
- Marcar importancia operativa/seguridad.
- Dar valor recomendado para `dev` y `prod`.
- Evitar errores tipicos de despliegue.

## Regla base

- `backend` define contratos y comportamiento real.
- `frontend` consume API, no inventa contratos.
- En produccion: no secretos hardcodeados, no placeholders `CHANGE_ME`.

## Niveles de importancia

- `Critica`: si falla, sistema no arranca o queda inseguro.
- `Alta`: flujo principal impactado fuerte.
- `Media`: afecta features secundarias/operacion.
- `Baja`: util en casos especificos.

---

## 1) Entorno general

### `NODE_ENV`
- Uso: define modo runtime (`development` / `production`).
- Importancia: `Critica`.
- Riesgo: mal valor cambia logs, optimizaciones, seguridad.
- Dev recomendado: `development`.
- Prod recomendado: `production`.

### `DOMAIN`
- Uso: dominio base para app/certificados/scripts.
- Importancia: `Alta`.
- Riesgo: TLS, callbacks o rutas de despliegue incorrectas.
- Dev recomendado: `localhost` (o dominio local configurado).
- Prod recomendado: dominio real publico.

---

## 2) Backend/API

### `BACKEND_PORT`
- Uso: puerto HTTP backend NestJS.
- Importancia: `Alta`.
- Riesgo: frontend/proxy no conecta con API.
- Dev recomendado: `3000`.
- Prod recomendado: `3000` interno + proxy TLS externo.

---

## 3) Frontend

### `FRONTEND_PORT`
- Uso: puerto frontend (Vite/Nginx segun entorno).
- Importancia: `Alta`.
- Riesgo: colision de puertos o app inaccesible.
- Dev recomendado: `5173`.
- Prod recomendado: interno segun compose; publico via 80/443.

### `VITE_SENTRY_DSN`
- Uso: DSN de Sentry para frontend.
- Importancia: `Media`.
- Riesgo: perdida de observabilidad frontend.
- Dev recomendado: vacio o DSN de entorno dev.
- Prod recomendado: DSN real de proyecto frontend.

---

## 4) Observabilidad

### `SENTRY_DSN`
- Uso: DSN de Sentry backend.
- Importancia: `Media`.
- Riesgo: errores backend sin trazabilidad central.
- Dev recomendado: vacio o DSN dev.
- Prod recomendado: DSN real backend.

---

## 5) JWT/Auth

### `JWT_SECRET`
- Uso: firma/verificacion tokens JWT.
- Importancia: `Critica`.
- Riesgo: secreto debil expone sesion/autenticacion.
- Dev recomendado: valor temporal no productivo.
- Prod recomendado: secreto fuerte (>=32 chars aleatorio), rotado y almacenado seguro.

### `JWT_EXPIRATION`
- Uso: tiempo de expiracion token (`7d`, `12h`, etc).
- Importancia: `Alta`.
- Riesgo: muy largo = mayor ventana de riesgo; muy corto = mala UX.
- Dev recomendado: `7d` para comodidad.
- Prod recomendado: segun politica (ej. `12h` o `1d`).

---

## 6) PostgreSQL

### `POSTGRES_USER`
- Uso: usuario de BD.
- Importancia: `Critica`.
- Riesgo: backend no autentica en DB.

### `POSTGRES_PASSWORD`
- Uso: password usuario DB.
- Importancia: `Critica`.
- Riesgo: acceso no autorizado si debil/expuesto.
- Prod: nunca usar valor por defecto.

### `POSTGRES_DB`
- Uso: nombre base de datos.
- Importancia: `Critica`.
- Riesgo: app apunta DB incorrecta.

### `POSTGRES_PORT`
- Uso: puerto PostgreSQL.
- Importancia: `Alta`.
- Riesgo: conexion fallida por puerto incorrecto.
- Valor comun: `5432`.

### `DB_HOST`
- Uso: host BD (`db` en Docker network, otro host fuera Docker).
- Importancia: `Critica`.
- Riesgo: backend no conecta o conecta destino incorrecto.

### `DB_SYNC`
- Uso: auto-sync esquema TypeORM.
- Importancia: `Critica`.
- Riesgo: en prod puede alterar esquema sin control.
- Dev recomendado: `false` (usar migraciones).
- Prod recomendado: `false` obligatorio.

---

## 7) Redis

### `REDIS_HOST`
- Uso: host Redis.
- Importancia: `Alta`.
- Riesgo: cache/sesiones/permisos degradados.

### `REDIS_PORT`
- Uso: puerto Redis.
- Importancia: `Alta`.
- Riesgo: backend sin cache.
- Valor comun: `6379`.

### `REDIS_PASSWORD`
- Uso: password Redis.
- Importancia: `Alta`.
- Riesgo: acceso no autorizado a cache/datos transitorios.
- Prod recomendado: secreto fuerte, no vacio.

---

## 8) I18N

### `I18N_PATH`
- Uso: ruta custom traducciones.
- Importancia: `Baja` (si app usa default interna).
- Riesgo: mensajes i18n no cargan desde ruta esperada.

### `I18N_FALLBACK_LANGUAGE`
- Uso: idioma fallback.
- Importancia: `Media`.
- Riesgo: mensajes vacios o idioma no esperado.
- Recomendado: `es` (alineado dominio proyecto).

---

## 9) Mail/SMTP

### `MAIL_HOST`
- Uso: host SMTP.
- Importancia: `Media` (alta si flujo email critico).
- Riesgo: no salen correos.

### `MAIL_PORT`
- Uso: puerto SMTP.
- Importancia: `Media`.
- Valor comun: `587` (STARTTLS) o `465` (SSL).

### `MAIL_USER`
- Uso: usuario SMTP.
- Importancia: `Media`.

### `MAIL_PASS`
- Uso: password/app-password SMTP.
- Importancia: `Alta`.
- Riesgo: compromiso de cuenta correo.

### `MAIL_SECURE`
- Uso: TLS explicito SMTP (`true` suele 465).
- Importancia: `Media`.
- Riesgo: handshake SMTP incorrecto si no coincide con puerto/proveedor.

---

## 10) Seeders / Bootstrap

### `SEED_DEFAULT_ADMIN_TEMP_PASSWORD`
- Uso: password temporal admin seed.
- Importancia: `Alta`.
- Riesgo: acceso privilegiado con credencial conocida.
- Prod: cambiar siempre; ideal via secreto seguro.

### `SEED_BOOTSTRAP_ADMIN_EMAIL`
- Uso: email usuario bootstrap.
- Importancia: `Media`.

### `SEED_BOOTSTRAP_ADMIN_USERNAME`
- Uso: username bootstrap.
- Importancia: `Media`.
- Valor comun: `superadmin`.

### `SEED_BOOTSTRAP_ADMIN_PASSWORD`
- Uso: password bootstrap explicita.
- Importancia: `Alta`.

### `SEED_API_BASE_URL`
- Uso: URL base para scripts seed que llaman API.
- Importancia: `Media`.

### `SEED_DOCKER_COMPOSE_FILE`
- Uso: compose target para scripts seed.
- Importancia: `Baja`.

### `SEED_LOG_DIR`
- Uso: ruta logs de seeders.
- Importancia: `Baja`.

### `SEED_MOVIMIENTOS_GET_ONLY`
- Uso: modo solo lectura en movimientos (seed/script).
- Importancia: `Media`.

### `SEED_MOVIMIENTOS_GET`
- Uso: habilita lectura movimientos en seed.
- Importancia: `Baja`.

### `SEED_ONLY_DOMAIN`
- Uso: restringe ejecucion seed por dominio.
- Importancia: `Media`.

### `SEED_RUN_TAG`
- Uso: etiqueta corrida seed.
- Importancia: `Baja`.

### `SEED_MULTIPLIER`
- Uso: factor escala datos seed.
- Importancia: `Media`.
- Riesgo: carga excesiva si valor alto.

### `SEEDER_LANG`
- Uso: idioma datos/mensajes seed.
- Importancia: `Baja`.
- Recomendado: `es`.

### `IS_SEEDING`
- Uso: flag runtime de proceso seed.
- Importancia: `Media`.

### `RUN_BOOTSTRAP_SEEDER`
- Uso: ejecutar bootstrap seeder al arranque.
- Importancia: `Alta`.
- Riesgo: alta accidental de usuarios/datos en prod.
- Prod recomendado: `false` salvo operacion controlada.

### `STARTUP_RUN_MIGRATIONS`
- Uso: correr migraciones al startup.
- Importancia: `Alta`.
- Riesgo: arranque lento/fallido si migracion rompe.
- Prod: habilitar solo con pipeline controlado.

---

## 11) OpenFoodFacts

### `OPEN_FOOD_FACTS_PROXY_REQUEST_DELAY_MS`
- Uso: delay entre requests via proxy.
- Importancia: `Media`.
- Riesgo: rate-limit externo si muy bajo.

### `OPEN_FOOD_FACTS_REQUEST_DELAY_MS`
- Uso: delay requests directos.
- Importancia: `Media`.

### `OPEN_FOOD_FACTS_PROXY_TIMEOUT_MS`
- Uso: timeout peticiones via proxy.
- Importancia: `Media`.

### `OPEN_FOOD_FACTS_TIMEOUT_MS`
- Uso: timeout peticiones directas.
- Importancia: `Media`.

### `OPEN_FOOD_FACTS_IMAGE_TIMEOUT_MS`
- Uso: timeout descarga imagenes.
- Importancia: `Baja`.

---

## 12) Runtime local

### `OFF_API_ENABLED`
- Uso: modo sin API externa/real en flujos locales.
- Importancia: `Media`.
- Riesgo: comportamiento distinto a prod si se deja activo mal.

### `LOCAL_STORAGE_PATH`
- Uso: ruta almacenamiento local (uploads).
- Importancia: `Media`.
- Riesgo: errores de lectura/escritura si ruta invalida.

---

## 13) TLS/Deploy

### `TLS_PROVIDER`
- Uso: proveedor/carpeta estrategia TLS (ej. `selfsigned`, custom).
- Importancia: `Alta`.
- Riesgo: certificado no encontrado/cargado.

### `TLS_SELF_SIGNED_DAYS`
- Uso: vigencia cert autofirmado.
- Importancia: `Baja` (alta en entorno local HTTPS).

### `LETSENCRYPT_EMAIL`
- Uso: correo ACME/Let's Encrypt.
- Importancia: `Alta` si usa LE.

### `LETSENCRYPT_DIRECTORY_URL`
- Uso: endpoint ACME.
- Importancia: `Alta` si usa LE.
- Recomendado prod: `https://acme-v02.api.letsencrypt.org/directory`.

### `CERTS_DIR`
- Uso: ruta certificados.
- Importancia: `Alta`.

### `CERTS_WEBROOT_DIR`
- Uso: ruta webroot para challenge ACME.
- Importancia: `Alta`.

---

## 14) ElectronInstaller / Build

### `DEBUG`
- Uso: nivel debug runtime scripts/installer.
- Importancia: `Baja`.

### `DEBUG_RUN_ID`
- Uso: id trazabilidad ejecucion debug.
- Importancia: `Baja`.

### `INSTALLER_EXIT_ON_FATAL`
- Uso: forzar salida en error fatal.
- Importancia: `Media`.

### `ELECTRON_RENDERER_URL`
- Uso: URL renderer electron (dev/build).
- Importancia: `Media`.

### `FORCE_NATIVE_REBUILD`
- Uso: forzar rebuild modulos nativos.
- Importancia: `Media`.

### `PREBUILD_PARALLEL`
- Uso: paralelismo prebuild.
- Importancia: `Baja`.

### `SMART_HTTP_PORT`
- Uso: puerto HTTP publico/local stack smart.
- Importancia: `Alta`.

### `SMART_HTTPS_PORT`
- Uso: puerto HTTPS publico/local stack smart.
- Importancia: `Alta`.

### `VERIFY_WIN_EXE_PATH`
- Uso: ruta verificacion ejecutable Windows.
- Importancia: `Media`.

### `SIGNTOOL_PATH`
- Uso: ruta `signtool.exe` para firmado.
- Importancia: `Alta` en pipeline firmado.

### `WIN_TIMESTAMP_URL`
- Uso: servidor timestamp firma Windows.
- Importancia: `Media`.

### `WIN_SIGN_DESCRIPTION`
- Uso: descripcion metadata firma.
- Importancia: `Baja`.

### `WIN_CSC_PFX_PATH`
- Uso: ruta certificado PFX firmado.
- Importancia: `Alta` en release Windows firmado.

### `WIN_CSC_PFX_PASSWORD`
- Uso: password PFX.
- Importancia: `Critica`.
- Riesgo: compromiso firma binarios.

### `WIN_CSC_PFX_SHA1`
- Uso: huella SHA1 certificado.
- Importancia: `Media`.

### `WIN_CSC_THUMBPRINT`
- Uso: thumbprint certificado firma.
- Importancia: `Media`.

### `BUILD_WIN_RETRIES`
- Uso: reintentos build Windows.
- Importancia: `Baja`.

### `BUILD_WIN_TIMEOUT_MS`
- Uso: timeout build Windows total.
- Importancia: `Media`.

### `BUILD_WIN_RETRY_DELAY_MS`
- Uso: espera entre reintentos build.
- Importancia: `Baja`.

### `BUILD_STAGE_TIMEOUT_MS`
- Uso: timeout por etapa build.
- Importancia: `Media`.

### `BUILD_MAX_ATTEMPTS`
- Uso: max intentos pipeline build.
- Importancia: `Baja`.

### `NODE_OPTIONS`
- Uso: flags runtime Node (ej. memoria).
- Importancia: `Media`.
- Riesgo: OOM o consumo excesivo si mal ajuste.

### `CI`
- Uso: activa modo CI en herramientas/scripts.
- Importancia: `Media`.
- Riesgo: comportamiento distinto local vs pipeline.

---

## Checklist minimo para `.env.prod`

- `JWT_SECRET` fuerte, unico, no versionado.
- `POSTGRES_PASSWORD` y `REDIS_PASSWORD` fuertes.
- Sin `CHANGE_ME_*`.
- `DB_SYNC=false`.
- `RUN_BOOTSTRAP_SEEDER=false` (salvo ventana controlada).
- `MAIL_*` validados si hay flujos de correo.
- `TLS_PROVIDER` + `CERTS_*` + dominio real consistentes.
- Si firma Windows: `WIN_CSC_*` solo desde secreto seguro.

## Errores comunes

- Usar `DB_HOST=localhost` dentro Docker (debe ser `db`).
- Copiar `.env.dev` a prod sin limpiar secretos temporales.
- Activar seeders en prod por error.
- Puerto SMTP/TLS no compatible con `MAIL_SECURE`.
- Certs en rutas inexistentes.

## Flujo recomendado de trabajo

1. Copiar `.env.example` a `.env.dev` o `.env.prod`.
2. Completar variables criticas primero.
3. Validar arranque backend/frontend.
4. Validar healthchecks DB/Redis.
5. En prod: revisar checklist de seguridad antes deploy.
