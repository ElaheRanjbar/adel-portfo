const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { validateSvgGraphic } = require('../dist/backend/src/svg-graphic.js');
const { Database } = require('../dist/backend/src/database.js');
const { DatabaseSync } = require('node:sqlite');

test('accepts both original SVG graphics without modifying their geometry', () => {
  for (const name of ['hero-figma.png', 'hero-design.png'])
    assert.doesNotThrow(() =>
      validateSvgGraphic(readFileSync(join(__dirname, '../../public/assets/portfolio', name))),
    );
});
test('rejects active SVG, external resources, invalid XML and non-SVG files', () => {
  for (const source of [
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><use href="https://example.com/remote.svg#x"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><style>@import "https://example.com/x.css";</style></svg>',
    '<!DOCTYPE svg [<!ENTITY secret SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg">&secret;</svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><path></svg>',
    '<html>Not an SVG</html>',
  ])
    assert.throws(() => validateSvgGraphic(Buffer.from(source)), /valid, self-contained SVG/);
});
test('migrates existing databases once while keeping old badges and all other content', () => {
  const directory = mkdtempSync(join(tmpdir(), 'adel-badge-migration-'));
  const previous = process.env.DATABASE_PATH;
  process.env.DATABASE_PATH = join(directory, 'old.sqlite');
  let database;
  try {
    database = new Database();
    database.onModuleDestroy();
    database = null;
    const old = new DatabaseSync(process.env.DATABASE_PATH);
    old.exec(
      'ALTER TABLE hero_badges DROP COLUMN image; DELETE FROM migrations WHERE version=2; UPDATE portfolio_revision SET version=7 WHERE id=1;',
    );
    old
      .prepare('INSERT INTO settings VALUES(?,?)')
      .run('site', JSON.stringify({ schemaVersion: 3, customHtmlEmbed: '<p>Keep this</p>' }));
    old
      .prepare('INSERT INTO hero_badges VALUES(?,?,?,?)')
      .run(0, 'Existing badge', '✨', 'card-top-right');
    old.close();
    database = new Database();
    let rows = database.sql.prepare('SELECT * FROM hero_badges ORDER BY position').all();
    assert.equal(rows.length, 3);
    assert.equal(rows[0].image, '/assets/portfolio/hero-figma.png');
    assert.equal(rows[1].image, '/assets/portfolio/hero-design.png');
    assert.equal(rows[2].label, 'Existing badge');
    assert.equal(
      JSON.parse(database.sql.prepare("SELECT data FROM settings WHERE section='site'").get().data)
        .customHtmlEmbed,
      '<p>Keep this</p>',
    );
    assert.equal(database.sql.prepare('SELECT version FROM portfolio_revision').get().version, 8);
    database.onModuleDestroy();
    database = new Database();
    assert.equal(database.sql.prepare('SELECT count(*) AS count FROM hero_badges').get().count, 3);
    assert.equal(database.sql.prepare('SELECT version FROM portfolio_revision').get().version, 8);
  } finally {
    database?.onModuleDestroy();
    process.env.DATABASE_PATH = previous;
    rmSync(directory, { recursive: true, force: true });
  }
});
