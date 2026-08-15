# Update Roman: local changes -> GitHub -> server -> restart bot.
# Run this script (or the "Обновить Романа" shortcut on Desktop) after editing code.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$SERVER   = 'root@159.194.201.25'
$SSH_KEY  = Join-Path $env:USERPROFILE '.ssh\id_ed25519'
$REPO     = Split-Path $PSScriptRoot -Parent   # ...\Betsy
$APP_DIR  = '/opt/roman'

Set-Location $REPO

Write-Host "==> Обновление Романа" -ForegroundColor Cyan

# 1. Commit + push local changes
Write-Host "[1/3] Проверяю локальные изменения..." -ForegroundColor Cyan
git add -A
$staged = git diff --cached --stat
if ($staged) {
  $msg = "update: " + (Get-Date -Format "yyyy-MM-dd HH:mm")
  git commit -m $msg
  git push origin main
  Write-Host "[1/3] Изменения отправлены в GitHub: $msg" -ForegroundColor Green
} else {
  Write-Host "[1/3] Изменений нет — код уже в GitHub" -ForegroundColor Yellow
}

# 2. Pull + build + restart on server
Write-Host "[2/3] Обновляю на сервере ($SERVER)..." -ForegroundColor Cyan
$remote = "cd $APP_DIR; git pull --ff-only; npm install --no-audit --no-fund 2>&1 | tail -2; npm run build; sudo systemctl restart betsy trainer"
& ssh -i $SSH_KEY -o BatchMode=yes -o ConnectTimeout=20 $SERVER $remote

if ($LASTEXITCODE -ne 0) {
  Write-Host "ОШИБКА: не удалось обновить на сервере (код $LASTEXITCODE)" -ForegroundColor Red
  exit 1
}

# 3. Verify
Write-Host "[3/3] Проверяю статус ботов..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
& ssh -i $SSH_KEY -o BatchMode=yes $SERVER "systemctl is-active betsy trainer; echo '---betsy---'; journalctl -u betsy --no-pager -n 3; echo '---trainer---'; journalctl -u trainer --no-pager -n 3"

Write-Host ""
Write-Host "Готово! Роман и Тренер обновлены." -ForegroundColor Green