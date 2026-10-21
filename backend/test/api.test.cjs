const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const directory = mkdtempSync(join(tmpdir(), 'adel-api-test-'));
Object.assign(process.env, {
  NODE_ENV: 'test',
  ADMIN_PASSWORD: 'test-password-for-integration-only',
  DATABASE_PATH: join(directory, 'content.sqlite'),
  UPLOAD_DIR: join(directory, 'uploads'),
  PORT: '0',
  HOST: '127.0.0.1',
  FRONTEND_DIR: join(directory, 'no-frontend'),
});
const { bootstrap } = require('../dist/backend/src/main.js');
let app,
  base,
  cookie = '',
  current;
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (options.admin) {
    headers.Cookie = cookie;
    headers['X-Portfolio-Request'] = '1';
  }
  if (options.revision !== undefined) headers['If-Match'] = String(options.revision);
  const response = await fetch(`${base}/api${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const json = await response.json();
  return { response, json };
}
async function write(path, method, body) {
  const result = await request(path, { method, body, admin: true, revision: current.revision });
  assert.equal(result.response.status < 300, true, JSON.stringify(result.json));
  current = result.json;
  return current;
}
before(async () => {
  app = await bootstrap();
  base = await app.getUrl();
});
after(async () => {
  await app?.close();
  rmSync(directory, { recursive: true, force: true });
});

test('serves complete seeded portfolio and denies anonymous writes', async () => {
  current = (await request('/portfolio')).json;
  assert.equal(current.data.hero.name, 'Maryam');
  assert.equal(current.data.caseStudiesList.length, 4);
  assert.ok(current.data.tags.length);
  assert.ok(current.revision >= 1);
  const denied = await request('/portfolio', { method: 'PUT', body: current.data });
  assert.equal(denied.response.status, 403);
  assert.equal((await request('/media')).response.status, 401);
  assert.equal((await request('/health')).json.status, 'ok');
});
test('requires a valid password, request header and trusted origin for sign in', async () => {
  const credentials = { username: 'admin', password: process.env.ADMIN_PASSWORD };
  assert.equal(
    (await request('/auth/login', { method: 'POST', body: credentials })).response.status,
    403,
  );
  assert.equal(
    (
      await request('/auth/login', {
        method: 'POST',
        body: credentials,
        headers: { 'X-Portfolio-Request': '1', Origin: 'https://attacker.invalid' },
      })
    ).response.status,
    403,
  );
  assert.equal(
    (
      await request('/auth/login', {
        method: 'POST',
        admin: true,
        body: { username: 'admin', password: 'wrong-password' },
      })
    ).response.status,
    401,
  );
  const login = await request('/auth/login', { method: 'POST', admin: true, body: credentials });
  assert.equal(login.response.status, 201);
  const header = login.response.headers.get('set-cookie');
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Strict/);
  cookie = header.split(';')[0];
  assert.equal((await request('/auth/session', { admin: true })).json.user.username, 'admin');
});
test('persists all editor fields atomically with relations, order and server HTML sanitization', async () => {
  const data = structuredClone(current.data);
  data.hero.name = 'API persisted name';
  data.header.navLinks.push({ label: 'Gallery', href: '/#photos' });
  data.hero.badges.push({ label: 'Designer', icon: '✨', positionClass: 'card-top-right' });
  data.tags.push({ id: 'tag-test', name: 'Testing', link: 'https://example.com/testing' });
  data.caseStudiesList[0].tags = ['tag-test'];
  data.homeProjects[0].tags = ['tag-test'];
  const detail = data.detailedCaseStudies['case-1'];
  detail.tags = ['tag-test'];
  detail.sections[0].html =
    '<p style="text-align:center" onclick="bad()">Safe <strong>story</strong></p><script>evil()</script><a href="javascript:evil()">Bad</a>';
  detail.meta.push({ label: 'Result', value: 'Great' });
  detail.nextProject.tags = ['tag-test'];
  data.about.bio = 'API biography';
  data.about.stats[0].value = '42';
  data.about.skills.push('API skill');
  data.about.mindsets.push('API mindset');
  data.partners.push('API ticker');
  data.experiences.push({ role: 'Designer', company: 'API Co', period: '2026' });
  data.testimonials[0].fullQuote = 'Full API quote';
  data.lifePhotos[0].caption = 'API caption';
  data.footer.socials.push({
    label: 'API link',
    link: 'https://example.com',
    image: '/assets/portfolio/hero-figma.png',
    icon: 'link',
  });
  data.content.photosTitle = 'API gallery';
  data.customHtmlEmbed = '<p>API embed</p><script>bad()</script>';
  await write('/portfolio', 'PUT', data);
  const actual = (await request('/portfolio')).json;
  assert.equal(actual.data.hero.name, 'API persisted name');
  assert.equal(actual.data.about.stats[0].value, '42');
  assert.deepEqual(actual.data.hero.badges, data.hero.badges);
  assert.deepEqual(actual.data.footer.socials, data.footer.socials);
  assert.equal(actual.data.detailedCaseStudies['case-1'].meta.at(-1).value, 'Great');
  assert.equal(
    actual.data.detailedCaseStudies['case-1'].sections[0].html.includes('<strong>story</strong>'),
    true,
  );
  assert.doesNotMatch(
    actual.data.detailedCaseStudies['case-1'].sections[0].html,
    /script|onclick|javascript:/,
  );
  assert.equal(
    actual.data.customHtmlEmbed,
    '',
    'Removed custom HTML is ignored even in legacy imports',
  );
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(process.env.DATABASE_PATH);
  assert.equal(
    db.prepare("SELECT tag_id FROM project_tags WHERE owner_id='case-1'").get().tag_id,
    'tag-test',
  );
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  db.close();
});
test('rejects stale saves and invalid references without altering published data', async () => {
  const stale = await request('/portfolio', {
    method: 'PUT',
    admin: true,
    revision: current.revision - 1,
    body: current.data,
  });
  assert.equal(stale.response.status, 409);
  const invalid = structuredClone(current.data);
  invalid.caseStudiesList[0].tags = ['missing-tag'];
  assert.equal(
    (
      await request('/portfolio', {
        method: 'PUT',
        admin: true,
        revision: current.revision,
        body: invalid,
      })
    ).response.status,
    400,
  );
  const duplicate = structuredClone(current.data);
  duplicate.tags.push({ id: 'tag-duplicate', name: duplicate.tags[0].name.toUpperCase() });
  assert.equal(
    (
      await request('/portfolio', {
        method: 'PUT',
        admin: true,
        revision: current.revision,
        body: duplicate,
      })
    ).response.status,
    400,
  );
  const invalidLink = structuredClone(current.data);
  invalidLink.homeProjects[0].caseStudyUrl = 'http://';
  assert.equal(
    (
      await request('/portfolio', {
        method: 'PUT',
        admin: true,
        revision: current.revision,
        body: invalidLink,
      })
    ).response.status,
    400,
  );
  assert.equal((await request('/portfolio')).json.revision, current.revision);
});
test('supports tag, project and section CRUD and cleans deleted relations', async () => {
  await write('/tags', 'POST', { id: 'tag-crud', name: 'CRUD', link: 'https://example.com' });
  await write('/tags/tag-crud', 'PATCH', { name: 'CRUD renamed' });
  await write('/projects', 'POST', { id: 'case-crud', title: 'CRUD case', tags: ['tag-crud'] });
  await write('/projects/case-crud', 'PATCH', { subtitle: 'Edited' });
  await write('/projects/case-crud/sections', 'POST', { id: 'research', title: 'Research' });
  await write('/projects/case-crud/sections/research', 'PATCH', { html: '<p>Research result</p>' });
  assert.equal(
    (await request('/projects/case-crud/sections')).json[0].html,
    '<p>Research result</p>',
  );
  await write('/projects/case-crud/sections/research', 'DELETE');
  await write('/tags/tag-crud', 'DELETE');
  assert.deepEqual(current.data.caseStudiesList.find((item) => item.id === 'case-crud').tags, []);
  await write('/home-projects', 'POST', {
    id: 'home-crud',
    title: 'Home CRUD',
    caseStudyUrl: '/project-detail?id=case-crud',
  });
  await write('/home-projects/home-crud', 'PATCH', { title: 'Home updated' });
  await write('/projects/case-crud', 'DELETE');
  assert.equal(current.data.detailedCaseStudies['case-crud'], undefined);
  assert.equal(
    current.data.homeProjects.find((item) => item.id === 'home-crud').caseStudyUrl,
    '/projects',
  );
  await write('/home-projects/home-crud', 'DELETE');
});
test('supports ordered collection CRUD and singleton settings updates', async () => {
  await write('/collections/experiences', 'POST', {
    role: 'Test',
    company: 'Example',
    period: '2026',
  });
  const index = current.data.experiences.length - 1;
  await write(`/collections/experiences/${index}`, 'PATCH', { company: 'Updated' });
  assert.equal(current.data.experiences[index].company, 'Updated');
  await write(`/collections/experiences/${index}`, 'DELETE');
  await write('/settings/hero', 'PATCH', { greeting: 'Hello from API' });
  assert.equal((await request('/settings/hero')).json.greeting, 'Hello from API');
  await write('/collections/skills', 'POST', { value: 'New skill' });
  assert.equal(current.data.about.skills.at(-1), 'New skill');
  assert.equal((await request('/collections/unknown')).response.status, 404);
  assert.equal((await request('/settings/customHtmlEmbed')).response.status, 404);
  assert.equal(
    (
      await request('/settings/customHtmlEmbed', {
        method: 'PATCH',
        admin: true,
        revision: current.revision,
        body: { value: '<p>Removed</p>' },
      })
    ).response.status,
    404,
  );
});
test('uploads original file bytes, shares them publicly and protects used media from deletion', async () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVJkAAAAASUVORK5CYII=',
    'base64',
  );
  const form = new FormData();
  form.append('kind', 'image');
  form.append('file', new Blob([png], { type: 'image/png' }), 'photo.png');
  let response = await fetch(`${base}/api/media`, {
    method: 'POST',
    headers: { Cookie: cookie, 'X-Portfolio-Request': '1' },
    body: form,
  });
  assert.equal(response.status, 201);
  const file = await response.json();
  response = await fetch(`${base}${file.url}`);
  assert.equal(response.status, 200);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
  assert.match(response.headers.get('content-type'), /image\/png/);
  const data = structuredClone(current.data);
  data.lifePhotos.push({ image: file.url, caption: 'Original quality' });
  await write('/portfolio', 'PUT', data);
  assert.equal(
    (await request(`/media/${file.id}`, { method: 'DELETE', admin: true })).response.status,
    409,
  );
  assert.equal(
    (await request('/media', { admin: true })).json.find((item) => item.id === file.id).inUse,
    true,
  );
  current.data.lifePhotos.pop();
  await write('/portfolio', 'PUT', current.data);
  assert.equal(
    (await request(`/media/${file.id}`, { method: 'DELETE', admin: true })).response.status,
    200,
  );
  assert.equal((await fetch(`${base}${file.url}`)).status, 404);
  const bad = new FormData();
  bad.append('kind', 'image');
  bad.append('file', new Blob(['<script>evil()</script>'], { type: 'image/png' }), 'fake.png');
  assert.equal(
    (
      await fetch(`${base}/api/media`, {
        method: 'POST',
        headers: { Cookie: cookie, 'X-Portfolio-Request': '1' },
        body: bad,
      })
    ).status,
    400,
  );
});
test('uploads SVG badges, saves their references, preserves bytes and rejects unsafe replacements', async () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M0 0h32v32H0z" fill="#397bff"/></svg>';
  const form = new FormData();
  form.append('kind', 'svg');
  form.append('file', new Blob([svg], { type: 'image/svg+xml' }), 'badge.svg');
  const response = await fetch(`${base}/api/media`, {
    method: 'POST',
    headers: { Cookie: cookie, 'X-Portfolio-Request': '1' },
    body: form,
  });
  assert.equal(response.status, 201);
  const file = await response.json();
  assert.equal(file.type, 'image/svg+xml');
  assert.equal(file.kind, 'image');
  const download = await fetch(`${base}${file.url}`);
  assert.equal(await download.text(), svg);
  assert.match(download.headers.get('content-security-policy'), /sandbox/);
  const data = structuredClone(current.data);
  data.hero.badges[0].image = file.url;
  await write('/portfolio', 'PUT', data);
  assert.equal((await request('/portfolio')).json.data.hero.badges[0].image, file.url);
  assert.equal(
    (await request(`/media/${file.id}`, { method: 'DELETE', admin: true })).response.status,
    409,
  );
  const unsafe = new FormData();
  unsafe.append('kind', 'svg');
  unsafe.append(
    'file',
    new Blob(['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'], {
      type: 'image/svg+xml',
    }),
    'bad.svg',
  );
  assert.equal(
    (
      await fetch(`${base}/api/media`, {
        method: 'POST',
        headers: { Cookie: cookie, 'X-Portfolio-Request': '1' },
        body: unsafe,
      })
    ).status,
    400,
  );
});
test('retains data and sessions across restart and revokes sessions on logout', async () => {
  const revision = current.revision;
  await app.close();
  app = await bootstrap();
  base = await app.getUrl();
  const read = await request('/portfolio');
  assert.equal(read.json.revision, revision);
  assert.equal(read.json.data.hero.name, 'API persisted name');
  assert.equal((await request('/auth/session', { admin: true })).json.user.username, 'admin');
  assert.equal(
    (await request('/auth/logout', { method: 'POST', admin: true })).response.status,
    201,
  );
  assert.equal((await request('/auth/session', { admin: true })).json.user, null);
  assert.equal(
    (await request('/portfolio', { method: 'PUT', admin: true, revision, body: current.data }))
      .response.status,
    401,
  );
});
