param(
  [switch]$OpenBrowser = $true
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root 'backend'
$FrontendDir = Join-Path $Root 'frontend'
$TempDir = Join-Path $env:TEMP 'localbot-dev'
$null = New-Item -ItemType Directory -Force -Path $TempDir

$BackendOut = Join-Path $TempDir 'backend.out.log'
$BackendErr = Join-Path $TempDir 'backend.err.log'
$FrontendOut = Join-Path $TempDir 'frontend.out.log'
$FrontendErr = Join-Path $TempDir 'frontend.err.log'

function Test-Port {
  param([int]$Port)
  $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
  return [bool]$conn
}

function Start-App {
  param(
    [string]$Name,
    [string]$WorkingDir,
    [string]$OutLog,
    [string]$ErrLog
  )

  $port = if ($Name -eq 'Backend') { 3000 } else { 5173 }

  if (Test-Port -Port $port) {
    Write-Host "[$Name] ya está corriendo"
    return
  }

  Remove-Item $OutLog, $ErrLog -Force -ErrorAction SilentlyContinue

  $command = "Set-Location '$WorkingDir'; npm run dev *> '$OutLog' 2> '$ErrLog'"
  Start-Process -FilePath powershell.exe -ArgumentList @('-NoProfile', '-Command', $command) -WindowStyle Hidden | Out-Null
  Write-Host "[$Name] iniciando..."
}

function Wait-ForUrl {
  param(
    [string]$Url,
    [int]$TimeoutSec = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
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
Start-App -Name 'Backend' -WorkingDir $BackendDir -OutLog $BackendOut -ErrLog $BackendErr
Start-App -Name 'Frontend' -WorkingDir $FrontendDir -OutLog $FrontendOut -ErrLog $FrontendErr

$backendReady = Wait-ForUrl -Url 'http://localhost:3000/health' -TimeoutSec 75
$frontendReady = Wait-ForUrl -Url 'http://localhost:5173' -TimeoutSec 75

if (-not $backendReady) {
  Write-Host ''
  Write-Host '[Backend] no respondió a tiempo. Revisa estos logs:'
  if (Test-Path $BackendOut) { Get-Content $BackendOut -Tail 40 }
  if (Test-Path $BackendErr) { Get-Content $BackendErr -Tail 40 }
  exit 1
}

if (-not $frontendReady) {
  Write-Host ''
  Write-Host '[Frontend] no respondió a tiempo. Revisa estos logs:'
  if (Test-Path $FrontendOut) { Get-Content $FrontendOut -Tail 40 }
  if (Test-Path $FrontendErr) { Get-Content $FrontendErr -Tail 40 }
  exit 1
}

Write-Host ''
Write-Host 'Listo.'
Write-Host 'Frontend: http://localhost:5173'
Write-Host 'Backend:   http://localhost:3000'

if ($OpenBrowser) {
  Start-Process 'http://localhost:5173' | Out-Null
}
