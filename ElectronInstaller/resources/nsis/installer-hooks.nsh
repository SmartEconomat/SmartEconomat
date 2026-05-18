; SmartEconomat NSIS hooks
; Loaded by electron-builder through build.nsis.include
;
; La app Electron minimiza a bandeja en lugar de cerrarse (preventDefault).
; electron-builder intenta un cierre suave que no termina el proceso; este script
; fuerza un apagado cooperativo (archivo señal) y, si hace falta, taskkill /F /T.

!include "LogicLib.nsh"

!ifndef SMARTECONOMAT_SHUTDOWN_SIGNAL
  !define SMARTECONOMAT_SHUTDOWN_SIGNAL "$TEMP\smarteconomat-installer-shutdown.signal"
!endif

!ifndef SMARTECONOMAT_PROCESS_WAIT_MS
  !define SMARTECONOMAT_PROCESS_WAIT_MS "40000"
!endif

!macro _smarteconomatWriteShutdownSignal
  Delete "${SMARTECONOMAT_SHUTDOWN_SIGNAL}"
  FileOpen $9 "${SMARTECONOMAT_SHUTDOWN_SIGNAL}" w
  FileWrite $9 "shutdown"
  FileClose $9
!macroend

!macro _smarteconomatRemoveShutdownSignal
  Delete "${SMARTECONOMAT_SHUTDOWN_SIGNAL}"
!macroend

; Rellena $R8 con InstallLocation del registro si existe.
!macro _smarteconomatReadRegistryInstallDir
  StrCpy $R8 ""
  ReadRegStr $R8 SHCTX "${INSTALL_REGISTRY_KEY}" InstallLocation
  ${If} $R8 == ""
    ReadRegStr $R8 HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation
  ${EndIf}
  ${If} $R8 == ""
    ReadRegStr $R8 HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
  ${EndIf}
!macroend

; Espera hasta que no queden procesos SmartEconomat (máx. SMARTECONOMAT_PROCESS_WAIT_MS).
!macro _smarteconomatWaitProcessesGone
  DetailPrint "Comprobando que no queden procesos de SmartEconomat..."
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddMilliseconds(${SMARTECONOMAT_PROCESS_WAIT_MS}); $names = @(''SmartEconomat'',''SmartEconomat.WindowsSupervisor''); do { $running = Get-Process -Name $names -ErrorAction SilentlyContinue; if (-not $running) { exit 0 }; Start-Sleep -Milliseconds 400 } while ((Get-Date) -lt $deadline); if (Get-Process -Name $names -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }"'
  Pop $0
  ${If} $0 != 0
    DetailPrint "Aún hay procesos SmartEconomat activos; se aplicará cierre forzado."
  ${EndIf}
!macroend

; Desactiva autoarranque temporal para evitar que la app se relance durante el instalador.
!macro _smarteconomatDisableAutoLaunch
  DetailPrint "Desactivando autoarranque temporal de SmartEconomat..."
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "SmartEconomat"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.smarteconomat.installer"
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "SmartEconomat"
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "com.smarteconomat.installer"
!macroend

; Cierre agresivo por nombre/ruta (excluye el PID del instalador NSIS actual).
!macro _smarteconomatForceKillAll
  DetailPrint "Forzando cierre de todos los procesos SmartEconomat..."
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "$$installerPid = $pid; $$names = @(''SmartEconomat'',''SmartEconomat.WindowsSupervisor''); Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { ($$_.ProcessId -ne $$installerPid) -and ( ($$_.Name -in $$names) -or ($$_.ExecutablePath -and ($$_.ExecutablePath -match ''SmartEconomat'')) ) } | ForEach-Object { Stop-Process -Id $$_.ProcessId -Force -ErrorAction SilentlyContinue }"'
  Pop $0
  nsExec::ExecToLog 'taskkill /IM SmartEconomat.exe /T /F'
  Pop $0
  nsExec::ExecToLog 'taskkill /IM SmartEconomat.WindowsSupervisor.exe /T /F'
  Pop $0
  nsExec::ExecToLog 'taskkill /FI "WINDOWTITLE eq SmartEconomat*" /T /F'
  Pop $0
!macroend

; Mata procesos cuya ruta ejecutable está bajo $R8 (ruta de instalación).
!macro _smarteconomatKillProcessesUnderRoot
  ${If} $R8 != ""
    DetailPrint "Liberando procesos bajo $R8..."
    nsExec::ExecToLog `powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $$root = '$R8'.TrimEnd('\','/'); if ($$root -and (Test-Path -LiteralPath $$root)) { Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $$_.ExecutablePath -and $$_.ExecutablePath.StartsWith($$root, [System.StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { Stop-Process -Id $$_.ProcessId -Force -ErrorAction SilentlyContinue } } }"`
    Pop $0
  ${EndIf}
!macroend

; Detiene servicio Windows, pide cierre cooperativo y fuerza taskkill.
; _USE_INSTDIR: 1 = también mata procesos bajo $INSTDIR o InstallLocation del registro
!macro _smarteconomatReleaseProcesses _USE_INSTDIR
  SetDetailsPrint both
  DetailPrint "Cerrando SmartEconomat para continuar con la instalación..."

  !insertmacro _smarteconomatDisableAutoLaunch
  !insertmacro _smarteconomatWriteShutdownSignal

  StrCpy $R8 ""
  !if "${_USE_INSTDIR}" == "1"
    ${If} $INSTDIR != ""
      StrCpy $R8 $INSTDIR
    ${Else}
      !insertmacro _smarteconomatReadRegistryInstallDir
    ${EndIf}
  !else
    !insertmacro _smarteconomatReadRegistryInstallDir
    ${If} $R8 == ""
      ${If} $INSTDIR != ""
        StrCpy $R8 $INSTDIR
      ${EndIf}
    ${EndIf}
  !endif

  DetailPrint "Deteniendo servicio SmartEconomatSupervisor (si existe)..."
  nsExec::ExecToLog 'sc.exe stop SmartEconomatSupervisor'
  Pop $0
  Sleep 1200
  nsExec::ExecToLog 'taskkill /IM SmartEconomat.WindowsSupervisor.exe /T /F'
  Pop $0
  Sleep 600

  DetailPrint "Solicitando cierre cooperativo de SmartEconomat..."
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name SmartEconomat -ErrorAction SilentlyContinue | ForEach-Object { try { $_.CloseMainWindow() | Out-Null } catch {} }"'
  Pop $0
  Sleep 2000

  !insertmacro _smarteconomatWaitProcessesGone

  !insertmacro _smarteconomatForceKillAll
  nsExec::ExecToLog 'taskkill /IM "Uninstall SmartEconomat.exe" /T /F'
  Pop $0

  !insertmacro _smarteconomatKillProcessesUnderRoot

  Sleep 800
  !insertmacro _smarteconomatForceKillAll

  !insertmacro _smarteconomatWaitProcessesGone

  ; Último intento si aún queda algún proceso (p. ej. bandeja sin ventana principal).
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-Process -Name SmartEconomat,SmartEconomat.WindowsSupervisor -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }"'
  Pop $0
  ${If} $0 != 0
    !insertmacro _smarteconomatForceKillAll
    Sleep 1500
  ${EndIf}

  !insertmacro _smarteconomatRemoveShutdownSignal
  DetailPrint "Procesos de SmartEconomat liberados."
!macroend

!macro customInit
  ; En .onInit $INSTDIR puede no ser definitivo: leer registro y cerrar por nombre.
  !insertmacro _smarteconomatReleaseProcesses "0"
!macroend

!ifdef allowToChangeInstallationDirectory
!macro customPageAfterChangeDir
  ; electron-builder ya definió instFilesPre; encadenamos cierre de procesos en el PRE de Instalando.
  !undef MUI_PAGE_CUSTOMFUNCTION_PRE
  !define MUI_PAGE_CUSTOMFUNCTION_PRE smarteconomatInstFilesPre

  Function smarteconomatInstFilesPre
    Call instFilesPre
    !insertmacro _smarteconomatReleaseProcesses "1"
  FunctionEnd
!macroend
!endif

!macro customCheckAppRunning
  ; Sustituye el chequeo por defecto de electron-builder (cierre suave + bucle reintentar).
  !insertmacro _smarteconomatReleaseProcesses "1"
!macroend

; Si el desinstalador antiguo falla, no bloquear la instalación tras liberar procesos.
!macro customUnInstallCheck
  DetailPrint "Desinstalación previa incompleta; liberando procesos y continuando..."
  !insertmacro _smarteconomatReleaseProcesses "1"
!macroend

!macro customUnInstallCheckCurrentUser
  !insertmacro customUnInstallCheck
!macroend

!ifdef ZIP_COMPRESSION
!macro decompress
  StrCpy $R9 0
  smarteconomat_unzip_retry:
    IntOp $R9 $R9 + 1
    DetailPrint "Extrayendo SmartEconomat (intento $R9)..."
    ${If} $R9 > 1
      !insertmacro _smarteconomatReleaseProcesses "1"
      Sleep 1200
    ${EndIf}
    nsisunz::Unzip "$PLUGINSDIR\app-$packageArch.zip" "$INSTDIR"
    Pop $R0
    StrCmp $R0 "success" smarteconomat_unzip_ok
    ${If} $R9 < 6
      DetailPrint "Extracción fallida ($R0); reintentando..."
      Goto smarteconomat_unzip_retry
    ${EndIf}
    MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$(decompressionFailed)$\n$R0" /SD IDRETRY IDRETRY smarteconomat_unzip_retry
    Quit
  smarteconomat_unzip_ok:
!macroend
!endif

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
  DetailPrint "Registrando servicio persistente SmartEconomatSupervisor..."
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\scripts\windows-supervisor\install-service.ps1"'
  Pop $0
  DetailPrint "Configurando Docker Desktop Service en arranque automático si existe..."
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "$service = Get-Service -Name ''com.docker.service'' -ErrorAction SilentlyContinue; if ($null -ne $service) { sc.exe config com.docker.service start= auto | Out-Null; sc.exe failure com.docker.service reset= 86400 actions= restart/5000/restart/15000/restart/30000 | Out-Null; Set-Service -Name ''com.docker.service'' -StartupType Automatic; if ($service.Status -ne ''Running'') { Start-Service -Name ''com.docker.service'' } }"'
  Pop $0
  DetailPrint "Archivos listos. Se abrirá el asistente de configuración."
!macroend

!macro customUnInstall
  DetailPrint "Iniciando desinstalación de SmartEconomat..."
  !insertmacro _smarteconomatReleaseProcesses "1"

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

  IfFileExists "$INSTDIR\resources\scripts\windows-supervisor\uninstall-service.ps1" 0 +3
    nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\scripts\windows-supervisor\uninstall-service.ps1"'
    Pop $0

  ; Eliminar tarea programada de autoarranque de Docker Desktop
  nsExec::ExecToLog 'schtasks /Delete /TN "DockerDesktopAutoStart" /F'
  Pop $0

  ; Eliminar clave de registro de autoarranque
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "DockerDesktopAutoStart"

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
