import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const children = [];
let stopping = false;
let proxyDirectory;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill('SIGTERM'));
  if (proxyDirectory) rmSync(proxyDirectory, { recursive: true, force: true });
  process.exitCode = code;
}
function start(args, options = {}) {
  const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit', ...options });
  children.push(child);
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping) stop(code ?? (signal ? 1 : 0));
  });
  return child;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

try {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major !== 24 || minor < 18)
    throw new Error('Use Node 24.18 or newer in the Node 24 release line (nvm use).');
  const envPath = join(root, 'backend/.env');
  const config = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  const port = Number(process.env.API_PORT || config.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('API_PORT must be a valid TCP port.');
  const host = process.env.API_HOST || config.HOST || '127.0.0.1';
  const address = host === '0.0.0.0' ? '127.0.0.1' : host === '::' ? '[::1]' : host;
  const target = `http://${address}:${port}`;
  async function apiReady() {
    try {
      const response = await fetch(`${target}/api/portfolio`, {
        signal: AbortSignal.timeout(1000),
      });
      if (!response.ok) return false;
      const snapshot = await response.json();
      return !!snapshot.data?.hero && Number.isInteger(snapshot.revision);
    } catch {
      return false;
    }
  }
  if (await apiReady()) {
    console.log(`Using the running portfolio API at ${target}.`);
  } else {
    if (!existsSync(join(root, 'backend/node_modules/ts-node/register')))
      throw new Error('Backend dependencies are missing. Run npm run setup first.');
    console.log(`Starting the portfolio API at ${target}…`);
    start(['--env-file-if-exists=.env', '--watch', '-r', 'ts-node/register', 'src/main.ts'], {
      cwd: join(root, 'backend'),
      env: { ...process.env, PORT: String(port), HOST: host },
    });
    const deadline = Date.now() + 30000;
    let ready = false;
    while (!stopping && Date.now() < deadline) {
      if (await apiReady()) {
        ready = true;
        break;
      }
      await delay(250);
    }
    if (!ready)
      throw new Error(
        'The portfolio API did not start. Check the backend error above and backend/.env.',
      );
  }
  if (!stopping) {
    const args = process.argv.slice(2);
    if (!args.some((arg) => arg === '--proxy-config' || arg.startsWith('--proxy-config='))) {
      proxyDirectory = mkdtempSync(join(tmpdir(), 'adel-proxy-'));
      const file = join(proxyDirectory, 'proxy.json');
      writeFileSync(file, JSON.stringify({ '^/api(?:/|$)': { target, secure: false } }));
      args.push('--proxy-config', file);
    }
    console.log('Portfolio API ready. Starting Angular…');
    const frontendEnv = { ...process.env };
    // Hosted previews may inject PORT. An explicit CLI port must still take precedence.
    if (args.some((arg) => arg === '--port' || arg.startsWith('--port='))) delete frontendEnv.PORT;
    start([join(root, 'node_modules/@angular/cli/bin/ng.js'), 'serve', ...args], {
      env: frontendEnv,
    });
  }
} catch (error) {
  console.error(error.message);
  stop(1);
}
