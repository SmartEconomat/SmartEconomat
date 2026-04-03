# Despliegue sobre host Windows

Esta guía recoge las consideraciones reales para ejecutar SmartEconomat desde un host Windows. El stack usa contenedores Linux, así que la ruta recomendada es operar mediante WSL2 y Docker Desktop, no con contenedores Windows nativos.

## Recomendación general

Si puedes elegir, usa un host Linux y sigue [DEPLOYMENT.md](DEPLOYMENT.md). Mantener el proyecto en Windows añade complejidad en permisos, rendimiento de volúmenes y automatización de certificados.

## Requisitos del host

- Windows 11 o Windows Server con virtualización habilitada.
- WSL2 operativo.
- Docker Desktop configurado para usar el backend de WSL2.
- Puertos `80` y `443` abiertos en el firewall o NSG.

## Flujo recomendado

### 1. Preparar WSL2 y Docker Desktop

```powershell
wsl --install
```

Después instala Docker Desktop y habilita la integración con la distribución WSL que vayas a usar.

### 2. Trabajar desde el sistema de archivos Linux

Clona el repositorio dentro de la distribución WSL, por ejemplo en `~/SmartEconomat`, para evitar penalizaciones y problemas de permisos sobre NTFS.

### 3. Ejecutar el despliegue desde shell Linux

Dentro de WSL:

```bash
cd ~/SmartEconomat
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

El script [scripts/deploy.sh](../scripts/deploy.sh) es bash/Linux-centric. Si quieres usarlo, ejecútalo también desde WSL, no desde PowerShell puro.

## Consideraciones operativas

- Los certificados y volúmenes deben permanecer en el árbol del proyecto dentro de WSL.
- Nginx, Certbot y el backend siguen funcionando como contenedores Linux estándar.
- Swagger no queda publicado en producción por defecto con el `nginx.conf` actual, igual que en Linux.

## Mantenimiento básico

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f
docker compose -f docker-compose.prod.yml --env-file .env.prod restart
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

## Cuándo usar un escenario Windows

- Laboratorios o entornos corporativos donde el host Linux no sea viable.
- Pruebas de compatibilidad con infraestructura interna basada en Windows.

Para producción estable, el camino recomendado sigue siendo Linux con Docker Engine nativo.
