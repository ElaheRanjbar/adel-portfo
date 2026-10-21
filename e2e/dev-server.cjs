const { spawn } = require('node:child_process');
const { createServer } = require('node:net');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const assert = require('node:assert/strict');
const root = resolve(__dirname, '..');
const directory = mkdtempSync(join(tmpdir(), 'adel-dev-test-'));
const password = require('node:crypto').randomBytes(24).toString('hex');
const freePort = () =>
  new Promise((resolve) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
let child;
(async () => {
  const apiPort = await freePort();
  const frontendPort = await freePort();
  let output = '';
  child = spawn(
    process.execPath,
    ['scripts/dev.mjs', '--host', '127.0.0.1', '--port', String(frontendPort)],
    {
      cwd: root,
      env: {
        ...process.env,
        API_PORT: String(apiPort),
        PORT: '49999',
        DATABASE_PATH: join(directory, 'portfolio.sqlite'),
        UPLOAD_DIR: join(directory, 'uploads'),
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD: password,
        NODE_ENV: 'test',
        NG_CLI_ANALYTICS: 'false',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout.on('data', (data) => (output += data));
  child.stderr.on('data', (data) => (output += data));
  const base = `http://127.0.0.1:${frontendPort}`;
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) throw new Error(output);
    try {
      const response = await fetch(`${base}/api/portfolio`, { signal: AbortSignal.timeout(1000) });
      if (response.ok && (await response.json()).data?.hero) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Development proxy never became ready: ' + output);
  const session = await fetch(`${base}/api/auth/session`);
  assert.equal(session.status, 200);
  assert.deepEqual(await session.json(), { user: null });
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Portfolio-Request': '1', Origin: base },
    body: JSON.stringify({ username: 'admin', password }),
  });
  assert.equal(login.status, 201, await login.text());
  assert.ok(
    output.indexOf('Portfolio API ready.') < output.indexOf('Local:'),
    'API must be ready before Angular starts',
  );
  console.log(
    'PASS: development runner starts Nest before Angular, respects custom ports, proxies both nested API routes, and accepts login from the frontend origin.',
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await new Promise((resolve) => child.once('exit', resolve));
    }
    rmSync(directory, { recursive: true, force: true });
  });
