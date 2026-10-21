const { chromium } = require('@playwright/test');
const { spawn } = require('node:child_process');
const { readFileSync, mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..');
const password = require('node:crypto').randomBytes(24).toString('hex');
const directory = mkdtempSync(join(tmpdir(), 'adel-fullstack-'));
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVJkAAAAASUVORK5CYII=',
  'base64',
);
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
  const snapshot = await (await admin.request.get(`${base}/api/portfolio`)).json();
  snapshot.data.tags = [
    ...snapshot.data.tags.map((tag) => ({ ...tag, name: 'Original ' + tag.name })),
    { id: 'check-one', name: 'Design Thinking' },
    { id: 'check-two', name: 'AI Design' },
  ];
  snapshot.data.caseStudiesList.forEach((project, i) => {
    project.tags = [i % 2 ? 'check-one' : 'check-two'];
    if (snapshot.data.detailedCaseStudies[project.id])
      snapshot.data.detailedCaseStudies[project.id].tags = project.tags;
  });
  const saved = await admin.request.put(`${base}/api/portfolio`, {
    data: snapshot.data,
    headers: { 'X-Portfolio-Request': '1', 'If-Match': String(snapshot.revision) },
  });
  assert.equal(saved.status(), 200, await saved.text());
  await page.goto(`${base}/projects`);
  await page.locator('.listing-card').first().waitFor();
  const total = await page.locator('.listing-card').count();
  const { expect } = require('@playwright/test');
  const filter = page.getByRole('button', { name: 'Filter', exact: true });
  const first = page.getByRole('checkbox', { name: 'Design Thinking', exact: true });
  const second = page.getByRole('checkbox', { name: 'AI Design', exact: true });
  await expect(filter).toHaveAttribute('aria-expanded', 'false');
  const newest = snapshot.data.caseStudiesList.at(-1).title;
  await expect(page.locator('.listing-title').first()).toHaveText(newest);
  await filter.click();
  await first.check();
  await page.waitForURL((url) => url.searchParams.getAll('tag').length === 1);
  await second.check();
  await page.waitForURL((url) => url.searchParams.getAll('tag').length === 2);
  await expect(page.locator('.filter-chip')).toHaveCount(2);
  await expect(first).toBeChecked();
  await expect(second).toBeChecked();
  await expect(page.locator('.listing-card')).toHaveCount(total);
  await page.locator('.project-filters').screenshot({ path: '/tmp/case-study-filters-open.png' });
  await page.keyboard.press('Escape');
  await expect(filter).toBeFocused();
  await expect(page.locator('#case-tag-filter')).toHaveCount(0);
  await page.locator('.project-filters').screenshot({ path: '/tmp/case-study-filters-closed.png' });
  await filter.press('Enter');
  await expect(first).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await page.keyboard.press('Space');
  await page.waitForURL((url) => url.searchParams.getAll('tag').length === 1);
  await expect(first).not.toBeChecked();
  await page.locator('.case-studies-header').click();
  await expect(filter).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: /Newest first/ }).click();
  await page.waitForURL((url) => url.searchParams.get('sort') === 'oldest');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).first().click();
  await page.waitForURL((url) => !url.searchParams.has('tag'));
  await expect(page.locator('.listing-card')).toHaveCount(total);
  await expect(page.locator('.listing-title').first()).toHaveText(
    snapshot.data.caseStudiesList[0].title,
  );
  assert.equal(new URL(page.url()).searchParams.get('sort'), 'oldest');
  await page.goBack();
  await page.locator('.filter-chip').waitFor();
  await page.reload();
  await page.locator('.filter-chip').waitFor();
  await filter.click();
  await expect(second).toBeChecked();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Remove filter: AI Design', exact: true }).click();
  await page.waitForURL((url) => !url.searchParams.has('tag'));
  await page.waitForLoadState('networkidle');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await filter.click();
    await expect(first).toBeVisible();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.keyboard.press('Escape');
    const typography = await page.locator('p').evaluateAll((nodes) =>
      nodes.map((n) => {
        const s = getComputedStyle(n);
        return [s.fontSize, s.lineHeight, n.outerHTML];
      }),
    );
    assert.ok(typography.length);
    for (const style of typography)
      assert.deepEqual(style.slice(0, 2), ['16px', '20.8px'], style[2]);
    assert.equal(
      await page
        .locator('.listing-title')
        .first()
        .evaluate((n) => getComputedStyle(n).fontSize),
      '40px',
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: checkbox filters, keyboard, Escape/outside close, tag removal, clear, sorting, URL/history/reload, responsive layout and typography',
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
