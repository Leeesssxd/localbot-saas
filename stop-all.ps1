param(
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$ports = 3000, 5173
$pids = @()

foreach ($port in $ports) {
  try {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
      if ($conn.OwningProcess -and ($pids -notcontains $conn.OwningProcess)) {
        $pids += $conn.OwningProcess
      }
    }
  } catch {}
}

if ($pids.Count -eq 0) {
  if (-not $Quiet) { Write-Host 'No hay procesos escuchando en 3000 o 5173.' }
  return
}

foreach ($processId in $pids) {
  try {
    Stop-Process -Id $processId -Force -ErrorAction Stop
    if (-not $Quiet) { Write-Host "Proceso detenido: $processId" }
  } catch {
    if (-not $Quiet) { Write-Host "No se pudo detener el proceso $processId" }
  }
}
