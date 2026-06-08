/**
 * Load Test & Stress Test for ERP API
 * Run: node tests/load-test.js
 *
 * Tests:
 *  1. Concurrent requests on heavy endpoints
 *  2. DB query latency under load
 *  3. Memory usage
 *  4. Error rate
 */

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';
let TOKEN = '';

const colors = { green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m', cyan:'\x1b[36m', reset:'\x1b[0m' };
const log = (c, msg) => console.log(`${colors[c]}${msg}${colors.reset}`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function apiCall(method, path, body) {
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type':'application/json', ...(TOKEN && { Authorization:`Bearer ${TOKEN}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { ok: res.ok, status: res.status, latency: Date.now() - start };
  } catch (err) {
    return { ok: false, status: 0, latency: Date.now() - start, error: err.message };
  }
}

async function loginAsAdmin() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ email:'admin@erp.com', password:'admin123' }),
  });
  const data = await res.json();
  if (data?.data?.token) { TOKEN = data.data.token; log('green', '✅ Login successful'); }
  else { log('red', '❌ Login failed'); process.exit(1); }
}

async function runConcurrent(name, fn, concurrency = 50, iterations = 5) {
  log('cyan', `\n[TEST] ${name} — ${concurrency} concurrent × ${iterations} rounds`);
  const allLatencies = [];
  let success = 0, fail = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const tasks = Array.from({ length: concurrency }, () => fn());
    const results = await Promise.all(tasks);
    results.forEach(r => {
      allLatencies.push(r.latency);
      if (r.ok) success++; else fail++;
    });
    process.stdout.write('.');
  }

  const sorted = allLatencies.sort((a,b) => a-b);
  const avg = allLatencies.reduce((a,b) => a+b, 0) / allLatencies.length;
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const maxLat = sorted[sorted.length - 1];
  const total = success + fail;
  const errorRate = (fail / total * 100).toFixed(1);

  console.log('');
  console.log(`  Total:     ${total}`);
  console.log(`  Success:   ${success} (${(success/total*100).toFixed(1)}%)`);
  console.log(`  Fail:      ${fail} (${errorRate}%)`);
  console.log(`  Avg ms:    ${avg.toFixed(1)}`);
  console.log(`  P95 ms:    ${p95}`);
  console.log(`  P99 ms:    ${p99}`);
  console.log(`  Max ms:    ${maxLat}`);

  const passed = p95 < 500 && parseFloat(errorRate) < 5;
  if (passed) log('green', `  ✅ PASSED`);
  else        log('red',   `  ❌ FAILED (P95 > 500ms or error rate > 5%)`);
  return { name, avg, p95, p99, maxLat, success, fail, errorRate, passed };
}

async function securityTest(name, fn, expectedStatus) {
  log('cyan', `\n[SECURITY] ${name}`);
  const result = await fn();
  const passed = result.status === expectedStatus;
  if (passed) log('green', `  ✅ Got ${result.status} (expected ${expectedStatus})`);
  else        log('red',   `  ❌ Got ${result.status} (expected ${expectedStatus})`);
  return passed;
}

async function main() {
  log('cyan', '============================================================');
  log('cyan', '  ERP SYSTEM — Load Test & Security Test');
  log('cyan', '============================================================');

  // ── Login ────────────────────────────────────────────────
  await loginAsAdmin();

  const results = [];

  // ── Load Tests ───────────────────────────────────────────
  results.push(await runConcurrent(
    'GET /api/inventory (read-heavy)',
    () => apiCall('GET', '/api/inventory'),
    50, 5
  ));

  results.push(await runConcurrent(
    'GET /api/reports/dashboard (materialized view)',
    () => apiCall('GET', '/api/reports/dashboard'),
    30, 5
  ));

  results.push(await runConcurrent(
    'GET /api/customers (indexed query)',
    () => apiCall('GET', '/api/customers'),
    40, 5
  ));

  results.push(await runConcurrent(
    'GET /api/search?q=تخته (full-text search)',
    () => apiCall('GET', '/api/search?q=تخته'),
    30, 3
  ));

  results.push(await runConcurrent(
    'GET /api/installments (JOIN heavy)',
    () => apiCall('GET', '/api/installments'),
    20, 3
  ));

  // ── Security Tests ────────────────────────────────────────
  log('cyan', '\n=== SECURITY TESTS ===');
  const savedToken = TOKEN;

  const secResults = [];
  secResults.push(await securityTest(
    'Unauthenticated request → 401',
    () => { TOKEN=''; return apiCall('GET', '/api/inventory'); },
    401
  ));
  TOKEN = savedToken;

  secResults.push(await securityTest(
    'Invalid token → 401',
    () => { TOKEN='bad.token.here'; return apiCall('GET', '/api/inventory'); },
    401
  ));
  TOKEN = savedToken;

  secResults.push(await securityTest(
    'SQL injection attempt → 400 or 200 (no crash)',
    () => apiCall('GET', "/api/search?q=' OR '1'='1"),
    200
  ));

  secResults.push(await securityTest(
    'Health check (public) → 200',
    () => { TOKEN=''; return apiCall('GET', '/api/health'); },
    200
  ));
  TOKEN = savedToken;

  // ── Memory Usage ─────────────────────────────────────────
  const mem = process.memoryUsage();
  log('cyan', '\n=== MEMORY USAGE (test process) ===');
  console.log(`  Heap Used:  ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  RSS:        ${(mem.rss / 1024 / 1024).toFixed(1)} MB`);

  // ── Summary ───────────────────────────────────────────────
  log('cyan', '\n=== SUMMARY ===');
  const passed = results.filter(r => r.passed).length;
  const secPassed = secResults.filter(Boolean).length;
  log(passed === results.length ? 'green' : 'yellow',
    `Load Tests:     ${passed}/${results.length} passed`);
  log(secPassed === secResults.length ? 'green' : 'red',
    `Security Tests: ${secPassed}/${secResults.length} passed`);
}

main().catch(err => { log('red', `Fatal: ${err.message}`); process.exit(1); });
