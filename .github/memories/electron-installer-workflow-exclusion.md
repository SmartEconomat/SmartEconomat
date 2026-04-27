# Electron Installer workflows exclusion

# Descripción
Evita que el workflow de despliegue de producción (`deploy.yml`) se ejecute para cambios que solo afectan a ElectronInstaller o sus screenshots.

# Implementación
- Añade un filtro `paths-ignore` en `.github/workflows/deploy.yml` para ignorar cualquier cambio que solo afecte a:
  - ElectronInstaller/**
  - ElectronInstaller/screenshots/**
  - ElectronInstaller/docs/**
  - ElectronInstaller/artifacts/**
- Así, los commits que solo toquen esos paths NO dispararán el workflow de despliegue.

# Ejemplo de bloque a añadir:

on:
  push:
    branches:
      - production
    paths-ignore:
      - 'ElectronInstaller/**'
      - 'ElectronInstaller/screenshots/**'
      - 'ElectronInstaller/docs/**'
      - 'ElectronInstaller/artifacts/**'

# Notas
- Si el commit toca otros paths además de ElectronInstaller, el workflow sí se ejecutará.
- Esto es estándar en GitHub Actions y no afecta a otros workflows.
