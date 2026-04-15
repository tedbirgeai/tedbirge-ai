param(
  [string]$ProjectRoot = "C:\Users\WIN10\Desktop\tedbirge.ai"
)

Set-Location $ProjectRoot

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$snapshotDir = ".\manual-backups\os-snapshot-$stamp"

New-Item -ItemType Directory -Force -Path $snapshotDir | Out-Null

if (Test-Path ".\tedbirge-os") {
  Copy-Item ".\tedbirge-os" "$snapshotDir\tedbirge-os" -Recurse -Force
}

Write-Host "SNAPSHOT ALINDI -> $snapshotDir" -ForegroundColor Cyan
