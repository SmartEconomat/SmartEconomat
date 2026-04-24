; SmartEconomat NSIS hooks - minimalista
; Loaded by electron-builder through build.nsis.include
; NSIS solo extrae archivos y crea accesos directos.
; La configuración, WSL, Docker y los fixes se hacen en el wizard Electron.

!include "LogicLib.nsh"

!macro customInit
  SetDetailsPrint both
  DetailPrint "Sincronizando estado de la aplicación..."
  
  ; Intentar cerrar SmartEconomat usando PowerShell para mayor fiabilidad
  DetailPrint "Cerrando instancias activas de SmartEconomat..."
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process SmartEconomat -ErrorAction SilentlyContinue | Stop-Process -Force"'
  Pop $0
  
  ; Cerrar el watchdog si estuviera activo
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Id (Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like \"*guardian-watchdog*\" }).ProcessId -ErrorAction SilentlyContinue | Stop-Process -Force"'
  Pop $0
  
  Sleep 2000
  
  ; Segunda pasada de seguridad
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process SmartEconomat -ErrorAction SilentlyContinue | Stop-Process -Force"'
  Pop $0
  
  DetailPrint "Procesos liberados. Continuando con la extracción..."
!macroend

!macro customInstall
  SetDetailsPrint both
  ; El acceso directo de la app lo gestiona electron-builder (createDesktopShortcut/createStartMenuShortcut).
  ; Solo creamos el acceso directo del desinstalador, que no genera electron-builder por su cuenta.
  ; El icono del desinstalador se genera desde favicon-uninstall.svg (convertido a resources/icons/nsis/uninstaller.ico)
  
  ; Forzar actualización de la entrada de registro DisplayIcon para ARP (Add/Remove Programs)
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "DisplayIcon" "$INSTDIR\Uninstall SmartEconomat.exe"
  
  ; Notificar al Shell de Windows para refrescar la caché de iconos
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'

  ; CreateShortCut sobreescribe sin borrar primero, evitando ventanas de estado inconsistente.
  CreateShortCut "$DESKTOP\SmartEconomat Uninstaller.lnk" "$INSTDIR\Uninstall SmartEconomat.exe" "" "$INSTDIR\Uninstall SmartEconomat.exe" 0
  DetailPrint "Acceso directo del desinstalador creado en el escritorio y caché de iconos notificada."
  DetailPrint "Archivos listos. Se abrirá el asistente de configuración."
!macroend

!macro customUnInstall
  DetailPrint "Iniciando desinstalación de SmartEconomat..."
  DetailPrint "Cerrando procesos SmartEconomat para proceder..."
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process SmartEconomat -ErrorAction SilentlyContinue | Stop-Process -Force"'
  Pop $0
  Sleep 1500

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

  IfFileExists "$INSTDIR\resources\scripts\ops\uninstall-clean.ps1" 0 +3
    nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\scripts\ops\uninstall-clean.ps1" -RuntimePath "$1" -InstallDir "$INSTDIR" -PreserveRuntime'
    Pop $0

  ; Eliminar tarea programada de autoarranque de Docker Desktop
  nsExec::ExecToLog 'schtasks /Delete /TN "DockerDesktopAutoStart" /F'
  Pop $0

  ; Eliminar clave de registro de autoarranque
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "DockerDesktopAutoStart"

  ; Detener y eliminar script guardian-watchdog si está ejecutándose
  nsExec::ExecToLog 'taskkill /IM powershell.exe /FI "WINDOWTITLE eq guardian-watchdog*" /F'
  Pop $0

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
