param(
    [switch]$ResetData,
    [switch]$Wait
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$localRoot = Join-Path $root ".local-data"
$dbsDir = Join-Path $localRoot "dbs"
$logsDir = Join-Path $localRoot "logs"
$pidsFile = Join-Path $localRoot "pids.json"

if ($ResetData -and (Test-Path $dbsDir)) {
    Remove-Item -Path $dbsDir -Recurse -Force
}

New-Item -ItemType Directory -Path $dbsDir -Force | Out-Null
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

$javaExe = "java"
if (Test-Path "C:\Program Files\Java\jdk-17\bin\java.exe") {
    $javaExe = "C:\Program Files\Java\jdk-17\bin\java.exe"
}

$pids = @()

function Start-ManagedProcess {
    param(
        [string]$Name,
        [string]$FilePath,
        [string[]]$ArgumentList,
        [string]$WorkingDirectory,
        [hashtable]$EnvVars
    )
    $saved = @{}
    foreach ($k in $EnvVars.Keys) {
        $saved[$k] = [Environment]::GetEnvironmentVariable($k, "Process")
        [Environment]::SetEnvironmentVariable($k, $EnvVars[$k], "Process")
    }

    $outLog = Join-Path $logsDir "$Name.out.log"
    $errLog = Join-Path $logsDir "$Name.err.log"
    $proc = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $outLog -RedirectStandardError $errLog -WindowStyle Hidden -PassThru

    foreach ($k in $EnvVars.Keys) {
        [Environment]::SetEnvironmentVariable($k, $saved[$k], "Process")
    }

    Write-Output "Started $Name (PID $($proc.Id))"
    return @{ name = $Name; pid = $proc.Id }
}

$pids += Start-ManagedProcess -Name "user-service" -FilePath $javaExe `
    -ArgumentList @("-Xmx256m", "-jar", (Join-Path $root "services\domain1-auth-order\user-service\target\user-service-1.0.0.jar"), "--spring.profiles.active=local") `
    -WorkingDirectory $root -EnvVars @{ LOCAL_DB_DIR = $dbsDir; SERVER_PORT = "8081" }

$pids += Start-ManagedProcess -Name "order-service" -FilePath $javaExe `
    -ArgumentList @("-Xmx256m", "-jar", (Join-Path $root "services\domain1-auth-order\order-service\target\order-service-1.0.0.jar"), "--spring.profiles.active=local") `
    -WorkingDirectory $root -EnvVars @{
        LOCAL_DB_DIR = $dbsDir
        SERVER_PORT = "8082"
        RABBITMQ_ENABLED = "false"
        DISPATCH_EVENT_URL = "http://127.0.0.1:8083/api/dispatch/internal/events"
        TRACKING_EVENT_URL = "http://127.0.0.1:8084/api/tracking/internal/events"
    }

$pids += Start-ManagedProcess -Name "dispatch-service" -FilePath "node" `
    -ArgumentList @((Join-Path $root "services\domain2-dispatch\dispatch-service\dist\main.js")) `
    -WorkingDirectory (Join-Path $root "services\domain2-dispatch\dispatch-service") `
    -EnvVars @{
        PORT = "8083"
        DB_TYPE = "local"
        LOCAL_DB_DIR = $dbsDir
        RABBITMQ_ENABLED = "false"
        ORDER_EVENT_URL = "http://127.0.0.1:8082/api/orders/internal/events"
        TRACKING_EVENT_URL = "http://127.0.0.1:8084/api/tracking/internal/events"
    }

$pids += Start-ManagedProcess -Name "tracking-service" -FilePath "dotnet" `
    -ArgumentList @((Join-Path $root "services\domain3-tracking\tracking-service\bin\Release\net9.0\TrackingService.dll")) `
    -WorkingDirectory (Join-Path $root "services\domain3-tracking\tracking-service") `
    -EnvVars @{ ASPNETCORE_URLS = "http://+:8084"; STORAGE_MODE = "file"; LOCAL_DB_DIR = $dbsDir; RABBITMQ_ENABLED = "false" }

$pids += Start-ManagedProcess -Name "api-gateway" -FilePath $javaExe `
    -ArgumentList @("-Xmx256m", "-jar", (Join-Path $root "services\api-gateway\target\api-gateway-1.0.0.jar")) `
    -WorkingDirectory $root `
    -EnvVars @{
        SERVER_PORT = "8080"
        USER_SERVICE_URL = "http://127.0.0.1:8081"
        ORDER_SERVICE_URL = "http://127.0.0.1:8082"
        DISPATCH_SERVICE_URL = "http://127.0.0.1:8083"
        TRACKING_SERVICE_URL = "http://127.0.0.1:8084"
    }

$pids += Start-ManagedProcess -Name "web-portal" -FilePath "node" `
    -ArgumentList @((Join-Path $root "clients\web-portal\node_modules\vite\bin\vite.js"), "preview", "--port", "3000", "--host") `
    -WorkingDirectory (Join-Path $root "clients\web-portal") `
    -EnvVars @{}

$pids | ConvertTo-Json | Set-Content -Path $pidsFile -Encoding UTF8

$checks = @(
    @{ name = "user-service"; url = "http://127.0.0.1:8081/actuator/health" },
    @{ name = "order-service"; url = "http://127.0.0.1:8082/actuator/health" },
    @{ name = "dispatch-service"; url = "http://127.0.0.1:8083/api/dispatch/health" },
    @{ name = "tracking-service"; url = "http://127.0.0.1:8084/api/tracking/health" },
    @{ name = "api-gateway"; url = "http://127.0.0.1:8080/actuator/health" },
    @{ name = "web-portal"; url = "http://127.0.0.1:3000/" }
)

Write-Output "Waiting for all 6 services to become healthy..."
foreach ($c in $checks) {
    $ok = $false
    for ($i = 0; $i -lt 45; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $c.url -UseBasicParsing -TimeoutSec 2
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
                $ok = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    if (-not $ok) {
        Write-Error "Service $($c.name) failed health check at $($c.url). See $logsDir"
        exit 1
    }
    Write-Output "[READY] $($c.name) -> $($c.url)"
}

Write-Output "ALL_SERVICES_READY | Web Portal: http://localhost:3000 | API Gateway: http://localhost:8080"

if ($Wait) {
    try {
        while ($true) {
            Start-Sleep -Seconds 5
        }
    } finally {
        & (Join-Path $PSScriptRoot "stop-local.ps1")
    }
}
