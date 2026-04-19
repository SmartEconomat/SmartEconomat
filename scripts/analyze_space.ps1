function Get-SizeGB($path) {
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue
        if ($files) {
            $sum = ($files | Measure-Object -Property Length -Sum).Sum
            return [math]::Round($sum / 1GB, 2)
        }
    }
    return 0
}

Write-Host "--- Análisis de Espacio en Proyecto ---" -ForegroundColor Cyan
$repoSize = Get-SizeGB "."
Write-Host "Tamaño total del repositorio actual: $repoSize GB"

$nodeModules = Get-ChildItem -Path . -Filter "node_modules" -Recurse -Directory -ErrorAction SilentlyContinue
if ($nodeModules) {
    Write-Host "`nTop node_modules folders:" -ForegroundColor Yellow
    foreach ($nm in $nodeModules) {
        $size = Get-SizeGB $nm.FullName
        if ($size -gt 0.01) {
            Write-Host "- $($nm.FullName): $size GB"
        }
    }
}

Write-Host "`n--- Análisis de Windows (General) ---" -ForegroundColor Cyan
$rootFiles = Get-ChildItem -Path C:\ -Force -File -ErrorAction SilentlyContinue | Select-Object Name, @{Name='SizeGB';Expression={[math]::Round($_.Length / 1GB, 2)}} | Sort-Object SizeGB -Descending
if ($rootFiles) {
    Write-Host "Archivos grandes en C:\"
    $rootFiles | Format-Table -AutoSize
}

$heavyFolders = @(
    "C:\Windows\WinSxS",
    "C:\Windows\System32\DriverStore",
    "C:\Windows\Installer",
    "$env:LOCALAPPDATA",
    "$env:APPDATA"
)

Write-Host "`nCarpetas Pesadas conocidas:" -ForegroundColor Yellow
foreach ($folder in $heavyFolders) {
    if (Test-Path $folder) {
        $sizeGB = 0
        try {
            # Use a simpler way to get size if possible, or keep the function
            $sizeGB = (Get-ChildItem -Path $folder -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
            $sizeGB = [math]::Round($sizeGB, 2)
        } catch {}
        Write-Host "- ${folder}: $sizeGB GB"
    }
}
