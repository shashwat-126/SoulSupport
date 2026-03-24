#!/usr/bin/env node

const { execSync } = require('node:child_process');

const PORT = Number(process.env.PREVIEW_PORT || 3000);

function getPidsOnPortWindows(port) {
  try {
    const output = execSync(`netstat -ano -p tcp | findstr :${port}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const lines = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const pids = new Set();
    for (const line of lines) {
      const parts = line.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) {
        pids.add(pid);
      }
    }

    return [...pids];
  } catch {
    return [];
  }
}

function getPidsOnPortUnix(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^\d+$/.test(line));
  } catch {
    return [];
  }
}

function killPidWindows(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

function killPidUnix(pid) {
  try {
    process.kill(Number(pid), 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

function stopPreviewOnPort(port) {
  const isWindows = process.platform === 'win32';
  const pids = isWindows ? getPidsOnPortWindows(port) : getPidsOnPortUnix(port);

  if (!pids.length) {
    console.log(`[stop-preview] Port ${port} is free.`);
    return;
  }

  const killed = [];
  const failed = [];

  for (const pid of pids) {
    const ok = isWindows ? killPidWindows(pid) : killPidUnix(pid);
    if (ok) {
      killed.push(pid);
    } else {
      failed.push(pid);
    }
  }

  if (killed.length) {
    console.log(`[stop-preview] Stopped process(es) on port ${port}: ${killed.join(', ')}`);
  }

  if (failed.length) {
    console.warn(`[stop-preview] Could not stop process(es): ${failed.join(', ')}`);
  }
}

stopPreviewOnPort(PORT);
