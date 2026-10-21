import { DEFAULT_FLOATING_BADGES } from '../../shared/floating-badges';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

@Injectable()
export class Database implements OnModuleDestroy {
  readonly sql: DatabaseSync;
  constructor() {
    const filename = process.env.DATABASE_PATH || './data/portfolio.sqlite';
    if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
    this.sql = new DatabaseSync(filename);
    this.sql.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS portfolio_revision (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL, updated_at TEXT NOT NULL);
      INSERT OR IGNORE INTO portfolio_revision VALUES(1,0,CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS settings (section TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)));
      CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(name))>0), link TEXT);
      CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, position INTEGER NOT NULL UNIQUE, title TEXT NOT NULL, subtitle TEXT NOT NULL, description TEXT NOT NULL, image TEXT NOT NULL, cta_text TEXT, detail_url TEXT, case_study_url TEXT);
      CREATE TABLE IF NOT EXISTS home_projects (id TEXT PRIMARY KEY, linked_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL, position INTEGER NOT NULL UNIQUE, title TEXT NOT NULL, subtitle TEXT NOT NULL, description TEXT NOT NULL, image TEXT NOT NULL, cta_text TEXT, detail_url TEXT, case_study_url TEXT);
      CREATE TABLE IF NOT EXISTS case_studies (id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE, title TEXT NOT NULL, subtitle TEXT NOT NULL, lead_summary TEXT NOT NULL, hero_image TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS case_metadata (case_id TEXT REFERENCES case_studies(id) ON DELETE CASCADE, position INTEGER NOT NULL, label TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(case_id,position));
      CREATE TABLE IF NOT EXISTS case_sections (case_id TEXT NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE, id TEXT NOT NULL, position INTEGER NOT NULL, title TEXT NOT NULL, nav_title TEXT, html TEXT, quote_first INTEGER, paragraphs TEXT NOT NULL CHECK(json_valid(paragraphs)), quote TEXT, PRIMARY KEY(case_id,id), UNIQUE(case_id,position));
      CREATE TABLE IF NOT EXISTS case_subsections (case_id TEXT NOT NULL, section_id TEXT NOT NULL, position INTEGER NOT NULL, heading TEXT NOT NULL, text TEXT NOT NULL, image TEXT NOT NULL, caption TEXT, PRIMARY KEY(case_id,section_id,position), FOREIGN KEY(case_id,section_id) REFERENCES case_sections(case_id,id) ON DELETE CASCADE);
      CREATE TABLE IF NOT EXISTS next_projects (case_id TEXT PRIMARY KEY REFERENCES case_studies(id) ON DELETE CASCADE, target_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL, title TEXT NOT NULL, subtitle TEXT NOT NULL, description TEXT, image TEXT NOT NULL, link TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS project_tags (owner_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, position INTEGER NOT NULL, PRIMARY KEY(owner_id,position));
      CREATE TABLE IF NOT EXISTS home_project_tags (owner_id TEXT NOT NULL REFERENCES home_projects(id) ON DELETE CASCADE, tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, position INTEGER NOT NULL, PRIMARY KEY(owner_id,position));
      CREATE TABLE IF NOT EXISTS case_tags (owner_id TEXT NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE, tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, position INTEGER NOT NULL, PRIMARY KEY(owner_id,position));
      CREATE TABLE IF NOT EXISTS next_project_tags (owner_id TEXT NOT NULL REFERENCES next_projects(case_id) ON DELETE CASCADE, tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, position INTEGER NOT NULL, PRIMARY KEY(owner_id,position));
      CREATE TABLE IF NOT EXISTS navigation_links (position INTEGER PRIMARY KEY, label TEXT NOT NULL, href TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS hero_badges (position INTEGER PRIMARY KEY, label TEXT NOT NULL, icon TEXT NOT NULL, position_class TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS partners (position INTEGER PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS about_mindsets (position INTEGER PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS about_skills (position INTEGER PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS about_stats (position INTEGER PRIMARY KEY, value TEXT NOT NULL, label TEXT NOT NULL, title TEXT, icon TEXT, background_image TEXT);
      CREATE TABLE IF NOT EXISTS experiences (position INTEGER PRIMARY KEY, role TEXT NOT NULL, company TEXT NOT NULL, period TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS testimonials (position INTEGER PRIMARY KEY, quote TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, initials TEXT NOT NULL, image TEXT, link TEXT, full_quote TEXT);
      CREATE TABLE IF NOT EXISTS life_photos (position INTEGER PRIMARY KEY, image TEXT NOT NULL, caption TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS footer_socials (position INTEGER PRIMARY KEY, label TEXT NOT NULL, link TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, original_name TEXT NOT NULL, storage_name TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL, size INTEGER NOT NULL CHECK(size>=0), kind TEXT NOT NULL CHECK(kind IN ('image','document','attachment')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS sessions_expiry ON admin_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS project_tags_tag ON project_tags(tag_id);
      CREATE INDEX IF NOT EXISTS case_tags_tag ON case_tags(tag_id);
      INSERT OR IGNORE INTO migrations(version) VALUES(1);
    `);
    if (!this.sql.prepare('SELECT 1 FROM migrations WHERE version=2').get()) {
      this.transaction(() => {
        this.sql.exec('ALTER TABLE hero_badges ADD COLUMN image TEXT');
        const site = this.sql.prepare("SELECT data FROM settings WHERE section='site'").get();
        if (site) {
          const existing = this.sql.prepare('SELECT * FROM hero_badges ORDER BY position').all();
          this.sql.exec('DELETE FROM hero_badges');
          const insert = this.sql.prepare(
            'INSERT INTO hero_badges(position,label,icon,position_class,image) VALUES(?,?,?,?,?)',
          );
          DEFAULT_FLOATING_BADGES.forEach((badge, index) =>
            insert.run(index, badge.label, badge.icon, badge.positionClass, badge.image!),
          );
          existing.forEach((badge, index) =>
            insert.run(index + 2, badge.label, badge.icon, badge.position_class, badge.image),
          );
          this.sql
            .prepare("UPDATE settings SET data=? WHERE section='site'")
            .run(JSON.stringify({ ...JSON.parse(String(site.data)), schemaVersion: 4 }));
          this.sql
            .prepare('UPDATE portfolio_revision SET version=version+1, updated_at=? WHERE id=1')
            .run(new Date().toISOString());
        }
        this.sql.prepare('INSERT INTO migrations(version) VALUES(2)').run();
      });
    }
    if (!this.sql.prepare('SELECT 1 FROM migrations WHERE version=3').get()) {
      this.transaction(() => {
        this.sql.exec(
          'ALTER TABLE footer_socials ADD COLUMN image TEXT; ALTER TABLE footer_socials ADD COLUMN icon TEXT;',
        );
        if (this.sql.prepare("SELECT 1 FROM settings WHERE section='site'").get()) {
          this.sql
            .prepare('UPDATE portfolio_revision SET version=version+1, updated_at=? WHERE id=1')
            .run(new Date().toISOString());
        }
        this.sql.prepare('INSERT INTO migrations(version) VALUES(3)').run();
      });
    }
  }
  transaction<T>(operation: () => T): T {
    this.sql.exec('BEGIN IMMEDIATE');
    try {
      const result = operation();
      this.sql.exec('COMMIT');
      return result;
    } catch (error) {
      this.sql.exec('ROLLBACK');
      throw error;
    }
  }
  onModuleDestroy(): void {
    this.sql.close();
  }
}
