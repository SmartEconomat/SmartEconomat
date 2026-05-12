param (
    [string]$SourcePath,
    [string]$TargetPath
)

Add-Type -AssemblyName System.Drawing

try {
    $source = [System.Drawing.Image]::FromFile($SourcePath)

    # NSIS requiere BMP 24-bit (sin canal alfa). Si se guarda como 32-bit BGRA
    # el panel lateral aparece en blanco. Aplanamos sobre fondo blanco en 24-bit.
    $bmp24 = New-Object System.Drawing.Bitmap($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp24)
    $g.Clear([System.Drawing.Color]::White)
    $g.DrawImage($source, 0, 0, $source.Width, $source.Height)
    $g.Dispose()

    $bmp24.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $bmp24.Dispose()
    $source.Dispose()

    Write-Host "Converted $SourcePath to 24-bit BMP at $TargetPath successfully."
    exit 0
} catch {
    Write-Error "Failed to convert $SourcePath to BMP: $_"
    exit 1
}
