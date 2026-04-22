; SmartEconomat NSIS hooks - minimalista
; Loaded by electron-builder through build.nsis.include
; NSIS solo extrae archivos y crea accesos directos.
; La configuración, WSL, Docker y los fixes se hacen en el wizard Electron.

!include "LogicLib.nsh"

!macro customInit
  SetDetailsPrint both
  IfFileExists "$INSTDIR\Uninstall SmartEconomat.exe" 0 done_init

  DetailPrint "Instalación previa detectada. Se realizará reinstalación en sitio sin ejecutar el desinstalador previo para evitar bloqueos."
  DetailPrint "Cerrando procesos SmartEconomat en ejecución para liberar archivos bloqueados..."
  nsExec::ExecToLog 'taskkill /IM SmartEconomat.exe /T'
  nsExec::ExecToLog 'taskkill /IM SmartEconomat.exe /F /T'
  DetailPrint "Continuando con reinstalación en sitio sin limpieza destructiva previa..."

  done_init:
  DetailPrint "Extrayendo archivos de SmartEconomat..."
!macroend

!macro customInstall
  SetDetailsPrint both
  ; El acceso directo de la app lo gestiona electron-builder (createDesktopShortcut/createStartMenuShortcut).
  ; Solo creamos el acceso directo del desinstalador, que no genera electron-builder por su cuenta.
  ; CreateShortCut sobreescribe sin borrar primero, evitando ventanas de estado inconsistente.
  CreateShortCut "$DESKTOP\SmartEconomat Uninstaller.lnk" "$INSTDIR\Uninstall SmartEconomat.exe" "" "$INSTDIR\Uninstall SmartEconomat.exe" 0
  DetailPrint "Acceso directo del desinstalador creado en el escritorio."
  DetailPrint "Archivos listos. Se abrirá el asistente de configuración."
!macroend

!macro customUnInstall
  DetailPrint "Iniciando desinstalación de SmartEconomat..."

  StrCpy $1 "C:\SmartEconomatRuntime"
  IfFileExists "$APPDATA\SmartEconomatInstaller\runtime-path.txt" 0 +4
    FileOpen $0 "$APPDATA\SmartEconomatInstaller\runtime-path.txt" r
    FileRead $0 $1
    FileClose $0

  StrCpy $2 $1 1 -1
  ${If} $2 == "$\n"
    StrCpy $1 $1 -1
  ${EndIf}
  StrCpy $2 $1 1 -1
  ${If} $2 == "$\r"
    StrCpy $1 $1 -1
  ${EndIf}

  ${If} $1 == ""
    StrCpy $1 "C:\SmartEconomatRuntime"
  ${EndIf}

  IfFileExists "$INSTDIR\resources\scripts\ops\uninstall-clean.ps1" 0 +2
    nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\scripts\ops\uninstall-clean.ps1" -RuntimePath "$1" -InstallDir "$INSTDIR" -PreserveRuntime'

  ; Eliminar tarea programada de autoarranque de Docker Desktop
  nsExec::ExecToLog 'schtasks /Delete /TN "DockerDesktopAutoStart" /F'

  ; Eliminar clave de registro de autoarranque
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "DockerDesktopAutoStart"

  ; Detener y eliminar script guardian-watchdog si está ejecutándose
  nsExec::ExecToLog 'taskkill /IM powershell.exe /FI "WINDOWTITLE eq guardian-watchdog*" /F'

  RMDir /r "$APPDATA\SmartEconomatInstaller"
  RMDir /r "$LOCALAPPDATA\SmartEconomatInstaller"
  Delete "$DESKTOP\SmartEconomat.lnk"
  Delete "$DESKTOP\SmartEconomat Uninstaller.lnk"
  Delete "$COMMONDESKTOP\SmartEconomat.lnk"
  Delete "$COMMONDESKTOP\SmartEconomat Uninstaller.lnk"
  Delete "$SMPROGRAMS\SmartEconomat\SmartEconomat.lnk"
  Delete "$SMPROGRAMS\SmartEconomat\Uninstall SmartEconomat.lnk"
  Delete "$COMMONPROGRAMS\SmartEconomat\SmartEconomat.lnk"
  Delete "$COMMONPROGRAMS\SmartEconomat\Uninstall SmartEconomat.lnk"
  RMDir "$SMPROGRAMS\SmartEconomat"
  RMDir "$COMMONPROGRAMS\SmartEconomat"

  DetailPrint "Desinstalación completada."
!macroend
