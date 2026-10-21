import { validateSvgGraphic } from './svg-graphic';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, unlinkSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { AdminGuard } from './auth';
import { Database } from './database';
import { PortfolioRepository } from './portfolio.repository';

@Controller('media')
export class MediaController {
  private readonly directory = resolve(process.env.UPLOAD_DIR || './data/uploads');
  constructor(
    private readonly db: Database,
    private readonly portfolio: PortfolioRepository,
  ) {
    mkdirSync(this.directory, { recursive: true });
  }
  private metadata(row: any) {
    return {
      id: row.id,
      name: row.original_name,
      type: row.mime_type,
      size: row.size,
      kind: row.kind,
      url: `/api/media/${row.id}/file`,
      createdAt: row.created_at,
    };
  }
  private record(id: string): any {
    const row = this.db.sql.prepare('SELECT * FROM media WHERE id=?').get(id);
    if (!row) throw new NotFoundException('File not found.');
    return row;
  }
  @Get()
  @UseGuards(AdminGuard)
  list() {
    const data = JSON.stringify(this.portfolio.read());
    return this.db.sql
      .prepare('SELECT * FROM media ORDER BY created_at DESC,rowid DESC')
      .all()
      .map((row) => ({ ...this.metadata(row), inUse: data.includes(`/api/media/${row.id}/file`) }));
  }
  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024, files: 1, fields: 1 } }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Body('kind') kind: string) {
    if (!file || !file.size) throw new BadRequestException('Choose a non-empty file.');
    if (!['image', 'document', 'attachment', 'svg'].includes(kind))
      throw new BadRequestException('Choose image, SVG, document or attachment.');
    if (kind === 'svg') validateSvgGraphic(file.buffer);
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(file.buffer).catch(() => undefined);
    const images: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
    };
    const docs: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };
    let type = detected?.mime || '';
    // Legacy Word files share the OLE container signature with other Office documents.
    if (
      type === 'application/x-cfb' &&
      /\.doc$/i.test(file.originalname) &&
      (file.buffer.includes(Buffer.from('WordDocument', 'utf16le')) ||
        file.buffer.includes(Buffer.from('WordDocument')))
    )
      type = 'application/msword';
    let extension = detected ? ({ ...images, ...docs } as Record<string, string>)[type] : undefined;
    if (kind === 'image' && (!images[type] || file.size > 8 * 1024 * 1024))
      throw new BadRequestException('Choose a JPG, PNG, WebP, GIF or AVIF image under 8 MB.');
    if (kind === 'document' && !docs[type])
      throw new BadRequestException('Choose a genuine PDF, DOC or DOCX file.');
    if (kind === 'attachment' && !extension) {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (detected?.ext === 'zip' && ext === 'zip') {
        type = 'application/zip';
        extension = 'zip';
      } else if (
        !detected &&
        ext &&
        ['txt', 'csv', 'json'].includes(ext) &&
        !file.buffer.includes(0)
      ) {
        type = ext === 'json' ? 'application/json' : ext === 'csv' ? 'text/csv' : 'text/plain';
        extension = ext;
      } else
        throw new BadRequestException(
          'Supported attachments: images, PDF, DOC, DOCX, ZIP, TXT, CSV and JSON.',
        );
    }
    if (kind === 'svg') {
      type = 'image/svg+xml';
      extension = 'svg';
    }
    const id = randomUUID();
    const storage = `${id}.${extension}`;
    const filename =
      basename(file.originalname)
        .replace(/[\r\n\x00-\x1f]/g, '')
        .slice(0, 240) || storage;
    const path = resolve(this.directory, storage);
    writeFileSync(path, file.buffer, { flag: 'wx' });
    try {
      this.db.sql
        .prepare(
          'INSERT INTO media(id,original_name,storage_name,mime_type,size,kind) VALUES(?,?,?,?,?,?)',
        )
        .run(id, filename, storage, type, file.size, kind === 'svg' ? 'image' : kind);
    } catch (error) {
      unlinkSync(path);
      throw error;
    }
    return this.metadata(this.record(id));
  }
  @Get(':id/file')
  file(@Param('id') id: string, @Res() res: Response) {
    const record = this.record(id);
    const path = resolve(this.directory, record.storage_name);
    if (!existsSync(path)) throw new NotFoundException('File content is missing on the server.');
    res.setHeader('Content-Type', record.mime_type);
    if (record.mime_type === 'image/svg+xml')
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
      );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader(
      'Content-Disposition',
      `${record.kind === 'image' ? 'inline' : 'attachment'}; filename="download.${record.storage_name.split('.').pop()}"; filename*=UTF-8''${encodeURIComponent(record.original_name)}`,
    );
    res.sendFile(path);
  }
  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    const row = this.record(id);
    if (JSON.stringify(this.portfolio.read()).includes(`/api/media/${id}/file`))
      throw new ConflictException(
        'This file is used by the portfolio. Remove its references and save the content before deleting the file.',
      );
    const path = resolve(this.directory, row.storage_name);
    if (existsSync(path)) unlinkSync(path);
    this.db.sql.prepare('DELETE FROM media WHERE id=?').run(id);
    return { ok: true };
  }
}
