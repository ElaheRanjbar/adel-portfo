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
  snapshot.data.caseStudiesList.forEach((project) => (project.detailUrl = '/#contact'));
  const saved = await admin.request.put(`${base}/api/portfolio`, {
    data: snapshot.data,
    headers: { 'X-Portfolio-Request': '1', 'If-Match': String(snapshot.revision) },
  });
  assert.equal(saved.status(), 200, await saved.text());
  await page.setViewportSize({ width: 393, height: 885 });
  await page.goto(base);
  const open = page.getByRole('button', { name: 'Open menu', exact: true });
  const menu = page.getByRole('dialog', { name: 'Mobile navigation', exact: true });
  const close = page.getByRole('button', { name: 'Close menu', exact: true });
  await expect(open).toBeVisible();
  await expect(page.locator('header .nav-links')).toBeHidden();
  await expect(page.locator('header')).toHaveCSS('height', '78px');
  for (const width of [320, 393, 760]) {
    await page.setViewportSize({ width, height: 885 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const heroWidth = await page.locator('.hero').evaluate((n) => n.clientWidth);
    for (const button of await page.locator('.hero-actions a').all()) {
      assert.equal(Math.round((await button.boundingBox()).width), heroWidth);
      await expect(button).toHaveCSS('justify-content', 'center');
      await expect(button).toHaveCSS('text-align', 'center');
    }
    await expect(page.locator('.hero')).toHaveCSS('text-align', 'center');
    await expect(page.locator('.about-section .section-header')).toHaveCSS('text-align', 'center');
    await expect(page.locator('.about-lead')).toHaveCSS('text-align', 'center');
    const cv = page.locator('.cv-action .btn-outline');
    const contentWidth = await page.locator('.cv-action').evaluate((n) => {
      const s = getComputedStyle(n);
      return n.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    });
    assert.equal(Math.round((await cv.boundingBox()).width), contentWidth);
    await expect(cv).toHaveCSS('justify-content', 'center');
  }
  await page.setViewportSize({ width: 393, height: 885 });
  await page.screenshot({ path: '/tmp/portfolio-mobile-home.png' });
  await open.click();
  await expect(menu).toBeVisible();
  await expect(open).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await expect(close).toBeFocused();
  const menuLink = menu.getByRole('link', { name: 'Case Studies', exact: true });
  const menuContact = menu.getByRole('link', { name: 'Contact Me', exact: true });
  assert.ok((await menuLink.boundingBox()).y < 200);
  assert.equal(Math.round((await menuContact.boundingBox()).width), 353);
  await page.screenshot({ path: '/tmp/portfolio-mobile-menu.png' });
  await page.keyboard.press('Shift+Tab');
  await expect(menu.getByRole('link', { name: 'Home', exact: true }).first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  await expect(open).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await open.click();
  await close.click();
  await expect(menu).not.toBeVisible();
  await open.click();
  await menu.getByRole('link', { name: 'Case Studies', exact: true }).click();
  await page.waitForURL(base + '/projects');
  await expect(menu).not.toBeVisible();
  const projects = [...snapshot.data.caseStudiesList].reverse();
  for (const project of projects) {
    // Duplicate display titles are valid, so match by the canonical link instead.
    const link = page.locator('.btn-view-case[href="/project-detail?id=' + project.id + '"]');
    await expect(link).toHaveCount(1);
    await link.click();
    await page.waitForURL(base + '/project-detail?id=' + project.id);
    await expect(page.locator('.detail-hero-title')).toHaveText(
      snapshot.data.detailedCaseStudies[project.id].title,
    );
    await page.goBack();
    await expect(page.locator('.listing-card').first()).toBeVisible();
  }
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'My Story', exact: true }).click();
  await page.waitForURL(base + '/#about');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Contact Me', exact: true }).click();
  await page.waitForURL(base + '/#contact');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('header .nav-links')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toBeHidden();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: responsive header, full-screen menu, Escape/close/focus/scroll, route and anchor navigation, desktop resizing, centered full-width mobile CTAs, every listing card opens its own detail despite stale URLs',
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
