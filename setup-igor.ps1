# Setup script for Игорь — Personal Health Coach Telegram Bot
# Based on Betsy AI Assistant

Write-Host "=== Установка Игоря — персонального health-коуча ===" -ForegroundColor Green
Write-Host ""

# 1. Check Node.js
$nodeVer = node --version
if (-not $?) {
    Write-Host "❌ Node.js не найден. Установи Node.js 20+ с https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js: $nodeVer"

# 2. Install dependencies (skip native module build)
Write-Host "`n📦 Устанавливаю зависимости..." -ForegroundColor Yellow
npm install --ignore-scripts
if (-not $?) {
    Write-Host "❌ Ошибка установки зависимостей" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Зависимости установлены"

# 3. Try building better-sqlite3 (needs Visual Studio Build Tools)
Write-Host "`n🔨 Проверяю сборку native модуля better-sqlite3..." -ForegroundColor Yellow
Push-Location node_modules\better-sqlite3
$buildResult = & npx node-gyp rebuild 2>&1
Pop-Location

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Не удалось собрать better-sqlite3 (нужны C++ tools)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Вариант A: Установить Visual Studio Build Tools" -ForegroundColor Cyan
    Write-Host "   1. Скачай: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor White
    Write-Host "   2. Запусти установку, выбери 'Desktop development with C++'" -ForegroundColor White
    Write-Host "   3. Перезапусти этот скрипт" -ForegroundColor White
    Write-Host ""
    Write-Host "   Вариант B: Использовать Docker" -ForegroundColor Cyan
    Write-Host "   1. Установи Docker Desktop" -ForegroundColor White
    Write-Host "   2. Запусти: docker run -d --name igor -p 3777:3777 -v igor-data:/root/.betsy aimagine/betsy" -ForegroundColor White
    Write-Host "   3. Скопируй конфиг в Docker volume" -ForegroundColor White
    Write-Host ""
    Write-Host "   Вариант C: Использовать npx betsy (облачная версия)" -ForegroundColor Cyan
    Write-Host "   Просто запусти: npx betsy" -ForegroundColor White
    exit 1
}
Write-Host "✅ Native модуль better-sqlite3 собран"

# 4. Create ~/.betsy directory structure
$betsyDir = Join-Path $env:USERPROFILE ".betsy"
$skillsDir = Join-Path $betsyDir "skills"
New-Item -ItemType Directory -Path $betsyDir -Force | Out-Null
New-Item -ItemType Directory -Path $skillsDir -Force | Out-Null
Write-Host "✅ Директории созданы: $betsyDir"

# 5. Copy config template
$configPath = Join-Path $betsyDir "config.yaml"
if (-not (Test-Path -LiteralPath $configPath)) {
    Copy-Item "config-templates\igor.config.yaml" -Destination $configPath
    Write-Host "✅ Конфиг скопирован: $configPath"
    Write-Host "⚠️  Отредактируй конфиг: укажи API ключ OpenRouter и токен Telegram бота" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  Конфиг уже существует: $configPath" -ForegroundColor Cyan
}

# 6. Copy skills
$checkinSkill = Join-Path $skillsDir "health-daily-checkin.yaml"
$nutritionSkill = Join-Path $skillsDir "nutrition-tracker.yaml"
if (-not (Test-Path -LiteralPath $checkinSkill)) {
    Copy-Item "config-templates\health-daily-checkin.yaml" -Destination $checkinSkill
}
if (-not (Test-Path -LiteralPath $nutritionSkill)) {
    Copy-Item "config-templates\nutrition-tracker.yaml" -Destination $nutritionSkill
}
Write-Host "✅ Навыки скопированы"

# 7. Build
Write-Host "`n🔨 Собираю проект..." -ForegroundColor Yellow
npm run build
if (-not $?) {
    Write-Host "❌ Ошибка сборки" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Проект собран"

# 8. Instructions
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Игорь готов к запуску!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Отредактируй конфиг:" -ForegroundColor Cyan
Write-Host "   notepad $configPath" -ForegroundColor White
Write-Host "   Укажи:" -ForegroundColor Cyan
Write-Host "   - llm.api_key: твой OpenRouter API ключ (https://openrouter.ai/keys)" -ForegroundColor White
Write-Host "   - telegram.token: токен бота от @BotFather" -ForegroundColor White
Write-Host ""
Write-Host "2. Запусти Игоря:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Напиши боту в Telegram /start" -ForegroundColor Cyan
Write-Host ""
Write-Host "Игорь умеет:" -ForegroundColor Green
Write-Host "  🍽 Анализировать фото еды и считать калории" -ForegroundColor White
Write-Host "  📋 Составлять меню на неделю (диета №5)" -ForegroundColor White
Write-Host "  💪 Планировать тренировки в зале" -ForegroundColor White
Write-Host "  📊 Отслеживать прогресс (вес, самочувствие)" -ForegroundColor White
Write-Host "  📝 Записывать заметки о здоровье" -ForegroundColor White
Write-Host "  🎯 Мотивировать и напоминать о целях" -ForegroundColor White
