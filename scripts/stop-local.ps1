param(
    [switch]$CleanData
)

$root = Split-Path -Parent $PSScriptRoot
$localRoot = Join-Path $root ".local-data"
$pidsFile = Join-Path $localRoot "pids.json"

if (Test-Path $pidsFile) {
    $items = Get-Content $pidsFile -Raw | ConvertFrom-Json
    foreach ($item in $items) {
        if ($item.pid) {
            $proc = Get-Process -Id $item.pid -ErrorAction SilentlyContinue
            if ($proc) {
                Stop-Process -Id $item.pid -Force -ErrorAction SilentlyContinue
                Write-Output "Stopped $($item.name) (PID $($item.pid))"
            }
        }
    }
    Remove-Item $pidsFile -Force -ErrorAction SilentlyContinue
}

$ports = @(8080, 8081, 8082, 8083, 8084, 3000)
$conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort }
foreach ($c in $conns) {
    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Output "Freed port $($c.LocalPort) (PID $($c.OwningProcess))"
}

if ($CleanData -and (Test-Path $localRoot)) {
    Remove-Item -Path $localRoot -Recurse -Force -ErrorAction SilentlyContinue
    Write-Output "Cleaned .local-data directory"
}
