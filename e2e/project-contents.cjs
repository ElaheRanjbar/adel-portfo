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
  const snapshot = await (await admin.request.get(`${base}/api/portfolio`)).json();
  const project = snapshot.data.caseStudiesList[0];
  const detail = snapshot.data.detailedCaseStudies[project.id];
  detail.sections = Array.from({ length: 6 }, (_, i) => ({
    id: 'section-' + i,
    title: 'Section ' + (i + 1),
    navTitle:
      i === 2 ? 'A longer content title that should keep its full border' : 'Section ' + (i + 1),
    html: '<p>' + 'Detailed project content for scrolling and navigating. '.repeat(180) + '</p>',
  }));
  const saved = await admin.request.put(`${base}/api/portfolio`, {
    data: snapshot.data,
    headers: { 'X-Portfolio-Request': '1', 'If-Match': String(snapshot.revision) },
  });
  assert.equal(saved.status(), 200, await saved.text());
  const sidebar = page.locator('.detail-sidebar');
  const links = sidebar.locator('a');
  for (const width of [320, 393, 760]) {
    await page.setViewportSize({ width, height: 885 });
    await page.goto(base + '/project-detail?id=' + project.id);
    await expect(links).toHaveCount(6);
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const link of await links.all()) {
      const size = await link.evaluate((n) => {
        const range = document.createRange();
        range.selectNodeContents(n);
        const s = getComputedStyle(n);
        return {
          box: n.getBoundingClientRect().width,
          text: range.getBoundingClientRect().width,
          padding: parseFloat(s.paddingLeft) + parseFloat(s.paddingRight) + 2,
        };
      });
      assert.ok(Math.abs(size.box - size.text - size.padding) < 2, JSON.stringify(size));
    }
    await page.evaluate(() =>
      window.scrollTo({
        top:
          document.querySelector('.detail-body-grid').getBoundingClientRect().top + scrollY + 400,
        behavior: 'instant',
      }),
    );
    await expect(sidebar).toHaveCSS('position', 'sticky');
    for (const extra of [0, 300, 600]) {
      if (extra)
        await page.evaluate((extra) => window.scrollBy({ top: extra, behavior: 'instant' }), extra);
      assert.equal(Math.round((await sidebar.boundingBox()).y), 98);
      assert.equal(Math.round((await page.locator('app-site-header').boundingBox()).y), 0);
    }
    const link = links.nth(4);
    await link.click();
    await page.waitForURL((url) => url.hash === '#section-4');
    await expect(link).toHaveAttribute('aria-current', 'location');
    await expect
      .poll(async () => {
        const heading = await page.locator('#section-4').boundingBox();
        const nav = await sidebar.boundingBox();
        return heading.y >= nav.y + nav.height && heading.y < nav.y + nav.height + 80;
      })
      .toBe(true);
    await links.nth(2).click();
    await page.waitForURL((url) => url.hash === '#section-2');
    await expect(links.nth(2)).toHaveAttribute('aria-current', 'location');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await expect.poll(async () => {
      const heading = await page.locator('#section-2').boundingBox();
      const nav = await sidebar.boundingBox();
      return heading.y >= nav.y + nav.height && heading.y < nav.y + nav.height + 80;
    }).toBe(true);
    assert.equal(Math.round((await sidebar.boundingBox()).y), 98);
    assert.equal(Math.round((await page.locator('app-site-header').boundingBox()).y), 0);
    if (width === 393) await page.screenshot({ path: '/tmp/project-contents-mobile.png' });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(sidebar).toHaveCSS('position', 'sticky');
  await expect(sidebar.locator('.sidebar-nav-list')).toHaveCSS('display', 'block');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: mobile sticky contents below header at multiple scroll positions, natural text-width borders, long labels without page overflow, anchor headings stay visible, active section and desktop layout',
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
