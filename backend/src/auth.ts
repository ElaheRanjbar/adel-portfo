import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Injectable,
  Post,
  Req,
  Res,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { Database } from './database';

const cookieName = 'portfolio_session';
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};
function verify(password: string, hash: string): boolean {
  const [salt, expected] = hash.split(':');
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
export function sessionToken(req: Request): string {
  return (
    req.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1) || ''
  );
}
export function allowedOrigins(): string[] {
  return (process.env.FRONTEND_ORIGINS || 'http://localhost:4200,http://127.0.0.1:4200')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}
export function checkWriteRequest(req: Request): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  if (req.get('X-Portfolio-Request') !== '1')
    throw new ForbiddenException('Missing API request header.');
  const origin = req.get('Origin');
  const ownOrigin = `${req.protocol}://${req.get('host')}`;
  if (origin && origin !== ownOrigin && !allowedOrigins().includes(origin))
    throw new ForbiddenException('Origin is not allowed.');
}

@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, { count: number; expires: number }>();
  constructor(private readonly db: Database) {
    if (!db.sql.prepare('SELECT 1 FROM admin_users LIMIT 1').get()) {
      const password = process.env.ADMIN_PASSWORD;
      if (!password || password.length < 12)
        throw new Error(
          'Set ADMIN_PASSWORD (at least 12 characters) before starting the API for the first time.',
        );
      db.sql
        .prepare('INSERT INTO admin_users(username,password_hash) VALUES(?,?)')
        .run(process.env.ADMIN_USERNAME || 'admin', hashPassword(password));
    }
  }
  user(req: Request): { username: string } | null {
    const token = sessionToken(req);
    if (!/^[a-f0-9]{64}$/.test(token)) return null;
    const row = this.db.sql
      .prepare(
        'SELECT u.username FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',
      )
      .get(digest(token), Date.now());
    return row ? { username: String(row.username) } : null;
  }
  login(username: unknown, password: unknown, req: Request, res: Response) {
    const key = req.ip || 'unknown';
    const now = Date.now();
    for (const [ip, record] of this.attempts) if (record.expires < now) this.attempts.delete(ip);
    const attempt = this.attempts.get(key) || { count: 0, expires: now + 15 * 60_000 };
    if (attempt.count >= 10)
      throw new HttpException('Too many login attempts. Try again in 15 minutes.', 429);
    attempt.count++;
    this.attempts.set(key, attempt);
    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      password.length > 500 ||
      username.length > 100
    )
      throw new BadRequestException('Invalid login credentials.');
    const user = this.db.sql.prepare('SELECT * FROM admin_users WHERE username=?').get(username);
    // Do a password calculation for unknown users as well.
    const fallback = `00000000000000000000000000000000:${'00'.repeat(64)}`;
    const valid = verify(password, String(user?.password_hash || fallback));
    if (!user || !valid) throw new UnauthorizedException('Invalid username or password.');
    this.attempts.delete(key);
    const token = randomBytes(32).toString('hex');
    this.db.sql
      .prepare('DELETE FROM admin_sessions WHERE expires_at<=? OR token_hash=?')
      .run(now, digest(sessionToken(req)));
    this.db.sql
      .prepare('INSERT INTO admin_sessions VALUES(?,?,?)')
      .run(digest(token), user.id, now + 8 * 3600_000);
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 8 * 3600_000,
    });
    return { username: String(user.username) };
  }
  logout(req: Request, res: Response) {
    this.db.sql
      .prepare('DELETE FROM admin_sessions WHERE token_hash=?')
      .run(digest(sessionToken(req)));
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
    });
    return { ok: true };
  }
}
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    checkWriteRequest(req);
    if (!this.auth.user(req)) throw new UnauthorizedException('Sign in to manage the portfolio.');
    return true;
  }
}
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Get('session') session(@Req() req: Request) {
    return { user: this.auth.user(req) };
  }
  @Post('login') login(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    checkWriteRequest(req);
    return this.auth.login(body?.username, body?.password, req, res);
  }
  @Post('logout') logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    checkWriteRequest(req);
    return this.auth.logout(req, res);
  }
}
