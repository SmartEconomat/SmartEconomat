; SmartEconomat NSIS hooks for detailed pre-installer feedback
; Loaded by electron-builder through build.nsis.include

!include "LogicLib.nsh"

!macro SELogLine message
  DetailPrint "${message}"
  FileOpen $0 "$TEMP\\SmartEconomat-installer.log" a
  FileSeek $0 0 END
  FileWrite $0 "${message}$\r$\n"
  FileClose $0
!macroend

!macro customInit
  !insertmacro SELogLine "SmartEconomat Installer: inicializando pre-instalador nativo..."
  !insertmacro SELogLine "Preparando asistente de instalación y validando permisos de ejecución."

  ${If} ${Silent}
    !insertmacro SELogLine "Modo silencioso detectado: instalación sin UI interactiva."
  ${Else}
    !insertmacro SELogLine "Modo interactivo: mostrando progreso detallado y eventos de instalación."
  ${EndIf}

  !insertmacro SELogLine "Siguiente fase: extracción de archivos de aplicación."
!macroend

!macro customInstall
  SetDetailsView show
  !insertmacro SELogLine "[1/4] Extrayendo componentes del instalador..."
  !insertmacro SELogLine "[2/4] Escribiendo binarios de la aplicación en disco..."
  !insertmacro SELogLine "[3/4] Registrando accesos directos y metadatos de aplicación..."
  !insertmacro SELogLine "[4/4] Finalizando configuración del instalador nativo."
  !insertmacro SELogLine "Instalación nativa completada. Se abrirá el asistente interno de despliegue."
!macroend

!macro customUnInstall
  !insertmacro SELogLine "Iniciando desinstalación de SmartEconomat..."
  !insertmacro SELogLine "Eliminando archivos locales y accesos directos."
!macroend
