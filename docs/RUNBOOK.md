# Runbook de Instalación y Operación

## Linux

1. Verificar dependencias:

```bash
docker version
docker compose version
openssl version
```

2. Ejecutar bootstrap:

```bash
bash ElectronInstaller/scripts/install/linux/bootstrap.sh --runtime-path /tmp/smarteconomat-runtime --mode all
```

Si los puertos 80/443 están ocupados:

```bash
bash ElectronInstaller/scripts/install/linux/bootstrap.sh --runtime-path /tmp/smarteconomat-runtime --mode all --release-busy-ports
```

3. Ejecutar installer (`npm run dev`) y completar wizard.
4. Verificar estado:

```bash
bash ElectronInstaller/scripts/ops/health-check.sh --runtime-path /tmp/smarteconomat-runtime --project-root /ruta/SmartEconomat
```

## macOS

1. Verificar Docker Desktop activo y OpenSSL instalado.
2. Ejecutar bootstrap:

```bash
bash ElectronInstaller/scripts/install/macos/bootstrap.sh --runtime-path /tmp/smarteconomat-runtime --mode all
```

Si los puertos 80/443 están ocupados:

```bash
bash ElectronInstaller/scripts/install/macos/bootstrap.sh --runtime-path /tmp/smarteconomat-runtime --mode all --release-busy-ports
```

3. Completar wizard.
4. Si Safari muestra warning TLS, importar CA/certificados localmente.

## Windows

1. Abrir PowerShell como administrador.
2. Verificar dependencias:

```powershell
docker version
docker compose version
```

3. Ejecutar bootstrap:

```powershell
powershell -ExecutionPolicy Bypass -File ElectronInstaller/scripts/install/windows/bootstrap.ps1 -RuntimePath C:\SmartEconomatRuntime -Mode all
```

Si los puertos 80/443 están ocupados:

```powershell
powershell -ExecutionPolicy Bypass -File ElectronInstaller/scripts/install/windows/bootstrap.ps1 -RuntimePath C:\SmartEconomatRuntime -Mode all -ReleaseBusyPorts
```

4. Completar wizard.

## Operación diaria

### Backup

```bash
bash ElectronInstaller/scripts/ops/backup.sh --runtime-path /tmp/smarteconomat-runtime --project-root /ruta/SmartEconomat --label diario
```

### Restore

```bash
bash ElectronInstaller/scripts/ops/restore.sh --runtime-path /tmp/smarteconomat-runtime --project-root /ruta/SmartEconomat --artifact /tmp/smarteconomat-runtime/backups/backup-diario-YYYYMMDD-HHMMSS.tar.gz
```

### Diagnóstico

Usar botón "Generar diagnóstico" desde panel o consultar `runtimePath/diagnostics/`.
