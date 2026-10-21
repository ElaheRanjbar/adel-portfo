import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (!existsSync('backend/.env')) {
  const password = randomBytes(24).toString('base64url');
  const env = readFileSync('backend/.env.example', 'utf8').replace(
    /^ADMIN_PASSWORD=$/m,
    `ADMIN_PASSWORD=${password}`,
  );
  writeFileSync('backend/.env', env, { mode: 0o600 });
  console.log(
    'Created backend/.env with a unique admin password. Read ADMIN_PASSWORD there to sign in.',
  );
} else console.log('Kept the existing backend/.env and database.');
