param(
  [switch]$OpenBrowser = $true
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root 'backend'
$FrontendDir = Join-Path $Root 'frontend'
$TempDir = Join-Path $env:TEMP 'localbot-dev'
$RunDir = Join-Path $TempDir (Get-Date -Format 'yyyyMMdd-HHmmss-fff')
$null = New-Item -ItemType Directory -Force -Path $RunDir

$BackendOut = Join-Path $RunDir 'backend.out.log'
$BackendErr = Join-Path $RunDir 'backend.err.log'
$FrontendOut = Join-Path $RunDir 'frontend.out.log'
$FrontendErr = Join-Path $RunDir 'frontend.err.log'

function Test-Port {
  param([int]$Port)
  $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
  return [bool]$conn
}

function Start-App {
  param(
    [string]$Name,
    [string]$WorkingDir,
    [string]$ScriptName,
    [string]$OutLog,
    [string]$ErrLog
  )

  $port = if ($Name -eq 'Backend') { 3000 } else { 5173 }

  if (Test-Port -Port $port) {
    Write-Host "[$Name] ya está corriendo"
    return
  }

  $null = New-Item -ItemType File -Force -Path $OutLog
  $null = New-Item -ItemType File -Force -Path $ErrLog

  $process = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', $ScriptName) -WorkingDirectory $WorkingDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $OutLog -RedirectStandardError $ErrLog
  Write-Host "[$Name] iniciando con `npm run $ScriptName`..."
  return $process.Id
}

function Wait-ForUrl {
  param(
    [string]$Url,
    [int]$ProcessId = 0,
    [string]$FailureLog = '',
    [int]$TimeoutSec = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if ($FailureLog -and (Test-Path $FailureLog)) {
      $recent = Get-Content $FailureLog -Tail 60 -ErrorAction SilentlyContinue
      if ($recent -match 'Failed running ''src/app\.js''|Failed to start server|PrismaClientInitializationError|Authentication failed against database server|Can''t reach database server') {
        return $false
      }
    }

    if ($ProcessId -gt 0) {
      $alive = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
      if (-not $alive) {
        return $false
      }
    }

    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  return $false
}

Write-Host 'LocalBot: levantando frontend + backend...'
Write-Host 'Nota: Supabase no se inicia localmente; el backend valida la conexión a la base remota al arrancar.'

& (Join-Path $Root 'stop-all.ps1') -Quiet
$backendPid = Start-App -Name 'Backend' -WorkingDir $BackendDir -ScriptName 'start' -OutLog $BackendOut -ErrLog $BackendErr
$frontendPid = Start-App -Name 'Frontend' -WorkingDir $FrontendDir -ScriptName 'dev' -OutLog $FrontendOut -ErrLog $FrontendErr

$backendReady = Wait-ForUrl -Url 'http://localhost:3000/health' -ProcessId $backendPid -FailureLog $BackendErr -TimeoutSec 75
$frontendReady = Wait-ForUrl -Url 'http://localhost:5173' -ProcessId $frontendPid -TimeoutSec 75

if (-not $backendReady) {
  Write-Host ''
  Write-Host '[Backend] no levantó correctamente. Revisa estos logs:'
  if (Test-Path $BackendOut) { Get-Content $BackendOut -Tail 40 }
  if (Test-Path $BackendErr) { Get-Content $BackendErr -Tail 40 }
  Write-Host "Logs de esta ejecución: $RunDir"
  exit 1
}

if (-not $frontendReady) {
  Write-Host ''
  Write-Host '[Frontend] no levantó correctamente. Revisa estos logs:'
  if (Test-Path $FrontendOut) { Get-Content $FrontendOut -Tail 40 }
  if (Test-Path $FrontendErr) { Get-Content $FrontendErr -Tail 40 }
  Write-Host "Logs de esta ejecución: $RunDir"
  exit 1
}

Write-Host ''
Write-Host 'Listo.'
Write-Host 'Frontend: http://localhost:5173'
Write-Host 'Backend:   http://localhost:3000'

if ($OpenBrowser) {
  Start-Process 'http://localhost:5173' | Out-Null
}
