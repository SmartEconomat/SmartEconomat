# Análisis Exhaustivo y Prompt Definitivo para el Instalador Plug & Play (SmartEconomat)

## 📌 Contexto
Se han analizado las entrañas de `ElectronInstaller` y la relación con el repositorio principal (`SmartEconomat`). Aunque hay un progreso excelente en la infraestructura IPC, servicios backend en Node (Electron Main) y una estructura UI en React (Renderer), existen fallos arquitectónicos críticos que impiden que este instalador sea la solución robusta, "one-click" y libre de errores en Windows que se espera.

## 🚨 Problemas Críticos Detectados que la IA debe Corregir

1. **Construcción en el Host Final (El Peor Antipatrón para un Instalador Desktop)**
   - **Error actual:** El instalador copia el código fuente usando `extraResources` (excluyendo explícitamente `dist/` y `node_modules/`) y luego `docker-orchestrator.service.ts` ejecuta `docker compose up -d --build`.
   - **Por qué está mal:** Hacer que el PC del cliente (Windows) recompile NestJS y Vite dentro de contenedores Docker tarda muchísimo (multi-stage build), depende de la red externa (NPM), consume gigabytes inútiles, falla por memoria y viola el principio dictado en tu arquitectura: *"Acoplamiento de runtime con build local -> Tiempos largos y fallos no deterministas"*.
   - **Solución exigida:** El empaquetador del instalador DEBE pre-compilar los dist de frontend y backend, enviarlos en el instalador, y el `Dockerfile.prod` del cliente sólo debe empaquetar el `dist` y ejecutar `npm ci --omit=dev`. Alternativamente, si se suben las imágenes a un registry (como GitHub Container Registry), el docker-compose no debe hacer `build`, sino hacer `pull`. El instalador NO DEBE compilar código en la máquina del cliente.

2. **Gestión de Puertos en Windows (IIS y System Services)**
   - **Error actual:** `bootstrap.ps1` y `preflight.service.ts` intentan hacer un `Stop-Process` si los puertos 80/443 están ocupados. Si estos puertos los usa `System` (típico con IIS en Windows) o Skype, un simple `kill` fallará o romperá el sistema del cliente.
   - **Solución exigida:** La UI de configuración (Wizard) DEBE permitir elegir el puerto web expuesto. El `docker-compose.prod.yml` debe leer algo como `FRONTEND_PORT_HTTP` y `FRONTEND_PORT_HTTPS` desde el `.env.prod`. ¡Nunca asumas que matarás el puerto 80 exitosamente!

3. **Manejo de Tiempos y Fallos (Timeout de Docker)**
   - **Error actual:** Si Docker Desktop en Windows no arranca a la primera vez, los timeouts estáticos en `docker-orchestrator.service.ts` pueden desesperar al usuario. Además, el `docker-compose` de NestJS usa `wait` (o fallos en `npm ci`) que abortarán el script sin un Log Stream vivo visible en la UI del instalador durante esas fases largas.
   - **Solución exigida:** Validaciones más robustas y stream de logs forzado hacia la UI durante el `up -d --build` (si se mantiene alguna forma de build remoto) o el volcado de imágenes.

4. **Estado Transaccional (Rollback no funcional/inexistente)**
   - **Error actual:** La `InstallState.Machine.ts` y la arquitectura prometían un rollback seguro si la instalación fallaba a mitad del proceso.
   - **Solución exigida:** Si el stack no levanta y el `getHealth` no pasa a "OK", el instalador debe guardar el error, volcar los logs diagnosticables, destruír el progreso fallido (para evitar contenedores huérfanos) y dejar clara la razón al usuario.

5. **Exclusión de Archivos Críticos en NSIS / Builder**
   - **Error actual:** El `package.json` de Electron hace filtros complejos. Si el backend usa `scripts/prod-bootstrap-runner.js`, asegúrate de que el CLI de ElectronBuilder verdaderamente los copia en `project/backend/...` y que coincida al milímetro con lo que el context de Docker Compose espera. Hay desajustes entre `context: ./backend/smart-economat-backend` en el compose.yml y hacia dónde se copian los `extraResources`.

---

# 🤖 PROMPT PARA LA IA EJECUTORA

Copia y pega este prompt a tu agente o IA de desarrollo para que solucione absolutamente todo y finalice el instalador:

----
**[INICIO DEL PROMPT PARA IA]**

Actúa como **Agente Autónomo Arquitecto y Senior Full-Stack/DevOps** especializado en Electron, Windows, Docker y NestJS/React. Se te requiere *FINALIZAR POR COMPLETO* la app `ElectronInstaller` del proyecto `SmartEconomat` para entregar una solución de instalación *Plug-and-Play* perfecta y a prueba de fallos, priorizando 100% que funcionará en *Windows*.

He aquí tus directrices y tareas de corrección ABSOLUTAMENTE OBLIGATORIAS. No declares la tarea terminada hasta que todos estos flujos sean perfectos:

### REQUISITOS CRÍTICOS A SOLUCIONAR

1. **PROHIBIDO COMPILAR CÓDIGO FUENTE EN EL CLIENTE FINAL (El problema del Build Local)**
   - **Contexto:** Actualmente `ElectronInstaller/package.json` empaqueta el código fuente y `docker-orchestrator.service.ts` usa `docker compose up -d --build`. Esto hace que NodeJS, NPM ci y Typescript se ejecuten dentro del contenedor en el PC cliente, provocando timeouts y fallos silenciosos en Windows.
   - **Acción:** Modifica el empaquetado y el pipeline de Docker Compose. Existen dos vías (elige e implementa íntegramente la más resiliente para self-hosted):
     * *Vía A (Recomendada si no hay registry):* Modifica el pre-build del instalador para que compile primero el `frontend/dist` y `backend/dist` en la máquina del desarrollador. El instalador empaquetará LOS BINARIOS YA COMPILADOS (`dist`, `package.json`, `package-lock.json`). Los `Dockerfile.prod` del cliente serán ultra livianos: solo copiarán `dist/`, borrarán el build stage, ejecutarán `npm ci --omit=dev` y levantarán la app en 10 segundos.
     * *Vía B (Alternative):* Usar un Registry remoto para hacer `docker image pull`.
   - Modifica `docker-compose.prod.yml` y las rutas en `ElectronInstaller/package.json` (`extraResources`) para garantizar congruencia absoluta de directorios.

2. **FLEXIBILIDAD DE PUERTOS EN WINDOWS (Anti-IIS)**
   - **Contexto:** `bootstrap.ps1` intenta matar procesos en 80/443. Si es el sistema (PID 4) o IIS, fallará en secado o el cliente se quedará sin internet.
   - **Acción:**
     - En el frontend del instalador (`Preflight/Config`), añade obligatoriamente inputs para definir `Frontend HTTP Port` (por defecto 80) y `Frontend HTTPS Port` (por defecto 443).
     - Actualiza el `env.template.prod` para mapear `EXPOSED_API_PORT`, `FRONTEND_HTTP_PORT`, `FRONTEND_HTTPS_PORT`.
     - Actualiza el `docker-compose.prod.yml` (`ports: - "${FRONTEND_HTTP_PORT:-80}:80"`) basándose en ese `.env.prod`.

3. **FINALIZAR LA UI Y EL MACHINE STATE DEL WIZARD**
   - **Contexto:** El scaffolding de las páginas existe (`ConfigPage.tsx`, `DeployPage.tsx`, etc.), pero asegúrate de que el binding global del estado (con el journal en backend) funcione de forma impecable.
   - **Acción:** El despliegue DEBE ser transaccional. Si el `Docker Orchestrator` levanta un contenedor y se cierra silenciosamente (crash), el orquestador DEBE hacer un tail de ese log, interceptar el `exit code 1` (o detectar `unhealthy`) y renderizar un error amigable en la UI, con posibilidad de Retry o Rollback total (destrucción de volúmenes fallidos).

4. **DEFENDER / SMART APP CONTROL Y PRIVILEGIOS DE INSTALADOR EN WINDOWS**
   - **Acción:** Asegúrate de que `electron-builder` en `package.json` genera un EXE NSIS con requerimiento nativo de Admin (`"allowElevation": true` ya está, pero asegúrate del `requestedExecutionLevel: requireAdministrator`). Revisar que los hooks NSIS para añadir las exclusiones del Defender y los scripts pre-flight (`bootstrap.ps1`) se ejecutan verdaderamente sin que el execution policy de Powershell impida su carga desde el ejecutable (firmar los ps1 o asegurar `ExecutionPolicy Bypass`).

5. **MIGRACIONES Y GENERACIÓN DE CREDENCIALES INFALIBLES**
   - La base de datos y Redis deben arrancar usando las password autogeneradas en el proceso de instalación en el `.env.prod`. 
   - Debes garantizar que el contenedor de DB tenga tiempo de arrancar ANTES de que el backend lance migraciones o crasheará el backend. En el `docker-compose.prod.yml`, asegúrate de usar correctamente `depends_on: db: condition: service_healthy` y que el healthcheck de `db` no arroje falsos negativos.

### TU SALIDA:
Debes ejecutar la implementación de fin a fin con comandos precisos, modificar todos los ficheros implicados en el repositorio base, priorizando Typescript estricto, sin `any`, y dejar un estado que haga `build success` comprobable en todos sus puntos. Documenta exactamente cada cambio clave que hiciste. No dejes nada a medias, debes entregar el código LISTO PARA EXPORTAR EL EXE Y USAR.
**[FIN DEL PROMPT PARA IA]**
---- 
