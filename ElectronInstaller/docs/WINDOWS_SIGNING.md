# Firma de codigo Windows para SmartEconomat Installer

## Variables usadas por electron-builder

La configuracion de build usa estas variables de entorno:

- `WIN_CSC_LINK`: ruta al archivo `.pfx`.
- `WIN_CSC_KEY_PASSWORD`: password del `.pfx`.

## Build local sin firma (recomendado para desarrollo)

Para compilar en Windows sin requerir privilegios de symlink ni certificado de firma:

```powershell
npm run build:win
```

Este perfil desactiva `signAndEditExecutable` y evita la dependencia operativa de `winCodeSign` en entorno local.

Si prefieres el nombre histórico del flujo local, `npm run build:win:fast` hace exactamente lo mismo.

## Desarrollo (self-signed)

1. Crear certificado de firma de codigo en Windows PowerShell (Admin):

```powershell
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=SmartEconomat Dev" -CertStoreLocation "Cert:\CurrentUser\My"
$pwd = ConvertTo-SecureString -String "ChangeMe-Strong-2026" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "$env:USERPROFILE\Desktop\smarteconomat-dev-signing.pfx" -Password $pwd
```

2. Importar el certificado a confianza local:

```powershell
Import-PfxCertificate -FilePath "$env:USERPROFILE\Desktop\smarteconomat-dev-signing.pfx" -CertStoreLocation "Cert:\CurrentUser\Root" -Password $pwd
Import-PfxCertificate -FilePath "$env:USERPROFILE\Desktop\smarteconomat-dev-signing.pfx" -CertStoreLocation "Cert:\CurrentUser\TrustedPublisher" -Password $pwd
```

3. Definir variables y compilar:

```powershell
$env:WIN_CSC_LINK = "$env:USERPROFILE\Desktop\smarteconomat-dev-signing.pfx"
$env:WIN_CSC_KEY_PASSWORD = "ChangeMe-Strong-2026"
npm run build:win
```

4. Verificar publisher en el EXE:

- Click derecho en el `.exe` -> Propiedades -> Firmas digitales.
- Debe aparecer `SmartEconomat Dev` o el publisher que se haya usado.

## Produccion (certificado comercial, recomendado EV)

1. Obtener certificado de firma de codigo (ideal EV) de proveedor confiable.
2. Exportar/acceder al certificado desde el pipeline de release de Windows.
3. Configurar secretos:

- `WIN_CSC_LINK`
- `WIN_CSC_KEY_PASSWORD`

4. Ejecutar build release firmado:

```powershell
npm run build:win
```

5. Validar firma:

```powershell
Get-AuthenticodeSignature .\dist\SmartEconomat-1.0.0-win-x64.exe | Format-List
```

## Smart App Control y Defender

- Smart App Control no ofrece exclusion por app en modo estricto.
- El instalador detecta SAC y aplica fallback de desarrollo: intenta agregar exclusion de Defender para ruta runtime y ejecutable, y abre Seguridad de Windows para validacion asistida.
- En produccion, la mitigacion principal es publicar siempre binarios firmados por certificado reconocido.
