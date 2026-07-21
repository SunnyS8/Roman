$logFile = "$env:USERPROFILE\.betsy\bot.log"
$errFile = "$env:USERPROFILE\.betsy\bot-error.log"
$botDir = "C:\Users\Александра\Desktop\Лапа-Рома\Betsy"

Set-Location -LiteralPath $botDir
$n = 0

while ($true) {
  $n++
  $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "=== Запуск #$n от $now ===" | Out-File -FilePath $logFile -Encoding utf8

  $proc = Start-Process -PassThru -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $errFile -FilePath "node" -ArgumentList "dist\index.js"
  
  $proc.WaitForExit()
  
  $exitTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "Watchdog: bot exited at $exitTime (code: $($proc.ExitCode)), restart in 5s" | Out-File -FilePath $logFile -Append -Encoding utf8
  
  Start-Sleep -Seconds 5
}
