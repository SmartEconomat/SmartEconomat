# Nota histórica sobre recuperación de contraseña

Este archivo se conserva solo como contexto histórico de backlog. No es la referencia oficial vigente.

## Estado actual resumido

- El flujo oficial de auth está documentado en [../security/login-registro.md](../security/login-registro.md).
- La configuración de correo y entorno está documentada en [../reference/variables-entorno.md](../reference/variables-entorno.md).
- El backend soporta recuperación de contraseña mediante `POST /auth/forgot-password` y `POST /auth/reset-password`.
- El envío real de correo depende de que existan variables SMTP (`MAIL_HOST`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`). Sin esa configuración, el sistema opera en modo simulación y registra el intento en logs.

## Uso recomendado

Si hay que retomar mejoras pendientes sobre correo o enlaces públicos de recuperación, abrir una nueva tarea de producto o mover la información a la planificación activa. No mantener este archivo como documentación funcional.
