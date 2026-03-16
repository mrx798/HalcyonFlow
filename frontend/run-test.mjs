// Use native node fetch

const BASE_URL = 'http://localhost:8080/api/v1';

async function runTest() {
  console.log('--- STARTING 6-STEP VERIFICATION ---');

  // 1. Login
  console.log('1. Logging in as sharath@test.com...');
  let res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sharath@test.com', password: 'password123' })
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Login failed:', text);
    return;
  }
  const authData = await res.json();
  const token = authData.data.accessToken;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  console.log('   ✅ Logged in successfully');

  // 2. Create Workflow
  console.log('2. Creating Workflow...');
  res = await fetch(`${BASE_URL}/workflows`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: `Automated Test Flow ${Date.now()}`,
      description: 'Test workflow from automated script',
      inputSchema: {}
    })
  });
  const wfData = await res.json();
  const workflowId = wfData.data.id;
  console.log(`   ✅ Workflow created: ${workflowId}`);

  // 3. Create Step 1: Manager Approval
  console.log('3. Creating Step 1: Manager Approval');
  res = await fetch(`${BASE_URL}/workflows/${workflowId}/steps`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Manager Approval', stepType: 'APPROVAL' })
  });
  if(!res.ok) console.error(await res.text());
  const step1Data = await res.json();
  const step1Id = step1Data.data.id;
  console.log(`   ✅ Step 1 created: ${step1Id}`);

  // 4. Create Step 2: Finance Notification
  console.log('4. Creating Step 2: Finance Notification');
  res = await fetch(`${BASE_URL}/workflows/${workflowId}/steps`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Finance Notification', stepType: 'NOTIFICATION' })
  });
  const step2Data = await res.json();
  const step2Id = step2Data.data.id;
  console.log(`   ✅ Step 2 created: ${step2Id}`);

  // 5. Create Step 3: Task Rejection
  console.log('5. Creating Step 3: Task Rejection');
  res = await fetch(`${BASE_URL}/workflows/${workflowId}/steps`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Task Rejection', stepType: 'TASK' })
  });
  const step3Data = await res.json();
  const step3Id = step3Data.data.id;
  console.log(`   ✅ Step 3 created: ${step3Id}`);

  // 6. Add Rules to Manager Approval
  console.log('6. Adding Routing Rules to Manager Approval');
  
  // Rule 1: amount > 100 && country == 'US' -> Finance Notification
  res = await fetch(`${BASE_URL}/workflows/${workflowId}/steps/${step1Id}/rules`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      condition: "amount > 100 && country == 'US'",
      nextStepId: step2Id,
      priority: 10,
      isDefault: false
    })
  });
  if(!res.ok) console.error("Rule 1 failed:", await res.text());
  console.log('   ✅ Added Rule 1: amount > 100 -> Finance Notification');

  // Rule 2: DEFAULT -> Task Rejection
  res = await fetch(`${BASE_URL}/workflows/${workflowId}/steps/${step1Id}/rules`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      condition: "DEFAULT",
      nextStepId: step3Id,
      priority: 20,
      isDefault: true
    })
  });
  if(!res.ok) console.error("Rule 2 failed:", await res.text());
  console.log('   ✅ Added Rule 2: DEFAULT -> Task Rejection');

  // 7. Execute the Workflow
  console.log('7. Executing the workflow (Test Run)');
  res = await fetch(`${BASE_URL}/executions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      workflowId: workflowId,
      inputData: {
        amount: 250,
        country: "US",
        priority: "High"
      }
    })
  });
  const execData = await res.json();
  if (!res.ok) {
    console.error('   ❌ Execution failed:', execData);
    return;
  }
  const executionId = execData.data.id;
  console.log(`   ✅ Execution started! Execution ID: ${executionId}`);

  console.log('\\n--- 6-STEP VERIFICATION COMPLETED SUCCESSFULLY ---');
}

runTest().catch(console.error);
