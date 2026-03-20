# Requerimiento pendiente: autenticación y recuperación de contraseña

Fecha: 17 de marzo de 2026

## Resumen

Se revisaron los flujos de frontend de:

- login
- registro de alumno
- registro de profesor
- recuperación y restablecimiento de contraseña

Los endpoints principales necesarios para estos flujos sí existen actualmente en la API:

- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`
- `POST /alumnos/register`
- `GET /alumnos/aulas`
- `GET /alumnos/aulas/:aula/clases`
- `GET /alumnos/aulas/:aula/clases/:clase/profesores`
- `POST /profesores/register`

## Hallazgos backend pendientes

### 1. Envío real de correo no implementado

Estado actual:

- El backend genera el token de recuperación correctamente.
- El método `MailService.sendPasswordResetEmail()` no envía correo real.
- Actualmente solo escribe una simulación en logs con el enlace de recuperación.

Impacto:

- El flujo de “olvidé mi contraseña” no queda operativo para usuarios finales.
- Solo funciona manualmente si alguien copia el enlace desde logs del backend.

Requerimiento:

Implementar envío real de correo electrónico para recuperación de contraseña usando un proveedor SMTP o servicio transaccional.

Criterios de aceptación:

- Al llamar `POST /auth/forgot-password` con un email válido registrado, se envía un correo real.
- El correo contiene asunto, cuerpo y enlace de recuperación funcional.
- Si el email no existe, la respuesta pública sigue siendo genérica por seguridad.
- Los errores de envío quedan registrados de forma controlada.
- La configuración del proveedor sale de variables de entorno.

### 2. URL de recuperación hardcodeada y no configurable

Estado actual:

- El backend construye el enlace con `http://localhost:5173/reset-password?token=...`.
- La URL está fija en código.

Impacto:

- En otros entornos (QA, producción, dominios reales) el enlace enviado puede quedar inválido.
- Obliga a recompilar o editar código para cambiar dominio o protocolo.

Requerimiento:

Mover la URL pública del frontend a configuración por entorno, por ejemplo `FRONTEND_PUBLIC_URL`, y construir el enlace de recuperación usando esa variable.

Criterios de aceptación:

- El backend arma el enlace con una variable de entorno.
- El enlace funciona en desarrollo, QA y producción sin cambios de código.
- El formato del enlace queda documentado.

## Observación de compatibilidad

Para mantener compatibilidad inmediata, el frontend ya quedó preparado para aceptar ambos formatos:

- `/reset-password/:token`
- `/reset-password?token=...`

Aun así, se recomienda unificar y documentar un único formato oficial desde backend.

## Prioridad sugerida

Alta.

Este punto bloquea la recuperación de contraseña por correo como funcionalidad completa para usuarios finales.
