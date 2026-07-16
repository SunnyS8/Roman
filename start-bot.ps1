$logFile = "$env:USERPROFILE\.betsy\bot.log"
$botDir = "C:\Users\Александра\Desktop\Новая папка (2)\Betsy"

# Kill any existing node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Write start timestamp
"=== Запуск $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Out-File $logFile

# Start bot
Set-Location -LiteralPath $botDir
npm run dev >> $logFile 2>&1
