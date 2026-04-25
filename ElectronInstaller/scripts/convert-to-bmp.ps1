param (
    [string]$SourcePath,
    [string]$TargetPath
)

Add-Type -AssemblyName System.Drawing

try {
    $image = [System.Drawing.Image]::FromFile($SourcePath)
    $image.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $image.Dispose()
    Write-Host "Converted $SourcePath to $TargetPath successfully."
    exit 0
} catch {
    Write-Error "Failed to convert $SourcePath to BMP: $_"
    exit 1
}
