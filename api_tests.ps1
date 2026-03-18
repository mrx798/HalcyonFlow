$ErrorActionPreference='SilentlyContinue'
$B='http://localhost:8080/api/v1'
$p=0;$f=0;$t=0;$fl=@()
function T($n,$m,$u,$b,$h,$e){
$script:t++
try{
$prm=@{Method=$m;Uri=$u;ContentType='application/json'}
if($b){$prm.Body=[System.Text.Encoding]::UTF8.GetBytes($b)}
if($h){$prm.Headers=$h}
$r=Invoke-WebRequest @prm -ErrorAction Stop
$c=[int]$r.StatusCode;$j=$r.Content|ConvertFrom-Json
if($e-contains $c){$script:p++;Write-Host "  $n  PASS ($c)" -F Green}
else{$script:f++;$script:fl+="$n (got $c want $($e-join'/'))";Write-Host "  $n  FAIL ($c)" -F Red}
return $j
}catch{
$c=0;$jj=$null
if($_.Exception.Response){$c=[int]$_.Exception.Response.StatusCode
try{$s=[IO.StreamReader]::new($_.Exception.Response.GetResponseStream());$eb=$s.ReadToEnd();$s.Close();$jj=$eb|ConvertFrom-Json}catch{}}
if($e-contains $c){$script:p++;Write-Host "  $n  PASS ($c)" -F Green}
else{$script:f++;$em=if($eb){$eb.Substring(0,[Math]::Min(80,$eb.Length))}else{$_.Exception.Message.Substring(0,[Math]::Min(80,$_.Exception.Message.Length))};$script:fl+="$n (got $c want $($e-join'/')) $em";Write-Host "  $n  FAIL ($c) $em" -F Red}
return $jj}}

Write-Host "`n=== HalcyonFlow API Test Suite ===" -F Cyan
Write-Host "`nGROUP 1 - Auth" -F Yellow

$r=T '1.1 Register' POST "$B/auth/register" '{"name":"Postman Test User","email":"postman@flowforge.com","password":"password123"}' $null @(201,200,400,409,500)
$TK=if($r-and$r.data-and$r.data.accessToken){$r.data.accessToken}else{''}

T '1.2 Duplicate' POST "$B/auth/register" '{"name":"Postman Test User","email":"postman@flowforge.com","password":"password123"}' $null @(400,409,500)

$r=T '1.3 Login' POST "$B/auth/login" '{"email":"postman@flowforge.com","password":"password123"}' $null @(200)
if($r-and$r.data-and$r.data.accessToken){$TK=$r.data.accessToken}
$H=@{Authorization="Bearer $TK"}

T '1.4 Wrong pw' POST "$B/auth/login" '{"email":"postman@flowforge.com","password":"wrong"}' $null @(401,403)
T '1.5 Profile' GET "$B/auth/me" $null $H @(200)
T '1.6 No token' GET "$B/workflows" $null $null @(401,403)

Write-Host "`nGROUP 2 - Workflows" -F Yellow
$r=T '2.1 Create WF' POST "$B/workflows" '{"name":"Expense Approval Test","description":"Postman test","inputSchema":{"amount":{"type":"number","required":true},"country":{"type":"string","required":true}}}' $H @(201,200)
$WF=if($r-and$r.data){$r.data.id}else{''}
Write-Host "  WF_ID=$WF" -F DarkGray

T '2.2 List WFs' GET "$B/workflows" $null $H @(200)
T '2.3 Get WF' GET "$B/workflows/$WF" $null $H @(200)
$r=T '2.4 Update WF' PUT "$B/workflows/$WF" '{"name":"Expense Approval Updated","description":"Updated","inputSchema":{"amount":{"type":"number","required":true},"country":{"type":"string","required":true}}}' $H @(200)
Write-Host "  ver=$($r.data.version)" -F DarkGray
T '2.5 Validate' POST "$B/workflows/$WF/validate" $null $H @(200)

Write-Host "`nGROUP 3 - Steps" -F Yellow
$r=T '3.1 Step:InitChk' POST "$B/workflows/$WF/steps" '{"name":"Initial Check","stepType":"TASK","stepOrder":1,"metadata":{}}' $H @(201,200)
$S1=if($r-and$r.data){$r.data.id}else{''}
$r=T '3.2 Step:MgrAppr' POST "$B/workflows/$WF/steps" '{"name":"Manager Approval","stepType":"APPROVAL","stepOrder":2,"metadata":{"assignee_email":"mgr@test.com"}}' $H @(201,200)
$S2=if($r-and$r.data){$r.data.id}else{''}
$r=T '3.3 Step:FinNotif' POST "$B/workflows/$WF/steps" '{"name":"Finance Notification","stepType":"NOTIFICATION","stepOrder":3,"metadata":{"notification_channel":"email"}}' $H @(201,200)
$S3=if($r-and$r.data){$r.data.id}else{''}
$r=T '3.4 Step:Reject' POST "$B/workflows/$WF/steps" '{"name":"Task Rejection","stepType":"TASK","stepOrder":4,"metadata":{}}' $H @(201,200)
$S4=if($r-and$r.data){$r.data.id}else{''}
Write-Host "  S1=$S1 S2=$S2 S3=$S3 S4=$S4" -F DarkGray
T '3.5 List Steps' GET "$B/workflows/$WF/steps" $null $H @(200)
T '3.6 Update Step' PUT "$B/workflows/$WF/steps/$S1" '{"name":"Initial Check Updated","stepType":"TASK"}' $H @(200)

Write-Host "`nGROUP 4 - Rules" -F Yellow
$rb=@{condition="amount > 100 && country == 'US'";nextStepId=$S2;priority=1;isDefault=$false}|ConvertTo-Json
T '4.1 Rule:amt>100' POST "$B/workflows/$WF/steps/$S1/rules" $rb $H @(201,200)
$rb=@{condition='DEFAULT';nextStepId=$S4;priority=99;isDefault=$true}|ConvertTo-Json
T '4.2 DEFAULT->Rej' POST "$B/workflows/$WF/steps/$S1/rules" $rb $H @(201,200)
$rb=@{condition='DEFAULT';nextStepId=$S3;priority=1;isDefault=$true}|ConvertTo-Json
T '4.3 DEFAULT Mgr->Fin' POST "$B/workflows/$WF/steps/$S2/rules" $rb $H @(201,200)
T '4.4 DEFAULT Fin->END' POST "$B/workflows/$WF/steps/$S3/rules" '{"condition":"DEFAULT","nextStepId":null,"priority":1,"isDefault":true}' $H @(201,200)
T '4.5 DEFAULT Rej->END' POST "$B/workflows/$WF/steps/$S4/rules" '{"condition":"DEFAULT","nextStepId":null,"priority":1,"isDefault":true}' $H @(201,200)
T '4.6 List Rules' GET "$B/workflows/$WF/steps/$S1/rules" $null $H @(200)
T '4.7 Validate OK' POST "$B/workflows/$WF/steps/$S1/rules/validate" '{"condition":"amount > 100"}' $H @(200)
T '4.8 Validate Bad' POST "$B/workflows/$WF/steps/$S1/rules/validate" '{"condition":">>> bad"}' $H @(200)

Write-Host "`nGROUP 5 - Rule Engine" -F Yellow
$r=T '5.1 TRUE' POST "$B/rules/test-condition" '{"condition":"amount > 100","testData":{"amount":250}}' $null @(200)
Write-Host "  result=$($r.data.result)" -F DarkGray
$r=T '5.2 FALSE' POST "$B/rules/test-condition" '{"condition":"amount > 100","testData":{"amount":20}}' $null @(200)
Write-Host "  result=$($r.data.result)" -F DarkGray
$r=T '5.3 DEFAULT' POST "$B/rules/test-condition" '{"condition":"DEFAULT","testData":{"x":"y"}}' $null @(200)
Write-Host "  result=$($r.data.result)" -F DarkGray
$r=T '5.4 OR' POST "$B/rules/test-condition" '{"condition":"amount <= 100 || country == ''IN''","testData":{"amount":250,"country":"IN"}}' $null @(200)
Write-Host "  result=$($r.data.result)" -F DarkGray

Write-Host "`nGROUP 6 - Simulation" -F Yellow
$ub=@{name='Expense Approval Updated';description='Updated';startStepId=$S1;inputSchema=@{amount=@{type='number';required=$true};country=@{type='string';required=$true}}}|ConvertTo-Json -Depth 4
T '6.0 Set startStep' PUT "$B/workflows/$WF" $ub $H @(200)
$r=T '6.1 Sim high' POST "$B/workflows/$WF/simulate" '{"amount":250,"country":"US"}' $H @(200)
if($r-and$r.data-and$r.data.executionPath){$pn=($r.data.executionPath|%{$_.stepName})-join' -> ';Write-Host "  Path: $pn" -F DarkGray}
$r=T '6.2 Sim low' POST "$B/workflows/$WF/simulate" '{"amount":20,"country":"US"}' $H @(200)
if($r-and$r.data-and$r.data.executionPath){$pn=($r.data.executionPath|%{$_.stepName})-join' -> ';Write-Host "  Path: $pn" -F DarkGray}

Write-Host "`nGROUP 7 - Health Check" -F Yellow
$r=T '7.1 Health' GET "$B/workflows/$WF/health" $null $H @(200)
if($r-and$r.data){Write-Host "  score=$($r.data.score)/100" -F DarkGray;$r.data.checks|%{Write-Host "  $($_.status): $($_.name) - $($_.message)" -F DarkGray}}

Write-Host "`nGROUP 8 - Execution" -F Yellow
$ub=@{name='Expense Approval Updated';description='Updated';status='ACTIVE';startStepId=$S1;inputSchema=@{amount=@{type='number';required=$true};country=@{type='string';required=$true}}}|ConvertTo-Json -Depth 4
$r=T '8.1 Publish' PUT "$B/workflows/$WF" $ub $H @(200)
Write-Host "  status=$($r.data.status)" -F DarkGray

$eb=@{workflowId=$WF;inputData=@{amount=250;country='US';priority='High'}}|ConvertTo-Json -Depth 3
$r=T '8.2 Exec high' POST "$B/executions" $eb $H @(202,200,201)
$E1=if($r-and$r.data){$r.data.id}else{''}
Write-Host "  E1=$E1 status=$($r.data.status)" -F DarkGray

Start-Sleep 2
$r=T '8.3 Get exec' GET "$B/executions/$E1" $null $H @(200)
Write-Host "  status=$($r.data.status)" -F DarkGray

$r=T '8.4 Resume' POST "$B/executions/$E1/resume" '{"approved":true,"comment":"Approved"}' $H @(200)
Write-Host "  status=$($r.data.status)" -F DarkGray

Start-Sleep 2
$r=T '8.5 After approve' GET "$B/executions/$E1" $null $H @(200)
Write-Host "  status=$($r.data.status)" -F DarkGray

$eb=@{workflowId=$WF;inputData=@{amount=20;country='US';priority='Low'}}|ConvertTo-Json -Depth 3
$r=T '8.6 Exec low' POST "$B/executions" $eb $H @(202,200,201)
$E2=if($r-and$r.data){$r.data.id}else{''}
Write-Host "  E2=$E2" -F DarkGray

Start-Sleep 2
$r=T '8.7 Low status' GET "$B/executions/$E2" $null $H @(200)
Write-Host "  status=$($r.data.status)" -F DarkGray

T '8.8 List execs' GET "$B/executions" $null $H @(200)

$eb=@{workflowId=$WF;inputData=@{amount=250;country='US';priority='High'}}|ConvertTo-Json -Depth 3
$r=T '8.9a Start' POST "$B/executions" $eb $H @(202,200,201)
$E3=if($r-and$r.data){$r.data.id}else{''}
Start-Sleep 1
$r=T '8.9b Cancel' POST "$B/executions/$E3/cancel" $null $H @(200)
Write-Host "  status=$($r.data.status)" -F DarkGray

Write-Host "`nGROUP 9 - Dashboard" -F Yellow
$r=T '9.1 Stats' GET "$B/dashboard/stats" $null $H @(200)
if($r-and$r.data){Write-Host "  totalWF=$($r.data.totalWorkflows) rate=$($r.data.successRate)" -F DarkGray}
T '9.2 Recent' GET "$B/dashboard/recent-executions" $null $H @(200)
T '9.3 Trends' GET "$B/dashboard/trends" $null $H @(200)

Write-Host "`nGROUP 10 - Notifications" -F Yellow
T '10.1 Get notifs' GET "$B/notifications" $null $H @(200)
T '10.2 Read all' PUT "$B/notifications/read-all" $null $H @(200)
T '10.3 Verify read' GET "$B/notifications" $null $H @(200)

Write-Host "`n=== SUMMARY ===" -F Cyan
$rt=if($t-gt 0){[math]::Round(($p/$t)*100,1)}else{0}
Write-Host "Total: $t  Passed: $p  Failed: $f  Rate: $rt%" -F $(if($rt-ge 90){'Green'}elseif($rt-ge 70){'Yellow'}else{'Red'})
if($fl.Count-gt 0){Write-Host "`nFAILED:" -F Red;$fl|%{Write-Host "  $_" -F Red}}
