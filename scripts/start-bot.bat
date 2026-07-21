@echo off
cd /d "C:\Users\Александра\Desktop\Лапа-Рома\Betsy"
node dist\index.js >> "%USERPROFILE%\.betsy\bot.log" 2>> "%USERPROFILE%\.betsy\bot-error.log"
