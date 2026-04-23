#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextBin = path.join(repoDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const mode = process.argv[2] ?? 'status';
const host = process.env.OFFROADY_HOST || '127.0.0.1';
const port = String(process.env.OFFROADY_PORT || '3000');
const repoRegex = escapeRegex(repoDir);

if (!['clean', 'status', 'dev', 'start'].includes(mode)) {
  console.error(`Unknown mode: ${mode}`);
  console.error('Usage: node scripts/offroady-local-runtime.mjs <clean|status|dev|start>');
  process.exit(1);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeJsonArray(raw) {
  if (!raw || !raw.trim()) return [];
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  return parsed ? [parsed] : [];
}

function runChecked(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoDir,
    stdio: 'pipe',
    encoding: 'utf8',
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.status}${stderr ? `\n${stderr}` : stdout ? `\n${stdout}` : ''}`);
  }

  return result.stdout ?? '';
}

function listWindowsProcesses() {
  const script = `
$repo = '${repoRegex}'
Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq 'node.exe' -and
    $_.CommandLine -match $repo -and
    ($_.CommandLine -match 'next|start-server\\.js|\\.next\\\\dev')
  } |
  Select-Object ProcessId, CommandLine |
  Sort-Object ProcessId |
  ConvertTo-Json -Depth 3
`;
  return normalizeJsonArray(runChecked('powershell', ['-NoProfile', '-Command', script]));
}

function listPosixProcesses() {
  const stdout = runChecked('ps', ['-ax', '-o', 'pid=,command=']);
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      return match ? { ProcessId: Number(match[1]), CommandLine: match[2] } : null;
    })
    .filter(Boolean)
    .filter((proc) => proc.CommandLine.includes(repoDir) && /(next|start-server\.js|\.next\/dev)/.test(proc.CommandLine));
}

function listProcesses() {
  return process.platform === 'win32' ? listWindowsProcesses() : listPosixProcesses();
}

function getWindowsPortListeners(targetPort) {
  const script = `
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -eq ${Number(targetPort)} } |
  Select-Object LocalAddress, LocalPort, OwningProcess |
  Sort-Object OwningProcess |
  ConvertTo-Json -Depth 3
`;
  return normalizeJsonArray(runChecked('powershell', ['-NoProfile', '-Command', script]));
}

function getPosixPortListeners(targetPort) {
  const stdout = runChecked('lsof', ['-nP', `-iTCP:${targetPort}`, '-sTCP:LISTEN']);
  return stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const columns = line.split(/\s+/);
      return {
        LocalAddress: columns[8] ?? '',
        LocalPort: Number(targetPort),
        OwningProcess: Number(columns[1]),
      };
    });
}

function getPortListeners(targetPort) {
  try {
    return process.platform === 'win32' ? getWindowsPortListeners(targetPort) : getPosixPortListeners(targetPort);
  } catch {
    return [];
  }
}

function killProcesses(processesToKill) {
  if (!processesToKill.length) return;

  if (process.platform === 'win32') {
    const ids = processesToKill.map((proc) => proc.ProcessId).join(',');
    const script = `@(${ids}) | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`;
    runChecked('powershell', ['-NoProfile', '-Command', script]);
    return;
  }

  for (const proc of processesToKill) {
    try {
      process.kill(proc.ProcessId, 'SIGKILL');
    } catch {}
  }
}

function waitForPortToClear(targetPort, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!getPortListeners(targetPort).length) return true;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  return !getPortListeners(targetPort).length;
}

function printStatus() {
  const processes = listProcesses();
  const listeners = getPortListeners(port);
  console.log(JSON.stringify({
    repoDir,
    host,
    port,
    processes,
    listeners,
  }, null, 2));
}

function clean() {
  const processes = listProcesses();
  if (processes.length) {
    console.log(`Stopping ${processes.length} Offroady local runtime process(es)...`);
    for (const proc of processes) {
      console.log(`- PID ${proc.ProcessId}: ${proc.CommandLine}`);
    }
    killProcesses(processes);
  } else {
    console.log('No stale Offroady local runtime processes found.');
  }

  if (!waitForPortToClear(port)) {
    throw new Error(`Port ${port} is still occupied after cleanup.`);
  }

  console.log(`Port ${port} is clear.`);
}

function runForeground(args) {
  const child = spawn(process.execPath, [nextBin, ...args], {
    cwd: repoDir,
    env: process.env,
    stdio: 'inherit',
  });

  const forwardSignal = (signal) => {
    if (!child.killed) child.kill(signal);
  };

  process.on('SIGINT', forwardSignal);
  process.on('SIGTERM', forwardSignal);

  child.on('exit', (code, signal) => {
    process.off('SIGINT', forwardSignal);
    process.off('SIGTERM', forwardSignal);
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

if (mode === 'status') {
  printStatus();
  process.exit(0);
}

if (mode === 'clean') {
  clean();
  process.exit(0);
}

clean();

if (mode === 'start') {
  console.log(`Building Offroady for local production runtime on http://${host}:${port} ...`);
  const buildResult = spawnSync(process.execPath, [nextBin, 'build'], {
    cwd: repoDir,
    env: process.env,
    stdio: 'inherit',
  });
  if (buildResult.error) throw buildResult.error;
  if (buildResult.status !== 0) process.exit(buildResult.status ?? 1);

  console.log(`Starting Offroady local production runtime on http://${host}:${port} ...`);
  runForeground(['start', '--hostname', host, '--port', port]);
} else {
  console.log(`Starting Offroady local dev runtime on http://${host}:${port} ...`);
  runForeground(['dev', '--hostname', host, '--port', port]);
}
