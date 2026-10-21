const { chromium } = require('@playwright/test');
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..');
const password = require('node:crypto').randomBytes(24).toString('hex');
const directory = mkdtempSync(join(tmpdir(), 'adel-fullstack-'));
let base;
let server, browser;
(async () => {
  let logs = '';
  server = spawn(
    process.execPath,
    [
      '-e',
      "require('./dist/backend/src/main.js').bootstrap().then(async app => console.log('E2E_URL:' + await app.getUrl())).catch(error => { console.error(error); process.exitCode = 1; })",
    ],
    {
      cwd: join(root, 'backend'),
      env: {
        ...process.env,
        ADMIN_PASSWORD: password,
        ADMIN_USERNAME: 'admin',
        PORT: '0',
        HOST: '127.0.0.1',
        DATABASE_PATH: join(directory, 'portfolio.sqlite'),
        UPLOAD_DIR: join(directory, 'uploads'),
        NODE_ENV: 'test',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  server.stdout.on('data', (data) => (logs += data));
  server.stderr.on('data', (data) => (logs += data));
  base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server startup timed out: ' + logs)), 20000);
    server.stdout.on('data', () => {
      const match = logs.match(/E2E_URL:(http[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    server.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error('Server exited: ' + code + ' ' + logs));
    });
  });
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    headless: true,
    args: ['--no-sandbox'],
  });
  const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await admin.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${base}/admin/hero`);
  await page.locator('input[name=username]').fill('admin');
  await page.locator('input[name=password]').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.locator('.admin-body').waitFor();
  const { expect } = require('@playwright/test');
  const badgeFields = page.getByLabel('Choose file: Badge image', { exact: true });
  await expect(badgeFields).toHaveCount(2);
  for (const mime of [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
  ]) {
    assert.ok((await badgeFields.first().getAttribute('accept')).includes(mime));
  }
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  await publicPage.goto(base);
  await publicPage.locator('.hero-decoration').first().waitFor();
  const motion = () =>
    publicPage
      .locator('.hero-decoration')
      .evaluateAll((nodes) =>
        nodes.map((n) => [
          getComputedStyle(n).animationName,
          getComputedStyle(n).animationDuration,
        ]),
      );
  const originalMotion = await motion();
  assert.ok(originalMotion.every(([name]) => name.includes('float-')));
  const files = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    canvas.getContext('2d').fillRect(0, 0, 32, 32);
    return ['image/png', 'image/jpeg', 'image/webp'].map((type) => ({
      name: 'badge.' + type.split('/')[1],
      mimeType: type,
      data: canvas.toDataURL(type).split(',')[1],
    }));
  });
  files.push({
    name: 'badge.gif',
    mimeType: 'image/gif',
    data: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  });
  files.push({
    name: 'badge.svg',
    mimeType: 'image/svg+xml',
    data: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="blue"/></svg>',
    ).toString('base64'),
  });
  const save = async () => {
    const saved = page.waitForResponse(
      (r) => r.url() === `${base}/api/portfolio` && r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Save page', exact: true }).click();
    const result = await saved;
    assert.equal(result.status(), 200, await result.text());
  };
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const index = i % 2;
    const uploaded = page.waitForResponse(
      (r) => r.url() === `${base}/api/media` && r.request().method() === 'POST',
    );
    await badgeFields
      .nth(index)
      .setInputFiles({
        name: file.name,
        mimeType: file.mimeType,
        buffer: Buffer.from(file.data, 'base64'),
      });
    const response = await uploaded;
    assert.equal(response.status(), 201, await response.text());
    const record = await response.json();
    assert.equal(record.type, file.mimeType);
    assert.deepEqual(
      Buffer.from(await (await publicPage.request.get(base + record.url)).body()),
      Buffer.from(file.data, 'base64'),
    );
    await save();
    await page.reload();
    await expect(page.getByLabel('Badge image URL', { exact: true }).nth(index)).toHaveValue(
      record.url,
    );
    await publicPage.reload();
    await expect(publicPage.locator('.hero-decoration')).toHaveCount(2);
    await expect(publicPage.locator('.hero-decoration').nth(index)).toHaveAttribute(
      'src',
      record.url,
    );
    await publicPage.waitForFunction(() =>
      [...document.querySelectorAll('.hero-decoration')].every(
        (n) => n.complete && n.naturalWidth > 0,
      ),
    );
    assert.deepEqual(await motion(), originalMotion);
  }
  await page.getByRole('button', { name: 'Use default image', exact: true }).first().click();
  await save();
  const restored = await (await admin.request.get(`${base}/api/portfolio`)).json();
  assert.equal(restored.data.hero.badges[0].image, '/assets/portfolio/hero-figma.png');
  await visitor.close();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: badge PNG/JPEG/WebP/GIF/SVG uploads, accepted AVIF, original bytes, save/reload, anonymous rendering, unchanged animation on both positions, default restoration',
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    if (server && server.exitCode === null && server.signalCode === null) {
      server.kill('SIGTERM');
      await new Promise((resolve) => server.on('exit', resolve));
    }
    rmSync(directory, { recursive: true, force: true });
  });
