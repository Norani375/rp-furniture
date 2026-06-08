/**
 * ERP Load Test Script
 * Simulates concurrent users accessing the API
 * Run: node test/load-test.js
 */

const http = require('http');

const API_URL = 'http://localhost:3001/api';
const TOKEN = 'erp-token';

// Test configuration
const CONFIG = {
  concurrentUsers: 50,
  requestsPerUser: 20,
  delayBetweenRequests: 50, // ms
};

let stats = {
  totalRequests: 0,
  success: 0,
  failed: 0,
  responseTimes: [],
  startTime: 0,
  endTime: 0,
};

// Endpoints to test (weighted by real usage)
const ENDPOINTS = [
  { method: 'GET', path: '/health', weight: 10 },
  { method: 'GET', path: '/inventory', weight: 20 },
  { method: 'GET', path: '/transactions', weight: 15 },
  { method: 'GET', path: '/customers', weight: 10 },
  { method: 'GET', path: '/installments', weight: 10 },
  { method: 'GET', path: '/stats', weight: 15 },
  { method: 'POST', path: '/transactions', weight: 10, body: {
    id: `TEST-${Date.now()}-${Math.random()}`,
    date: new Date().toISOString().slice(0, 10),
    type: 'sale',
    status: 'confirmed',
    title: 'Load Test Sale',
    description: 'Automated load test',
    debit: 10000,
    credit: 0,
    balance: 10000,
    ref_type: 'test',
    ref_id: 'load-test',
    created_by: 'load-test',
  }},
];

function pickEndpoint() {
  const total = ENDPOINTS.reduce((s, e) => s + e.weight, 0);
  let rand = Math.random() * total;
  for (const endpoint of ENDPOINTS) {
    rand -= endpoint.weight;
    if (rand <= 0) return endpoint;
  }
  return ENDPOINTS[0];
}

async function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(API_URL + endpoint.path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        stats.totalRequests++;
        stats.responseTimes.push(responseTime);
        if (res.statusCode >= 200 && res.statusCode < 400) {
          stats.success++;
          resolve({ success: true, responseTime, status: res.statusCode });
        } else {
          stats.failed++;
          resolve({ success: false, responseTime, status: res.statusCode, error: data.slice(0, 100) });
        }
      });
    });

    req.on('error', (err) => {
      const responseTime = Date.now() - startTime;
      stats.totalRequests++;
      stats.failed++;
      stats.responseTimes.push(responseTime);
      resolve({ success: false, responseTime, error: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      stats.totalRequests++;
      stats.failed++;
      stats.responseTimes.push(responseTime);
      resolve({ success: false, responseTime, error: 'Timeout' });
    });

    if (endpoint.body && endpoint.method === 'POST') {
      req.write(JSON.stringify(endpoint.body));
    }

    req.end();
  });
}

async function simulateUser(userId) {
  for (let i = 0; i < CONFIG.requestsPerUser; i++) {
    const endpoint = pickEndpoint();
    const result = await makeRequest(endpoint);
    if (!result.success) {
      console.log(`  [User ${userId}] ❌ ${endpoint.method} ${endpoint.path} - ${result.status || result.error}`);
    }
    await new Promise((r) => setTimeout(r, CONFIG.delayBetweenRequests));
  }
}

async function runTest() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   🚀 ERP Load Test Starting...            ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log(`Configuration:`);
  console.log(`  Concurrent users: ${CONFIG.concurrentUsers}`);
  console.log(`  Requests per user: ${CONFIG.requestsPerUser}`);
  console.log(`  Total requests: ${CONFIG.concurrentUsers * CONFIG.requestsPerUser}`);
  console.log(`  Delay between requests: ${CONFIG.delayBetweenRequests}ms\n`);

  // Health check first
  console.log('Testing connection...');
  const healthCheck = await makeRequest({ method: 'GET', path: '/health' });
  if (!healthCheck.success) {
    console.error('❌ Cannot connect to backend. Make sure server is running on port 3001');
    console.error('   Run: node server/index.js');
    process.exit(1);
  }
  console.log('✅ Backend is responding\n');

  stats.startTime = Date.now();
  console.log('Starting load test...\n');

  // Launch concurrent users
  const users = [];
  for (let i = 0; i < CONFIG.concurrentUsers; i++) {
    users.push(simulateUser(i + 1));
  }

  await Promise.all(users);
  stats.endTime = Date.now();

  // Calculate stats
  const duration = (stats.endTime - stats.startTime) / 1000;
  const avgResponse = stats.responseTimes.reduce((s, t) => s + t, 0) / stats.responseTimes.length;
  const maxResponse = Math.max(...stats.responseTimes);
  const minResponse = Math.min(...stats.responseTimes);
  const p95Response = stats.responseTimes.sort((a, b) => a - b)[Math.floor(stats.responseTimes.length * 0.95)];
  const successRate = (stats.success / stats.totalRequests) * 100;
  const rps = stats.totalRequests / duration;

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   📊 Load Test Results                     ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log(`Duration:           ${duration.toFixed(2)} seconds`);
  console.log(`Total Requests:     ${stats.totalRequests}`);
  console.log(`Successful:         ${stats.success} (${successRate.toFixed(1)}%)`);
  console.log(`Failed:             ${stats.failed}`);
  console.log(`Requests/sec:       ${rps.toFixed(1)}`);
  console.log(`\nResponse Times:`);
  console.log(`  Average:          ${avgResponse.toFixed(0)}ms`);
  console.log(`  Median:           ${stats.responseTimes.sort((a, b) => a - b)[Math.floor(stats.responseTimes.length / 2)]}ms`);
  console.log(`  P95:              ${p95Response}ms`);
  console.log(`  Min:              ${minResponse}ms`);
  console.log(`  Max:              ${maxResponse}ms`);

  // Verdict
  console.log('\n═══════════════════════════════════════════');
  if (successRate >= 95 && avgResponse < 500) {
    console.log('✅ RESULT: EXCELLENT - System can handle load');
  } else if (successRate >= 90 && avgResponse < 1000) {
    console.log('⚠️  RESULT: GOOD - Some performance issues');
  } else if (successRate >= 80) {
    console.log('⚠️  RESULT: FAIR - Consider optimization');
  } else {
    console.log('❌ RESULT: POOR - System needs scaling');
  }
  console.log('═══════════════════════════════════════════\n');
}

runTest().catch(console.error);
