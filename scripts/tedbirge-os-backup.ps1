param(
  [string]$ProjectRoot = "C:\Users\WIN10\Desktop\tedbirge.ai"
)

Set-Location $ProjectRoot

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = ".\manual-backups\os-backup-$stamp"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

if (Test-Path ".\tedbirge-os") {
  Copy-Item ".\tedbirge-os" "$backupDir\tedbirge-os" -Recurse -Force
}

if (Test-Path ".\src") {
  Copy-Item ".\src" "$backupDir\src" -Recurse -Force
}

if (Test-Path ".\tedbirge-panel") {
  Copy-Item ".\tedbirge-panel" "$backupDir\tedbirge-panel" -Recurse -Force
}

Write-Host "BACKUP ALINDI -> $backupDir" -ForegroundColor Green
