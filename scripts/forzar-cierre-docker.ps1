# Forzar cierre de Docker Desktop y servicios Docker en Windows
# Ejecutar como administrador

# Detener servicios Docker
Write-Host "Deteniendo servicios Docker..."
Stop-Service -Name com.docker.service -Force -ErrorAction SilentlyContinue
Stop-Service -Name docker -Force -ErrorAction SilentlyContinue

# Cerrar procesos Docker Desktop y auxiliares
Write-Host "Cerrando procesos Docker Desktop..."
Get-Process -Name "Docker Desktop", "com.docker.backend", "Docker", "vmmem", "vmmemWSL" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Docker Desktop y servicios Docker han sido cerrados forzadamente."
