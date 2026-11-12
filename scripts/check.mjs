#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const win = process.platform === 'win32';
const results = [];
const PROJECT = 'node26-interview-precheck';
const COMPOSE = ['compose', '-p', PROJECT, '-f', 'compose.yaml'];
const EXPECTED = [
  { customerId: 1, customerName: 'Ada', orderCount: 2, totalCents: 3000 },
  { customerId: 2, customerName: 'Grace', orderCount: 1, totalCents: 4900 }
];
const npmBin = 'npm';
let server = null;
let composeAttempted = false;
let serverLog = '';

function execute(command, args = [], timeout = 25000) {
  const res = spawnSync(command, args, {
    cwd: root,
    shell: win,
    encoding: 'utf8',
    maxBuffer: 6 * 1024 * 1024,
    timeout,
    windowsHide: true,
    env: { ...process.env, CI: '1' }
  });
  return {
    ok: !res.error && res.status === 0,
    text: [res.stdout, res.stderr, res.error?.message].filter(Boolean).join('\n').trim(),
    code: res.status,
    timedOut: res.error?.code === 'ETIMEDOUT'
  };
}
function ok(label, info = '') {
  results.push({ status: 'ok', label });
  console.log(`✓ ${label}${info ? ` — ${info}` : ''}`);
}
function fail(label, help, detail = '') {
  results.push({ status: 'fail', label });
  console.log(`✗ ${label}`);
  console.log(`  HOW TO FIX: ${help}`);
  if (detail) {
    console.log(`  Details: ${detail.slice(0, 800).replace(/\s+/g, ' ')}`);
  }
}
function warn(label, advice) {
  console.log(`! ${label}: ${advice}`);
}
function compact(text) {
  return text.trim().split(/\r?\n/).slice(-8).join(' | ');
}
function readyForLongChecks() {
  return !results.some((r) => r.status === 'fail');
}
function checkTool(label, command, args, fix, pattern = null) {
  const r = execute(command, args);
  if (!r.ok || (pattern && !pattern.test(r.text))) {
    fail(label, fix, compact(r.text));
    return false;
  }
  ok(label, compact(r.text).slice(0, 100));
  return true;
}
function detectDependencyVersion(name) {
  try {
    return JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
  } catch {
    return null;
  }
}
function versionsAreCompatible() {
  const expected = [
    ['@nestjs/core', /^11\./],
    ['@nestjs/typeorm', /^11\./],
    ['typescript', /^5\.9\./],
    ['typeorm', /^0\.3\./],
    ['pg', /^8\./]
  ];
  const problems = expected
    .map(([name, regex]) => ({ name, regex, version: detectDependencyVersion(name) }))
    .filter((entry) => !entry.version || !entry.regex.test(entry.version));
  if (problems.length) {
    fail(
      'Dependency versions',
      'Run npm install, then npm run check. If necessary, delete node_modules and try again.',
      problems.map(({ name, version }) => `${name}: ${version ?? 'missing'}`).join(', ')
    );
    return false;
  }
  ok('NestJS 11 / TypeScript 5.9 / TypeORM 0.3 / pg 8');
  return true;
}
function dependencyCheck() {
  if (!detectDependencyVersion('@nestjs/core') || !detectDependencyVersion('typescript') || !detectDependencyVersion('pg')) {
    console.log('· Missing npm dependencies: running npm install ...');
    const res = execute(npmBin, ['install', '--no-audit', '--no-fund'], 300000);
    if (!res.ok) {
      fail('npm dependency installation', 'Check your Internet connection, proxy settings, and access to registry.npmjs.org, then try again.', compact(res.text));
      return false;
    }
  }
  ok('npm dependencies installed');
  return versionsAreCompatible();
}
function diagnosticForDocker(text) {
  if (/port is already allocated|address already in use|bind.*failed|55432.*in use/i.test(text)) {
    return 'Local port 55432 is already in use. Identify the process or container using the port and free it.';
  }
  if (/pull access denied|toomanyrequests|TLS|network|timeout|proxy|x509|connection refused/i.test(text)) {
    return 'Check your Internet connection, proxy/VPN settings, and access to Docker Hub, then try again.';
  }
  return 'Start Docker Desktop, run docker info, and try again. See docs/TROUBLESHOOTING.md.';
}
async function startNestServer() {
  return new Promise((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => settle(new Error('NestJS startup timed out (30 seconds)')), 30000);
    function settle(value) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (value instanceof Error) reject(value);
      else resolve(value);
    }
    server = spawn(process.execPath, ['dist/main.js'], {
      cwd: root,
      shell: false,
      env: { ...process.env, PORT: '0', DB_HOST: '127.0.0.1', DB_PORT: '55432' },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    server.stdout.on('data', (chunk) => {
      serverLog += chunk.toString();
      const match = serverLog.match(/PRECHECK_READY (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) settle(match[1]);
    });
    server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });
    server.on('error', (err) => settle(err));
    server.on('exit', (code) => settle(new Error(`The server exited (code ${code}). ${compact(serverLog)}`)));
  });
}
async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} at ${url}: ${body.slice(0, 600)}`);
  }
  try { return JSON.parse(body); }
  catch { throw new Error(`Non-JSON response from ${url}: ${body.slice(0, 300)}`); }
}
async function stopServer() {
  if (!server || server.exitCode !== null) return;
  const proc = server;
  await new Promise((resolve) => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; resolve(); } };
    proc.once('exit', done);
    proc.kill('SIGTERM');
    setTimeout(() => { if (!settled) { proc.kill('SIGKILL'); done(); } }, 4000).unref();
  });
}
async function main() {
  console.log('\n=== NODE BACKEND — ENVIRONMENT PRECHECK ===\n');
  console.log('Prerequisite checks:\n');

  if (process.versions.node.split('.')[0] === '26') ok('Node.js 26.x', process.version);
  else fail('Node.js 26.x', 'Install Node.js 26 from https://nodejs.org/ and reopen your terminal.', `Detected ${process.version}`);

  checkTool('npm available', npmBin, ['--version'], 'Reinstall Node.js with npm and reopen your terminal.');
  checkTool('Git available', 'git', ['--version'], 'Install Git from https://git-scm.com/downloads and reopen your terminal.');
  const dockerCli = checkTool('Docker CLI', 'docker', ['--version'], 'Install Docker Desktop or Docker Engine from https://docs.docker.com/get-docker/.');
  if (dockerCli) {
    checkTool('Docker Engine running', 'docker', ['info', '--format', '{{.ServerVersion}}'], 'Start Docker Desktop or the Docker service, then run docker info.');
    checkTool('Docker Compose v2', 'docker', ['compose', 'version', '--short'], 'Install or update Docker Compose v2 and run docker compose version.', /^v?2\./);
  } else {
    fail('Docker Engine running', 'Docker CLI is missing: install and start Docker Desktop or Docker Engine.');
    fail('Docker Compose v2', 'Install Docker with the Compose v2 plugin.');
  }
  const code = execute('code', ['--version'], 8000);
  if (code.ok) ok('VS Code CLI detected (optional)');
  else warn('VS Code', 'Not detected from the terminal. Open it manually; this does not block the precheck.');

  if (!readyForLongChecks()) return;
  console.log('\nApplication checks:\n');
  if (!dependencyCheck()) return;

  composeAttempted = true;
  const up = execute('docker', [...COMPOSE, 'up', '-d', '--wait', '--wait-timeout', '90', 'db'], 300000);
  if (!up.ok) {
    fail('PostgreSQL ready (Docker)', diagnosticForDocker(up.text), compact(up.text));
    return;
  }
  ok('PostgreSQL ready (Docker)', 'localhost:55432');

  const build = execute(npmBin, ['run', 'build'], 90000);
  if (!build.ok) {
    fail('TypeScript compilation', 'Review the compilation error and reinstall dependencies if necessary.', compact(build.text));
    return;
  }
  ok('TypeScript compilation');

  let url;
  try { url = await startNestServer(); }
  catch (error) {
    fail('NestJS startup', 'Check Docker, TypeORM, and the server startup log.', compact(String(error)));
    return;
  }

  try {
    const health = await getJson(`${url}/health`);
    if (health.status !== 'ok' || health.framework !== 'NestJS') {
      throw new Error(`Unexpected health response: ${JSON.stringify(health)}`);
    }
    ok('NestJS running and HTTP responding');
  } catch (error) {
    fail('NestJS running and HTTP responding', 'Check that NestJS is responding and review the logs.', String(error));
    return;
  }
  try {
    const joined = await getJson(`${url}/join`);
    if (joined.status !== 'ok' || JSON.stringify(joined.rows) !== JSON.stringify(EXPECTED)) {
      throw new Error(`Incorrect JOIN results: ${JSON.stringify(joined.rows)}`);
    }
    ok('TypeORM: JOIN customers + purchases', 'Ada: 2/3000, Grace: 1/4900');
  } catch (error) {
    fail('TypeORM: JOIN customers + purchases', 'Check the PostgreSQL connection, entity mappings, and SQL query.', String(error));
  }
}

try {
  await main();
} catch (error) {
  fail('Unexpected error', 'See docs/TROUBLESHOOTING.md and review the error details.', String(error));
} finally {
  await stopServer();
  if (composeAttempted) {
    const down = execute('docker', [...COMPOSE, 'down', '--volumes', '--remove-orphans'], 30000);
    if (!down.ok) warn('Docker cleanup', `Not completed. Run: docker ${COMPOSE.join(' ')} down --volumes`);
  }
  console.log('\n' + '='.repeat(52));
  const failures = results.filter((result) => result.status === 'fail');
  if (failures.length === 0 && results.some((result) => result.label.includes('JOIN'))) {
    console.log('✓ READY FOR INTERVIEW');
    console.log('  Environment verified: Node 26, Docker, NestJS, TypeScript, TypeORM, and SQL JOIN.');
  } else {
    console.log(`✗ NOT READY — ${failures.length} failed check(s)`);
    console.log('  Fix the issues listed above and run npm run check again');
    process.exitCode = 1;
  }
  console.log('='.repeat(52) + '\n');
}
