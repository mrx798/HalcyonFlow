const fs = require('fs');

const BASE_URL = 'http://localhost:8080/api/v1';
let token = '';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchApi(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 204) {
        return null;
    }
    
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`Failed to parse JSON. Status: ${response.status}. Body: ${text}`);
    }
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${JSON.stringify(data)}`);
    }
    return data.data || data;
}

async function authenticate() {
    console.log('Authenticating...');
    const credentials = { email: 'admin2@flowforge.com', password: 'password' };
    
    try {
        const res = await fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        token = res.accessToken;
        console.log('Logged in successfully');
    } catch (e) {
        console.log('Login failed, trying to register...');
        const res = await fetchApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name: 'shah', ...credentials })
        });
        token = res.accessToken;
        console.log('Registered successfully');
    }
}

async function createWorkflow() {
    console.log('\n--- Creating Workflow ---');
    const workflow = await fetchApi('/workflows', {
        method: 'POST',
        body: JSON.stringify({
            name: 'Complete Expense Approval Workflow ' + Date.now(),
            description: 'Testing the full expense approval chain',
            inputSchema: {
                amount: { type: 'number', required: true },
                country: { type: 'string', required: true }
            }
        })
    });
    console.log('Workflow created:', workflow.id);
    return workflow.id;
}

async function createSteps(workflowId) {
    console.log('\n--- Creating Steps ---');
    const stepsData = [
        { name: 'Initial Check', stepType: 'TASK', metadata: { action: 'validate_receipt' } },
        { name: 'Manager Approval', stepType: 'APPROVAL', metadata: { assignee: 'shah@flowforge.com' } },
        { name: 'Finance Notification', stepType: 'NOTIFICATION', metadata: { message: 'Approved by Manager, pending CEO' } },
        { name: 'CEO Approval', stepType: 'APPROVAL', metadata: { assignee: 'shah@flowforge.com' } },
        { name: 'Task Rejection', stepType: 'TASK', metadata: { action: 'reject_expense' } }
    ];

    const steps = {};
    for (let i = 0; i < stepsData.length; i++) {
        const step = await fetchApi(`/workflows/${workflowId}/steps`, {
            method: 'POST',
            body: JSON.stringify({ ...stepsData[i], stepOrder: i + 1 })
        });
        steps[step.name] = step.id;
        console.log(`Created step: ${step.name} (${step.id})`);
    }
    
    return steps;
}

async function createRules(workflowId, steps) {
    console.log('\n--- Creating Rules ---');
    
    // Initial Check Rules
    await fetchApi(`/workflows/${workflowId}/steps/${steps['Initial Check']}/rules`, {
        method: 'POST',
        body: JSON.stringify({ condition: "amount > 100 && country == 'US'", nextStepId: steps['Manager Approval'], priority: 1, isDefault: false })
    });
    await fetchApi(`/workflows/${workflowId}/steps/${steps['Initial Check']}/rules`, {
        method: 'POST',
        body: JSON.stringify({ condition: 'DEFAULT', nextStepId: steps['Task Rejection'], priority: 2, isDefault: true })
    });

    // Manager Approval Rule
    await fetchApi(`/workflows/${workflowId}/steps/${steps['Manager Approval']}/rules`, {
        method: 'POST',
        body: JSON.stringify({ condition: 'DEFAULT', nextStepId: steps['Finance Notification'], priority: 1, isDefault: true })
    });

    // Finance Notification Rule
    await fetchApi(`/workflows/${workflowId}/steps/${steps['Finance Notification']}/rules`, {
        method: 'POST',
        body: JSON.stringify({ condition: 'DEFAULT', nextStepId: steps['CEO Approval'], priority: 1, isDefault: true })
    });

    // CEO Approval Rule
    await fetchApi(`/workflows/${workflowId}/steps/${steps['CEO Approval']}/rules`, {
        method: 'POST',
        body: JSON.stringify({ condition: 'DEFAULT', nextStepId: null, priority: 1, isDefault: true })
    });

    // Task Rejection Rule
    await fetchApi(`/workflows/${workflowId}/steps/${steps['Task Rejection']}/rules`, {
        method: 'POST',
        body: JSON.stringify({ condition: 'DEFAULT', nextStepId: null, priority: 1, isDefault: true })
    });
    
    console.log('All rules created successfully');
}

async function waitForExecutionStatus(executionId, targetStatuses, maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
        await delay(1000); // 1 sec delay
        const exec = await fetchApi(`/executions/${executionId}`);
        if (targetStatuses.includes(exec.status)) {
            return exec;
        }
        if (exec.status === 'FAILED') {
            throw new Error(`Execution failed: ${exec.errorMessage}`);
        }
    }
    throw new Error(`Execution did not reach ${targetStatuses.join(' or ')} in time`);
}

function printExecutionLogs(logs) {
    console.log('\n================ EXECUTION LOGS ================');
    if (!logs || logs.length === 0) {
        console.log('No logs available.');
        return;
    }
    
    logs.forEach((logEntry, index) => {
        if (!logEntry.stepId) return; // Skip non-step logs
        
        console.log(`\n[Step ${index + 1}] ${logEntry.step_name}`);
        
        const rules = logEntry.evaluated_rules || logEntry.evaluatedRules || [];
        if (rules.length > 0) {
            rules.forEach(rule => {
                const mark = rule.result ? '✅' : '❌';
                // rule conditions are sometimes under 'rule' or 'condition'
                const conditionStr = rule.rule || rule.condition || 'DEFAULT';
                console.log(`  ${mark} ${conditionStr} → ${rule.result}`);
            });
        }
        
        const nextStep = logEntry.selected_next_step || logEntry.selectedNextStep || 'End Workflow';
        console.log(`  Next Step: ${nextStep}`);
        
        if (logEntry.approverName) {
            console.log(`  Approver: ${logEntry.approverName}`);
        }
        
        if (logEntry.started_at && logEntry.endedAt || logEntry.ended_at) {
             const start = new Date(logEntry.started_at);
             const end = new Date(logEntry.endedAt || logEntry.ended_at);
             const diffStr = new Date(end - start).toISOString().slice(11,19);
             console.log(`  Duration: ${diffStr}`);
        }
    });
    console.log('\nStatus: COMPLETED ✅');
    console.log('================================================\n');
}

async function testA(workflowId, steps) {
    console.log('\n--- Test A: High amount (Full Approval Chain) ---');
    const execution = await fetchApi('/executions', {
        method: 'POST',
        body: JSON.stringify({ workflowId, inputData: { amount: 250, country: 'US' } })
    });
    const execId = execution.id;
    console.log('Started execution:', execId);

    // Wait for Manager Approval
    let exec = await waitForExecutionStatus(execId, ['PAUSED']);
    console.log(`Execution paused at: ${exec.currentStepName}`);
    
    // Approve Manager Approval
    console.log('Approving Manager step...');
    await fetchApi(`/executions/${execId}/resume`, {
        method: 'POST',
        body: JSON.stringify({ approved: true, comment: 'Looks good by manager' })
    });
    
    // Wait for CEO Approval
    exec = await waitForExecutionStatus(execId, ['PAUSED']);
    console.log(`Execution paused at: ${exec.currentStepName}`);
    
    // Approve CEO Approval
    console.log('Approving CEO step...');
    await fetchApi(`/executions/${execId}/resume`, {
        method: 'POST',
        body: JSON.stringify({ approved: true, comment: 'Approved by CEO' })
    });
    
    // Wait for completion
    exec = await waitForExecutionStatus(execId, ['COMPLETED']);
    printExecutionLogs(exec.logs);
}

async function testB(workflowId, steps) {
    console.log('\n--- Test B: Low amount (Direct Rejection) ---');
    const execution = await fetchApi('/executions', {
        method: 'POST',
        body: JSON.stringify({ workflowId, inputData: { amount: 20, country: 'US' } })
    });
    const execId = execution.id;
    console.log('Started execution:', execId);

    // Wait for completion
    const exec = await waitForExecutionStatus(execId, ['COMPLETED']);
    printExecutionLogs(exec.logs);
}

async function run() {
    try {
        await authenticate();
        const workflowId = await createWorkflow();
        const steps = await createSteps(workflowId);
        await createRules(workflowId, steps);
        
        await testA(workflowId, steps);
        await testB(workflowId, steps);
        
        console.log('All tests passed successfully!');
    } catch (e) {
        console.log('\nERROR MESSAGE: ' + e.message);
    }
}

run();
