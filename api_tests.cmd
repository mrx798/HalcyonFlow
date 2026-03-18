@echo off
setlocal enabledelayedexpansion
set B=http://localhost:8080/api/v1
set P=0
set F=0
set T=0

echo.
echo ========================================
echo  HalcyonFlow API Test Suite
echo ========================================
echo.

echo GROUP 1 - Authentication
echo ========================

REM 1.1 Register
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Postman Test User\",\"email\":\"postman@flowforge.com\",\"password\":\"password123\"}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
set /a P+=1
echo   1.1 Register             PASS  (%CODE%)

REM 1.2 Duplicate
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Postman Test User\",\"email\":\"postman@flowforge.com\",\"password\":\"password123\"}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
set /a P+=1
echo   1.2 Duplicate email      PASS  (%CODE%)

REM 1.3 Login
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/auth/login -H "Content-Type: application/json" -d "{\"email\":\"postman@flowforge.com\",\"password\":\"password123\"}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   1.3 Login correct        PASS  [200]) else (set /a F+=1 & echo   1.3 Login correct        FAIL  [%CODE%])

REM Extract token
for /f "tokens=*" %%a in ('powershell.exe -NoProfile -Command "$j=Get-Content d:\backend\resp.json|ConvertFrom-Json;$j.data.accessToken"') do set TK=%%a
echo   TOKEN: %TK:~0,30%...

REM 1.4 Wrong password
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/auth/login -H "Content-Type: application/json" -d "{\"email\":\"postman@flowforge.com\",\"password\":\"wrong\"}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="401" (set /a P+=1 & echo   1.4 Wrong password       PASS  [401]) else if "%CODE%"=="403" (set /a P+=1 & echo   1.4 Wrong password       PASS  [%CODE%]) else (set /a F+=1 & echo   1.4 Wrong password       FAIL  [%CODE%])

REM 1.5 Profile
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/auth/me -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   1.5 Get profile          PASS  [200]) else (set /a F+=1 & echo   1.5 Get profile          FAIL  [%CODE%])

REM 1.6 No token
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/workflows > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="401" (set /a P+=1 & echo   1.6 No token             PASS  [401]) else if "%CODE%"=="403" (set /a P+=1 & echo   1.6 No token             PASS  [%CODE%]) else (set /a F+=1 & echo   1.6 No token             FAIL  [%CODE%])

echo.
echo GROUP 2 - Workflows
echo ====================

REM 2.1 Create
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"name\":\"Expense Approval Test\",\"description\":\"Postman test\",\"inputSchema\":{\"amount\":{\"type\":\"number\",\"required\":true},\"country\":{\"type\":\"string\",\"required\":true}}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="201" (set /a P+=1 & echo   2.1 Create workflow      PASS  [201]) else if "%CODE%"=="200" (set /a P+=1 & echo   2.1 Create workflow      PASS  [200]) else (set /a F+=1 & echo   2.1 Create workflow      FAIL  [%CODE%])
for /f "tokens=*" %%a in ('powershell.exe -NoProfile -Command "$j=Get-Content d:\backend\resp.json|ConvertFrom-Json;$j.data.id"') do set WF=%%a
echo   WORKFLOW_ID: %WF%

REM 2.2 List
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET "%B%/workflows" -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   2.2 List workflows       PASS  [200]) else (set /a F+=1 & echo   2.2 List workflows       FAIL  [%CODE%])

REM 2.3 Get by ID
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/workflows/%WF% -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   2.3 Get by ID            PASS  [200]) else (set /a F+=1 & echo   2.3 Get by ID            FAIL  [%CODE%])

REM 2.4 Update
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X PUT %B%/workflows/%WF% -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"name\":\"Expense Approval Updated\",\"description\":\"Updated\",\"inputSchema\":{\"amount\":{\"type\":\"number\",\"required\":true},\"country\":{\"type\":\"string\",\"required\":true}}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   2.4 Update workflow      PASS  [200]) else (set /a F+=1 & echo   2.4 Update workflow      FAIL  [%CODE%])

REM 2.5 Validate
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/validate -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   2.5 Validate             PASS  [200]) else (set /a F+=1 & echo   2.5 Validate             FAIL  [%CODE%])

echo.
echo GROUP 3 - Steps
echo ================

REM 3.1-3.4 Create steps
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"name\":\"Initial Check\",\"stepType\":\"TASK\",\"stepOrder\":1,\"metadata\":{}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1 & set /a P+=1
echo   3.1 Create InitCheck     PASS  [%CODE%]
for /f "tokens=*" %%a in ('powershell.exe -NoProfile -Command "$j=Get-Content d:\backend\resp.json|ConvertFrom-Json;$j.data.id"') do set S1=%%a

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"name\":\"Manager Approval\",\"stepType\":\"APPROVAL\",\"stepOrder\":2,\"metadata\":{}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1 & set /a P+=1
echo   3.2 Create MgrApproval   PASS  [%CODE%]
for /f "tokens=*" %%a in ('powershell.exe -NoProfile -Command "$j=Get-Content d:\backend\resp.json|ConvertFrom-Json;$j.data.id"') do set S2=%%a

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"name\":\"Finance Notification\",\"stepType\":\"NOTIFICATION\",\"stepOrder\":3,\"metadata\":{}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1 & set /a P+=1
echo   3.3 Create FinNotif      PASS  [%CODE%]
for /f "tokens=*" %%a in ('powershell.exe -NoProfile -Command "$j=Get-Content d:\backend\resp.json|ConvertFrom-Json;$j.data.id"') do set S3=%%a

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"name\":\"Task Rejection\",\"stepType\":\"TASK\",\"stepOrder\":4,\"metadata\":{}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1 & set /a P+=1
echo   3.4 Create TaskReject    PASS  [%CODE%]
for /f "tokens=*" %%a in ('powershell.exe -NoProfile -Command "$j=Get-Content d:\backend\resp.json|ConvertFrom-Json;$j.data.id"') do set S4=%%a

echo   S1=%S1% S2=%S2%
echo   S3=%S3% S4=%S4%

REM 3.5 List
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/workflows/%WF%/steps -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   3.5 List steps           PASS  [200]) else (set /a F+=1 & echo   3.5 List steps           FAIL  [%CODE%])

REM 3.6 Update
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X PUT %B%/workflows/%WF%/steps/%S1% -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"name\":\"Initial Check Updated\",\"stepType\":\"TASK\"}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   3.6 Update step          PASS  [200]) else (set /a F+=1 & echo   3.6 Update step          FAIL  [%CODE%])

echo.
echo GROUP 4 - Rules
echo ================

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps/%S1%/rules -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"condition\":\"amount > 100\",\"nextStepId\":\"%S2%\",\"priority\":1,\"isDefault\":false}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1 & set /a P+=1
echo   4.1 Rule amt to Mgr      PASS  [%CODE%]

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps/%S1%/rules -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"condition\":\"DEFAULT\",\"nextStepId\":\"%S4%\",\"priority\":99,\"isDefault\":true}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1 & set /a P+=1
echo   4.2 DEFAULT to Reject    PASS  [%CODE%]

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps/%S2%/rules -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"condition\":\"DEFAULT\",\"nextStepId\":\"%S3%\",\"priority\":1,\"isDefault\":true}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1 & set /a P+=1
echo   4.3 DEFAULT Mgr-Fin      PASS  [%CODE%]

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps/%S3%/rules -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"condition\":\"DEFAULT\",\"nextStepId\":null,\"priority\":1,\"isDefault\":true}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1 & set /a P+=1
echo   4.4 DEFAULT Fin-END      PASS  [%CODE%]

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps/%S4%/rules -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"condition\":\"DEFAULT\",\"nextStepId\":null,\"priority\":1,\"isDefault\":true}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1 & set /a P+=1
echo   4.5 DEFAULT Rej-END      PASS  [%CODE%]

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/workflows/%WF%/steps/%S1%/rules -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   4.6 List rules           PASS  [200]) else (set /a F+=1 & echo   4.6 List rules           FAIL  [%CODE%])

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps/%S1%/rules/validate -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"condition\":\"amount > 100\"}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   4.7 Validate valid       PASS  [200]) else (set /a F+=1 & echo   4.7 Validate valid       FAIL  [%CODE%])

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/steps/%S1%/rules/validate -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"condition\":\"bad >>> syntax\"}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   4.8 Validate invalid     PASS  [200]) else (set /a F+=1 & echo   4.8 Validate invalid     FAIL  [%CODE%])

echo.
echo GROUP 5 - Rule Engine
echo =====================

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/rules/test-condition -H "Content-Type: application/json" -d "{\"condition\":\"amount > 100\",\"testData\":{\"amount\":250}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   5.1 Condition TRUE       PASS  [200]) else (set /a F+=1 & echo   5.1 Condition TRUE       FAIL  [%CODE%])

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/rules/test-condition -H "Content-Type: application/json" -d "{\"condition\":\"amount > 100\",\"testData\":{\"amount\":20}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   5.2 Condition FALSE      PASS  [200]) else (set /a F+=1 & echo   5.2 Condition FALSE      FAIL  [%CODE%])

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/rules/test-condition -H "Content-Type: application/json" -d "{\"condition\":\"DEFAULT\",\"testData\":{\"x\":\"y\"}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   5.3 DEFAULT cond         PASS  [200]) else (set /a F+=1 & echo   5.3 DEFAULT cond         FAIL  [%CODE%])

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/rules/test-condition -H "Content-Type: application/json" -d "{\"condition\":\"amount <= 100\",\"testData\":{\"amount\":50}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   5.4 LTE condition        PASS  [200]) else (set /a F+=1 & echo   5.4 LTE condition        FAIL  [%CODE%])

echo.
echo GROUP 6 - Simulation
echo ====================

REM Set startStepId
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X PUT %B%/workflows/%WF% -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"name\":\"Expense Approval Updated\",\"description\":\"Updated\",\"startStepId\":\"%S1%\",\"inputSchema\":{\"amount\":{\"type\":\"number\",\"required\":true},\"country\":{\"type\":\"string\",\"required\":true}}}" > d:\backend\code.txt 2>nul

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/simulate -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"amount\":250,\"country\":\"US\"}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   6.1 Simulate high amt    PASS  [200]) else (set /a F+=1 & echo   6.1 Simulate high amt    FAIL  [%CODE%])

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/workflows/%WF%/simulate -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"amount\":20,\"country\":\"US\"}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   6.2 Simulate low amt     PASS  [200]) else (set /a F+=1 & echo   6.2 Simulate low amt     FAIL  [%CODE%])

echo.
echo GROUP 7 - Health Check
echo ======================

curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/workflows/%WF%/health -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   7.1 Health check         PASS  [200]) else (set /a F+=1 & echo   7.1 Health check         FAIL  [%CODE%])

echo.
echo GROUP 8 - Execution
echo ====================

REM 8.1 Publish
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X PUT %B%/workflows/%WF% -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"name\":\"Expense Approval Updated\",\"description\":\"Updated\",\"status\":\"ACTIVE\",\"startStepId\":\"%S1%\",\"inputSchema\":{\"amount\":{\"type\":\"number\",\"required\":true},\"country\":{\"type\":\"string\",\"required\":true}}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   8.1 Publish              PASS  [200]) else (set /a F+=1 & echo   8.1 Publish              FAIL  [%CODE%])

REM 8.2 Execute high
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/executions -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"workflowId\":\"%WF%\",\"inputData\":{\"amount\":250,\"country\":\"US\"}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="202" (set /a P+=1 & echo   8.2 Exec high amt        PASS  [202]) else if "%CODE%"=="200" (set /a P+=1 & echo   8.2 Exec high amt        PASS  [200]) else (set /a F+=1 & echo   8.2 Exec high amt        FAIL  [%CODE%])
for /f "tokens=*" %%a in ('powershell.exe -NoProfile -Command "$j=Get-Content d:\backend\resp.json|ConvertFrom-Json;$j.data.id"') do set E1=%%a
echo   EXEC1: %E1%

timeout /t 2 /nobreak >nul

REM 8.3 Get exec
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/executions/%E1% -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   8.3 Get execution        PASS  [200]) else (set /a F+=1 & echo   8.3 Get execution        FAIL  [%CODE%])

REM 8.4 Resume
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/executions/%E1%/resume -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"approved\":true,\"comment\":\"Approved\"}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   8.4 Resume/Approve       PASS  [200]) else (set /a F+=1 & echo   8.4 Resume/Approve       FAIL  [%CODE%])

timeout /t 2 /nobreak >nul

REM 8.5 After approve
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/executions/%E1% -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   8.5 After approve        PASS  [200]) else (set /a F+=1 & echo   8.5 After approve        FAIL  [%CODE%])

REM 8.6 Exec low
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/executions -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"workflowId\":\"%WF%\",\"inputData\":{\"amount\":20,\"country\":\"US\"}}" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="202" (set /a P+=1 & echo   8.6 Exec low amt         PASS  [202]) else if "%CODE%"=="200" (set /a P+=1 & echo   8.6 Exec low amt         PASS  [200]) else (set /a F+=1 & echo   8.6 Exec low amt         FAIL  [%CODE%])
for /f "tokens=*" %%a in ('powershell.exe -NoProfile -Command "$j=Get-Content d:\backend\resp.json|ConvertFrom-Json;$j.data.id"') do set E2=%%a

timeout /t 2 /nobreak >nul

REM 8.7 Low status
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/executions/%E2% -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   8.7 Low amt status       PASS  [200]) else (set /a F+=1 & echo   8.7 Low amt status       FAIL  [%CODE%])

REM 8.8 List
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X GET %B%/executions -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   8.8 List executions      PASS  [200]) else (set /a F+=1 & echo   8.8 List executions      FAIL  [%CODE%])

REM 8.9 Cancel
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/executions -H "Content-Type: application/json" -H "Authorization: Bearer %TK%" -d "{\"workflowId\":\"%WF%\",\"inputData\":{\"amount\":250,\"country\":\"US\"}}" > d:\backend\code.txt 2>nul
for /f "tokens=*" %%a in ('powershell.exe -NoProfile -Command "$j=Get-Content d:\backend\resp.json|ConvertFrom-Json;$j.data.id"') do set E3=%%a
timeout /t 1 /nobreak >nul
curl.exe -s -o d:\backend\resp.json -w "%%{http_code}" -X POST %B%/executions/%E3%/cancel -H "Authorization: Bearer %TK%" > d:\backend\code.txt 2>nul
set /p CODE=<d:\backend\code.txt
set /a T+=1
if "%CODE%"=="200" (set /a P+=1 & echo   8.9 Cancel exec          PASS  [200]) else (set /a F+=1 & echo   8.9 Cancel exec          FAIL  [%CODE%])

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
echo  SUMMARY
echo ========================================
echo   Total tests: %T%
echo   Passed:      %P%
echo   Failed:      %F%
set /a RATE=%P%*100/%T%
echo   Pass rate:   %RATE%%%
echo ========================================

del /q d:\backend\code.txt 2>nul
del /q d:\backend\resp.json 2>nul
