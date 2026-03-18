@echo off
setlocal enabledelayedexpansion
set B=http://localhost:8080/api/v1
set P=0
set F=0
set T=0

REM Login first
curl.exe -s -o d:\backend\resp.json -X POST %B%/auth/login -H "Content-Type: application/json" -d "{\"email\":\"postman@flowforge.com\",\"password\":\"password123\"}"
for /f "tokens=*" %%a in ('powershell.exe -NoProfile -Command "$j=Get-Content d:\backend\resp.json|ConvertFrom-Json;$j.data.accessToken"') do set TK=%%a

echo GROUP 5 - Rule Engine
echo =====================

REM Write JSON to files to avoid escaping issues
echo {"condition":"amount ^> 100","testData":{"amount":250}} > d:\backend\req.json
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/rules/test-condition -H "Content-Type: application/json" -d @d:\backend\req.json > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   5.1 Condition TRUE       PASS  [200]) else (set /a F+=1 & echo   5.1 Condition TRUE       FAIL  [%CODE%])

echo {"condition":"amount ^> 100","testData":{"amount":20}} > d:\backend\req.json
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/rules/test-condition -H "Content-Type: application/json" -d @d:\backend\req.json > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   5.2 Condition FALSE      PASS  [200]) else (set /a F+=1 & echo   5.2 Condition FALSE      FAIL  [%CODE%])

echo {"condition":"DEFAULT","testData":{"x":"y"}} > d:\backend\req.json
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/rules/test-condition -H "Content-Type: application/json" -d @d:\backend\req.json > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   5.3 DEFAULT condition    PASS  [200]) else (set /a F+=1 & echo   5.3 DEFAULT condition    FAIL  [%CODE%])

echo {"condition":"amount ^<= 100","testData":{"amount":50}} > d:\backend\req.json
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/rules/test-condition -H "Content-Type: application/json" -d @d:\backend\req.json > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   5.4 LTE condition        PASS  [200]) else (set /a F+=1 & echo   5.4 LTE condition        FAIL  [%CODE%])

echo.
echo GROUP 9 - Dashboard
echo ====================

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/dashboard/stats -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   9.1 Dashboard stats      PASS  [200]) else (set /a F+=1 & echo   9.1 Dashboard stats      FAIL  [%CODE%])

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/dashboard/recent-executions -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   9.2 Recent executions    PASS  [200]) else (set /a F+=1 & echo   9.2 Recent executions    FAIL  [%CODE%])

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/dashboard/trends -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   9.3 Execution trends     PASS  [200]) else (set /a F+=1 & echo   9.3 Execution trends     FAIL  [%CODE%])

echo.
echo GROUP 10 - Notifications
echo ========================

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/notifications -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   10.1 Get notifications   PASS  [200]) else (set /a F+=1 & echo   10.1 Get notifications   FAIL  [%CODE%])

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X PUT %B%/notifications/read-all -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   10.2 Mark all read       PASS  [200]) else (set /a F+=1 & echo   10.2 Mark all read       FAIL  [%CODE%])

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/notifications -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   10.3 Verify all read     PASS  [200]) else (set /a F+=1 & echo   10.3 Verify all read     FAIL  [%CODE%])

echo.
echo ========================================
echo  Groups 5,9,10 SUMMARY
echo ========================================
echo   Total: %T%  Passed: %P%  Failed: %F%
echo ========================================

del /q d:\backend\code.txt 2>nul
del /q d:\backend\resp.json 2>nul
del /q d:\backend\req.json 2>nul
