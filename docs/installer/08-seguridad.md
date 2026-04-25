# 8. Seguridad

La aplicación maneja privilegios elevados y gestión de infraestructura, por lo que la seguridad es un pilar fundamental en su diseño.

## Configuración de Electron (Best Practices)

| Medida | Estado | Valoración |
|--------|--------|------------|
| **contextIsolation** | ✅ Activado | Aísla los contextos de JavaScript del preload y del renderer. |
| **nodeIntegration** | ❌ Desactivado | El renderer no tiene acceso directo a las APIs de Node.js. |
| **sandbox** | ⚠️ Desactivado | Desactivado intencionadamente para permitir que el Main Process acceda a recursos de sistema necesarios para Docker. |
| **webSecurity** | ✅ Activado | Bloquea la carga de recursos desde dominios no confiables. |
| **allowRunningInsecureContent**| ❌ Desactivado | No permite la ejecución de scripts sobre conexiones no seguras. |

## Auditoría de Superficie de Ataque

### 1. Validación IPC
Toda la comunicación entre el frontend y el backend interno está protegida:
- **Esquemas Zod**: No se confía en los datos recibidos del renderer. Cada payload IPC es validado contra un esquema estricto de Zod antes de ser procesado por los servicios de Node.
- **Canales Restringidos**: Solo se exponen funciones específicas en el `ContextBridge`.

### 2. Elevación de Privilegios
- El uso de **PowerShell** para elevación está bien implementado pero es un punto crítico. La aplicación solo ejecuta comandos predefinidos y no acepta inputs externos para ser inyectados en la shell, mitigando riesgos de inyección de comandos.

### 3. Manejo de Secretos
- Los secretos (JWT, passwords de BD) se generan de forma aleatoria durante la instalación si el usuario no los proporciona.
- Se almacenan en un archivo `.env.prod` en el sistema de archivos local, protegido por los permisos estándar del sistema operativo.

### 4. Riesgos Identificados
- **RCE (Remote Code Execution)**: Muy bajo riesgo debido al aislamiento de contexto. Un atacante que lograra inyectar JS en el frontend no tendría forma de ejecutar comandos de sistema sin pasar por las validaciones de los servicios del Main process.
- **XSS (Cross-Site Scripting)**: Bajo riesgo. La aplicación utiliza React, que escapa el contenido por defecto. Se recomienda mantener una política de CSP (Content Security Policy) estricta.

## Valoración de Seguridad
La aplicación es **segura por diseño**. Sigue el principio de mínimo privilegio en el frontend y utiliza validación de entrada rigurosa en el backend interno. 

> [!CAUTION]
> Debido a que la app requiere ejecutarse como Administrador en Windows para gestionar Docker, cualquier vulnerabilidad en el Main Process tiene un impacto total sobre el sistema host. Se debe prestar especial atención a no actualizar dependencias de Node.js sin verificar su procedencia.
