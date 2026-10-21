import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { BadRequestException } from '@nestjs/common';
import { json, static as serveStatic } from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { allowedOrigins } from './auth';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    abortOnError: false,
    ...(process.env.NODE_ENV === 'test' ? { logger: false as const } : {}),
  });
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        },
      },
    }),
  );
  app.enableCors({
    origin: allowedOrigins(),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'If-Match', 'X-Portfolio-Request'],
  });
  app.use(json({ limit: '10mb' }));
  app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
    if (req.is('application/json') && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
        return res.status(400).json({ message: 'Expected a JSON object.' });
      const forbidden = (value: any): boolean =>
        value &&
        typeof value === 'object' &&
        Object.keys(value).some(
          (key) => ['__proto__', 'constructor', 'prototype'].includes(key) || forbidden(value[key]),
        );
      if (forbidden(req.body)) return res.status(400).json({ message: 'Invalid object keys.' });
    }
    next();
  });
  const frontend = resolve(process.env.FRONTEND_DIR || '../dist/adel-portfo/browser');
  if (existsSync(resolve(frontend, 'index.html'))) {
    app.use(serveStatic(frontend, { index: false }));
    app.use((req: any, res: any, next: any) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !/\.[a-zA-Z0-9]+$/.test(req.path))
        return res.sendFile(resolve(frontend, 'index.html'));
      next();
    });
  }
  await app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1');
  return app;
}
if (require.main === module)
  void bootstrap().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
