#!/bin/bash

# Este script instala Docker y Docker Compose en Ubuntu
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker Engine..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release

    # Agregar la clave GPG oficial de Docker
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Configurar el repositorio
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Instalar Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Agregar al usuario actual al grupo docker
    sudo usermod -aG docker $USER

    # Instalar docker-compose (v2) si no está como comando independiente
    sudo ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
    
    echo "Docker instalado correctamente. Por favor, cierra sesión y vuelve a entrar para aplicar los permisos de grupo."
else
    echo "Docker ya está instalado. Saltando instalación."
fi

# Asegurar que el socket de docker tenga los permisos correctos
sudo chmod 666 /var/run/docker.sock
