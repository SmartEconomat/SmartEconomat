# FAQ

## ¿El proyecto requiere Node instalado en el host?

Para usar Docker, no es obligatorio para ejecutar la app.  
Para desarrollo local directo (sin Docker) y para trabajar en cada paquete, si se requiere Node `>=22.2.0`.

## ¿Cual es la URL base de la API?

`/api/v1` (backend NestJS).

## ¿Swagger donde esta?

`http://localhost:3000/api/v1/docs` en entorno local.

## ¿Hay package manager unificado en la raiz?

No. Actualmente no existe `package.json` en la raiz.

## ¿Hay CI/CD activo?

Si. Workflows en `.github/workflows/deploy.yml` y `.github/workflows/electron-installer-screenshots.yml`.

## ¿Donde se configuran variables de entorno?

En la raiz del repo (`.env.dev`, `.env.prod`, `.env.example`) y se consumen por compose y aplicaciones.

## ¿El instalador Electron despliega backend/frontend?

Si. Empaqueta artefactos y recursos de proyecto para despliegue asistido.

## ¿Que documento uso como punto de entrada?

`docs/README.md`.
