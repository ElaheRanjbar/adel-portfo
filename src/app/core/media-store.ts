import { Injectable, inject, signal } from '@angular/core';
import { ApiClient } from './api-client';
export interface ServerMedia {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: string;
  url: string;
  createdAt: string;
  inUse?: boolean;
}
@Injectable({ providedIn: 'root' })
export class MediaStore {
  private readonly api = inject(ApiClient);
  private readonly names = signal<Record<string, string>>({});
  readonly error = signal('');
  readonly pending = signal(0);
  readonly files = signal<ServerMedia[]>([]);
  url(value: string | undefined): string {
    if (value?.startsWith('asset:')) {
      this.error.set(
        'This content contains a browser-only file. Import your browser content or upload the file again.',
      );
      return '';
    }
    return value || '';
  }
  name(value: string): string {
    return this.names()[value] || '';
  }
  reference(value: string): string {
    return value;
  }
  async resolve(value: string): Promise<string> {
    const url = this.url(value);
    if (!url) throw new Error('File is unavailable.');
    return url;
  }
  async upload(file: File, kind: 'image' | 'document' | 'attachment' | 'svg'): Promise<string> {
    if (kind === 'svg' && !/\.svg$/i.test(file.name)) throw new Error('Choose an SVG file.');
    if (kind === 'svg' && file.size > 1024 * 1024) throw new Error('SVG size must be under 1 MB.');
    const images = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (kind === 'image' && !images.includes(file.type))
      throw new Error('Choose a JPG, PNG, WebP, GIF or AVIF image.');
    if (kind === 'document' && !/\.(pdf|doc|docx)$/i.test(file.name))
      throw new Error('Choose a PDF, DOC or DOCX file.');
    if (file.size > (kind === 'image' ? 8 : 15) * 1024 * 1024)
      throw new Error(
        kind === 'image' ? 'Image size must be under 8 MB.' : 'File size must be under 15 MB.',
      );
    const body = new FormData();
    body.append('file', file);
    body.append('kind', kind);
    this.pending.update((count) => count + 1);
    this.error.set('');
    try {
      const record = await this.api.request<ServerMedia>('/media', { method: 'POST', body });
      this.names.update((names) => ({ ...names, [record.url]: record.name }));
      return record.url;
    } finally {
      this.pending.update((count) => count - 1);
    }
  }
  async list(): Promise<void> {
    this.files.set(await this.api.request<ServerMedia[]>('/media'));
    this.names.set(Object.fromEntries(this.files().map((file) => [file.url, file.name])));
  }
  async remove(id: string): Promise<void> {
    await this.api.request(`/media/${encodeURIComponent(id)}`, { method: 'DELETE' });
    this.files.update((items) => items.filter((item) => item.id !== id));
  }
  async exportAssets(
    data: unknown,
  ): Promise<{ id: string; name: string; type: string; data: string }[]> {
    await this.list();
    const serialized = JSON.stringify(data);
    return Promise.all(
      this.files()
        .filter((file) => serialized.includes(file.url))
        .map(async (file) => {
          const response = await fetch(file.url);
          if (!response.ok) throw new Error(`Could not export ${file.name}.`);
          const blob = await response.blob();
          const encoded = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('File export failed.'));
            reader.readAsDataURL(blob);
          });
          return { id: file.url, name: file.name, type: file.type, data: encoded };
        }),
    );
  }
}
