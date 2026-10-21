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
  const snapshot = async () => await (await fetch(`${base}/api/portfolio`)).json();
  async function login(p) {
    await p.locator('input[name=username]').fill('admin');
    await p.locator('input[name=password]').fill(password);
    await p.getByRole('button', { name: 'Sign in', exact: true }).click();
    await p.locator('.admin-body').waitFor();
  }
  async function save(p) {
    const response = p.waitForResponse(
      (r) => r.url() === `${base}/api/portfolio` && r.request().method() === 'PUT',
    );
    await p.getByRole('button', { name: 'Save page', exact: true }).click();
    const result = await response;
    assert.equal(result.status(), 200, await result.text());
  }
  await page.goto(`${base}/admin/hero`);
  await page.locator('.admin-login').waitFor();
  await login(page);
  await page.screenshot({ path: '/tmp/adel-admin-section-saves.png', fullPage: true });
  assert.equal(await page.getByRole('button', { name: 'Save all', exact: true }).count(), 0);
  assert.equal(await page.locator('.menu-item[href="/admin/html"]').count(), 0);
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Unpublished introduction');
  assert.equal(await page.getByRole('button', { name: 'Save page', exact: true }).count(), 1);
  await page.locator('.menu-item[href="/admin/footer"]').click();
  await page
    .getByRole('textbox', { name: 'Headline (HTML supported)', exact: true })
    .fill('Other page draft');
  await page.locator('.menu-item[href="/admin/hero"]').click();
  const badges = page
    .locator('app-admin-collection')
    .filter({ has: page.locator('.collection-header h4').filter({ hasText: 'Floating badge' }) });
  const svgInputs = badges.locator('input[type=file]');
  assert.equal(await svgInputs.count(), 2);
  const badgeVisitor = await browser.newContext();
  const badgePage = await badgeVisitor.newPage();
  await badgePage.goto(base);
  await badgePage.locator('.hero-decoration').first().waitFor();
  assert.equal(await badgePage.locator('.hero-decoration').count(), 2);
  assert.deepEqual(
    await badgePage
      .locator('.hero-decoration')
      .evaluateAll((images) => images.map((image) => image.getAttribute('src'))),
    ['/assets/portfolio/hero-figma.png', '/assets/portfolio/hero-design.png'],
  );
  const animation = await badgePage
    .locator('.hero-decoration')
    .evaluateAll((images) =>
      images.map((image) => [
        getComputedStyle(image).animationName,
        getComputedStyle(image).animationDuration,
      ]),
    );
  for (let index = 0; index < 2; index++) {
    const uploaded = page.waitForResponse(
      (response) =>
        response.url() === `${base}/api/media` && response.request().method() === 'POST',
    );
    await svgInputs.nth(index).setInputFiles({
      name: `custom-badge-${index}.svg`,
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="${index ? '#a927cc' : '#397bff'}"/></svg>`,
      ),
    });
    assert.equal((await uploaded).status(), 201);
  }
  await save(page);
  assert.equal(
    (await snapshot()).data.hero.name,
    'Unpublished introduction',
    'Saving the Hero page must include introduction and badges',
  );
  assert.equal(
    await page.getByRole('textbox', { name: 'Name', exact: true }).inputValue(),
    'Unpublished introduction',
  );
  assert.notEqual(
    (await snapshot()).data.footer.headline,
    'Other page draft',
    'Saving Hero must not publish Footer drafts',
  );
  const uploadedBadges = (await snapshot()).data.hero.badges.map((badge) => badge.image);
  assert.ok(uploadedBadges.every((url) => url.startsWith('/api/media/')));
  await badgePage.reload();
  await badgePage.locator('.hero-decoration').first().waitFor();
  assert.equal(
    await badgePage.locator('.hero-decoration').count(),
    2,
    'Uploaded SVGs replace the defaults without duplicate graphics',
  );
  assert.deepEqual(
    await badgePage
      .locator('.hero-decoration')
      .evaluateAll((images) => images.map((image) => image.getAttribute('src'))),
    uploadedBadges,
  );
  assert.deepEqual(
    await badgePage
      .locator('.hero-decoration')
      .evaluateAll((images) =>
        images.map((image) => [
          getComputedStyle(image).animationName,
          getComputedStyle(image).animationDuration,
        ]),
      ),
    animation,
  );
  await badgePage.waitForFunction(() =>
    [...document.querySelectorAll('.hero-decoration')].every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
  await badges.getByRole('button', { name: 'Use default SVG', exact: true }).first().click();
  await save(page);
  assert.equal((await snapshot()).data.hero.badges[0].image, '/assets/portfolio/hero-figma.png');
  await badgeVisitor.close();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('E2E server name');
  await page
    .locator('input[type=file][aria-label="Choose file: Profile image"]')
    .setInputFiles({ name: 'e2e-profile.png', mimeType: 'image/png', buffer: png });
  await page.locator('.file-status').first().waitFor();
  await save(page);
  let state = await snapshot();
  const imageUrl = state.data.hero.profileImage;
  assert.match(imageUrl, /^\/api\/media\//);
  assert.equal(state.data.hero.name, 'E2E server name');
  const anonymous = await browser.newContext();
  const publicPage = await anonymous.newPage();
  await publicPage.goto(base);
  await publicPage.locator('.hero h1').waitFor();
  assert.match(await publicPage.locator('.hero h1').innerText(), /E2E server name/);
  assert.equal(await publicPage.locator('.hero-image-card img').getAttribute('src'), imageUrl);
  assert.ok(
    await publicPage
      .locator('.hero-image-card img')
      .evaluate((el) => el.complete && el.naturalWidth > 0),
  );
  assert.match(await publicPage.title(), /E2E server name/);
  // Missing CV must never navigate or scroll to the old contact fallback.
  await publicPage.locator('.hero-actions a[resumeDownload]').click({ force: true });
  assert.equal(publicPage.url(), base + '/');
  await publicPage.getByRole('alert').filter({ hasText: 'Resume is not available yet.' }).waitFor();
  await page.locator('input[type=file][aria-label="Choose file: Resume"]').setInputFiles({
    name: 'e2e-resume.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nE2E resume\n%%EOF'),
  });
  await page
    .locator('app-media-field')
    .filter({ has: page.getByLabel('Resume URL', { exact: true }) })
    .locator('.file-status')
    .waitFor();
  await save(page);
  await publicPage.reload();
  for (const selector of ['.hero-actions a[resumeDownload]', '.cv-action a[resumeDownload]']) {
    const beforeUrl = publicPage.url();
    const downloaded = publicPage.waitForEvent('download');
    await publicPage.locator(selector).click();
    const file = await downloaded;
    assert.equal(file.suggestedFilename(), 'e2e-resume.pdf');
    assert.equal(publicPage.url(), beforeUrl);
  }
  await page.locator('.menu-item[href="/admin/footer"]').click();
  await page
    .getByRole('textbox', { name: 'Headline (HTML supported)', exact: true })
    .fill('Unpublished footer headline');
  const socials = page.locator('app-admin-collection');
  await socials.getByRole('button', { name: '+ Add', exact: true }).click();
  const platform = socials.locator('app-admin-fields').last();
  await platform.getByRole('textbox', { name: 'Platform name', exact: true }).fill('New platform');
  await platform
    .getByRole('textbox', { name: 'Link', exact: true })
    .fill('https://example.com/new-platform');
  for (const file of [
    { name: 'footer-icon.png', mimeType: 'image/png', buffer: png },
    {
      name: 'footer-icon.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="white"/></svg>',
      ),
    },
  ]) {
    const uploaded = page.waitForResponse(
      (r) => r.url() === base + '/api/media' && r.request().method() === 'POST',
    );
    await platform.locator('input[type=file]').setInputFiles(file);
    assert.equal((await uploaded).status(), 201);
    await save(page);
    assert.equal(
      (await snapshot()).data.footer.headline,
      'Unpublished footer headline',
      'Saving the Footer page must include social links and text',
    );
    const social = (await snapshot()).data.footer.socials.at(-1);
    assert.equal(social.label, 'New platform');
    assert.match(social.image, /^\/api\/media\//);
    await publicPage.reload();
    const link = publicPage.locator('.social-btn').filter({ hasText: 'New platform' });
    assert.equal(await link.getAttribute('href'), 'https://example.com/new-platform');
    assert.equal(await link.locator('img').getAttribute('src'), social.image);
    await link.scrollIntoViewIfNeeded();
    await link.locator('img').evaluate((img) => img.decode());
  }
  await save(page);
  assert.equal((await snapshot()).data.footer.headline, 'Unpublished footer headline');
  await publicPage.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await publicPage.locator('.social-links').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        element.scrollWidth <= element.clientWidth && rect.left >= 0 && rect.right <= innerWidth
      );
    }),
    true,
  );
  await publicPage.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('.menu-item[href="/admin/tags"]').click();
  await page.locator('input[name=newTag]').fill('E2E Tag');
  await page.locator('input[name=newTagLink]').fill('https://example.com/e2e');
  await page.locator('.tag-create button[type=submit]').click();
  await save(page);
  await page.locator('.menu-item[href="/admin/projects"]').click();
  await page.getByRole('button', { name: /Create case study/ }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('E2E created project');
  await page
    .getByRole('textbox', { name: 'Detail page title', exact: true })
    .fill('E2E detail title');
  await page.getByLabel('E2E Tag', { exact: true }).nth(1).check();
  await page.getByRole('button', { name: /Add section/ }).click();
  await page.getByRole('textbox', { name: 'Section title', exact: true }).fill('E2E research');
  await page.getByRole('button', { name: 'Edit text, images and files', exact: true }).click();
  const editor = page.locator('.ck-editor__editable');
  await editor.waitFor();
  await editor.click();
  await page.keyboard.type('Persistent case story from API');
  await save(page);
  state = await snapshot();
  const project = state.data.caseStudiesList.find((item) => item.title === 'E2E created project');
  assert.ok(project);
  assert.deepEqual(project.tags, state.data.detailedCaseStudies[project.id].tags);
  assert.match(
    state.data.detailedCaseStudies[project.id].sections[0].html,
    /Persistent case story/,
  );
  await publicPage.goto(`${base}/projects`);
  await publicPage.getByRole('heading', { name: 'E2E created project', exact: true }).waitFor();
  assert.equal(
    await publicPage.locator('a.pill-tag').filter({ hasText: 'E2E Tag' }).getAttribute('href'),
    '/projects?tag=' + project.tags[0],
  );
  await publicPage.locator('a.pill-tag').filter({ hasText: 'E2E Tag' }).click();
  await publicPage.getByRole('button', { name: 'Remove filter: E2E Tag', exact: true }).waitFor();
  assert.equal(await publicPage.locator('.listing-card').count(), 1);
  assert.equal(new URL(publicPage.url()).searchParams.get('tag'), project.tags[0]);
  const otherTag = state.data.tags.find((tag) => tag.id !== project.tags[0]);
  await publicPage.getByRole('button', { name: 'Filter', exact: true }).click();
  await publicPage.getByRole('checkbox', { name: otherTag.name, exact: true }).check();
  await publicPage
    .getByRole('button', { name: 'Remove filter: ' + otherTag.name, exact: true })
    .waitFor();
  await publicPage.getByRole('button', { name: 'Remove filter: E2E Tag', exact: true }).click();
  await publicPage.getByRole('button', { name: 'Clear filters', exact: true }).first().click();
  await publicPage.waitForURL((url) => !url.searchParams.has('tag'));
  assert.equal(
    await publicPage.locator('.listing-card').count(),
    state.data.caseStudiesList.length,
  );
  await publicPage.goBack();
  await publicPage
    .getByRole('button', { name: 'Remove filter: ' + otherTag.name, exact: true })
    .waitFor();
  await publicPage.goto(`${base}/project-detail?id=${project.id}`);
  await publicPage.getByRole('heading', { name: 'E2E detail title', exact: true }).waitFor();
  assert.match(await publicPage.locator('.detail-content').innerText(), /Persistent case story/);
  await page.getByRole('button', { name: 'Delete case study', exact: true }).click();
  await page.locator('app-admin-confirm dialog[open]').waitFor();
  await page.locator('app-admin-confirm .confirm-action').click();
  assert.ok(
    (await snapshot()).data.detailedCaseStudies[project.id],
    'Delete remains a draft until saving the Case studies page',
  );
  await save(page);
  assert.equal((await snapshot()).data.detailedCaseStudies[project.id], undefined);
  await page.locator('.menu-item[href="/admin/media"]').click();
  const fileCard = page.locator('.media-library article').filter({ hasText: 'e2e-profile.png' });
  await fileCard.waitFor();
  assert.equal(await fileCard.getByRole('button', { name: 'Delete file' }).isDisabled(), true);
  await page.locator('.menu-item[href="/admin/hero"]').click();
  await page
    .getByRole('textbox', { name: 'Profile image URL', exact: true })
    .fill('/assets/portfolio/maryam-portrait.webp');
  await save(page);
  await page.locator('.menu-item[href="/admin/media"]').click();
  await fileCard.getByRole('button', { name: 'Delete file' }).click();
  await page.locator('app-admin-confirm .confirm-action').click();
  await fileCard.waitFor({ state: 'detached' });
  assert.equal((await fetch(`${base}${imageUrl}`)).status, 404);
  // Import old browser-only content plus an IndexedDB upload.
  const legacy = (await snapshot()).data;
  legacy.hero.name = 'Imported browser portfolio';
  legacy.hero.profileImage = 'asset:e2e-legacy';
  legacy.header.navLinks[0].href = 'index.html';
  await page.evaluate(
    async ({ legacy, pngBase64 }) => {
      localStorage.setItem('maryam_portfolio_store', JSON.stringify(legacy));
      await new Promise((resolve, reject) => {
        const r = indexedDB.open('maryam-portfolio-media', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('assets', { keyPath: 'id' });
        r.onerror = reject;
        r.onsuccess = () => {
          const db = r.result;
          const tx = db.transaction('assets', 'readwrite');
          const bytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0));
          tx.objectStore('assets').put({
            id: 'asset:e2e-legacy',
            blob: new Blob([bytes], { type: 'image/png' }),
            name: 'legacy.png',
          });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = reject;
        };
      });
    },
    { legacy, pngBase64: png.toString('base64') },
  );
  await page.locator('.menu-item[href="/admin/backup"]').click();
  await page.getByRole('button', { name: 'Import old browser content', exact: true }).click();
  await page.locator('app-admin-confirm .confirm-action').click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Content and files imported to the server.' })
    .waitFor();
  state = await snapshot();
  assert.equal(state.data.hero.name, 'Imported browser portfolio');
  assert.match(state.data.hero.profileImage, /^\/api\/media\//);
  assert.equal(state.data.header.navLinks[0].href, '/');
  assert.ok(
    await page.evaluate(() =>
      localStorage.getItem('maryam_portfolio_store').includes('asset:e2e-legacy'),
    ),
  );
  // Portable backup restores files to fresh API URLs.
  const oldUrl = state.data.hero.profileImage;
  state.data.hero.name = 'Restored backup portfolio';
  const backup = {
    version: 2,
    portfolio: state.data,
    assets: [
      {
        id: oldUrl,
        name: 'legacy.png',
        type: 'image/png',
        data: `data:image/png;base64,${png.toString('base64')}`,
      },
    ],
  };
  await page.locator('.backup-upload input').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  const restored = page.waitForResponse(
    (response) =>
      response.url() === `${base}/api/portfolio` && response.request().method() === 'PUT',
  );
  await page.locator('app-admin-confirm .confirm-action').click();
  assert.equal((await restored).status(), 200);
  await page.locator('.backup-upload input').waitFor({ state: 'attached' });
  state = await snapshot();
  assert.equal(state.data.hero.name, 'Restored backup portfolio');
  assert.notEqual(state.data.hero.profileImage, oldUrl);
  // Two independent editors must never silently overwrite one another.
  const second = await browser.newContext();
  const secondPage = await second.newPage();
  await secondPage.goto(`${base}/admin/hero`);
  await secondPage.locator('.admin-login').waitFor();
  await login(secondPage);
  await page.locator('.menu-item[href="/admin/hero"]').click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('First editor wins');
  await save(page);
  await secondPage.getByRole('textbox', { name: 'Name', exact: true }).fill('Stale editor draft');
  const conflict = secondPage.waitForResponse(
    (r) => r.url() === `${base}/api/portfolio` && r.request().method() === 'PUT',
  );
  await secondPage.getByRole('button', { name: 'Save page', exact: true }).click();
  assert.equal((await conflict).status(), 409);
  assert.equal(
    await secondPage.getByRole('textbox', { name: 'Name', exact: true }).inputValue(),
    'Stale editor draft',
  );
  assert.equal((await snapshot()).data.hero.name, 'First editor wins');
  await secondPage.setViewportSize({ width: 390, height: 844 });
  await secondPage.getByRole('button', { name: 'Help: Name', exact: true }).click();
  await secondPage.locator('#admin-help-dialog[open]').waitFor();
  await secondPage.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.locator('.admin-login').waitFor();
  await page.reload();
  await page.locator('.admin-login').waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: actual Nest + SQLite + Angular: login/logout, footer platform PNG/SVG upload and persistence, both CV file downloads without navigation, URL tag filters/dropdown/removal/clear/history, SVG badge replacement/default restoration/unchanged animations, image upload/original public bytes, shared public content across browsers, project/tag/story create/delete, independent sidebar page save transactions, unused media deletion, browser/IndexedDB migration, portable backup restore, conflict protection and mobile Persian help.',
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
