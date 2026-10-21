const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { Database } = require('../dist/backend/src/database.js');

test('adds footer icon columns once without changing existing platforms', () => {
  const directory = mkdtempSync(join(tmpdir(), 'adel-footer-migration-'));
  const previous = process.env.DATABASE_PATH;
  process.env.DATABASE_PATH = join(directory, 'old.sqlite');
  let database;
  try {
    database = new Database();
    database.sql.exec(`
      ALTER TABLE footer_socials DROP COLUMN image;
      ALTER TABLE footer_socials DROP COLUMN icon;
      DELETE FROM migrations WHERE version=3;
      INSERT INTO footer_socials VALUES(0,'Existing platform','https://example.com');
      INSERT INTO settings VALUES('site','{"schemaVersion":4}');
      UPDATE portfolio_revision SET version=9 WHERE id=1;
    `);
    database.onModuleDestroy();
    database = new Database();
    const social = database.sql.prepare('SELECT * FROM footer_socials').get();
    assert.equal(social.label, 'Existing platform');
    assert.equal(social.link, 'https://example.com');
    assert.equal(social.image, null);
    assert.equal(social.icon, null);
    assert.equal(database.sql.prepare('SELECT version FROM portfolio_revision').get().version, 10);
    database.sql.prepare('UPDATE footer_socials SET image=?,icon=?').run('/custom.svg', 'link');
    database.onModuleDestroy();
    database = new Database();
    assert.equal(
      database.sql.prepare('SELECT image FROM footer_socials').get().image,
      '/custom.svg',
    );
    assert.equal(database.sql.prepare('SELECT version FROM portfolio_revision').get().version, 10);
  } finally {
    database?.onModuleDestroy();
    if (previous === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = previous;
    rmSync(directory, { recursive: true, force: true });
  }
});
