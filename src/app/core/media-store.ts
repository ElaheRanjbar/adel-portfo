import { DestroyRef, Injectable, inject, signal } from '@angular/core';

interface MediaRecord {
  id: string;
  blob: Blob;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class MediaStore {
  private db?: Promise<IDBDatabase>;
  private readonly urls = signal<Record<string, string>>({});
  private readonly names = signal<Record<string, string>>({});
  private readonly loading = new Set<string>();
  readonly error = signal('');
  readonly pending = signal(0);

  constructor() {
    inject(DestroyRef).onDestroy(() =>
      Object.values(this.urls()).forEach((url) => URL.revokeObjectURL(url)),
    );
  }

  url(value: string | undefined): string {
    if (!value?.startsWith('asset:')) return value || '';
    const cached = this.urls()[value];
    if (!cached && !this.loading.has(value)) {
      this.loading.add(value);
      void this.read(value)
        .then((record) => {
          if (record) {
            this.names.update((names) => ({ ...names, [value]: record.name }));
            this.urls.update((urls) => ({ ...urls, [value]: URL.createObjectURL(record.blob) }));
          } else
            this.error.set('یکی از فایل‌ها در این مرورگر موجود نیست. آن را دوباره آپلود کنید.');
        })
        .catch(() => this.error.set('خواندن فایل‌های آپلودشده در این مرورگر ممکن نیست.'));
    }
    return cached || '';
  }

  name(value: string): string {
    return this.names()[value] || '';
  }

  async upload(file: File, kind: 'image' | 'document'): Promise<string> {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (kind === 'image' && !imageTypes.includes(file.type))
      throw new Error('یک تصویر با قالب JPG، PNG، WebP، GIF یا AVIF انتخاب کنید.');
    if (kind === 'document' && !/\.(pdf|doc|docx)$/i.test(file.name))
      throw new Error('یک فایل PDF، DOC یا DOCX انتخاب کنید.');
    if (file.size > (kind === 'image' ? 8 : 15) * 1024 * 1024)
      throw new Error(
        kind === 'image'
          ? 'حجم تصویر باید کمتر از ۸ مگابایت باشد.'
          : 'حجم رزومه باید کمتر از ۱۵ مگابایت باشد.',
      );
    const record = { id: `asset:${crypto.randomUUID()}`, blob: file, name: file.name };
    this.pending.update((count) => count + 1);
    try {
      await this.write(record);
      this.names.update((names) => ({ ...names, [record.id]: file.name }));
      this.urls.update((urls) => ({ ...urls, [record.id]: URL.createObjectURL(file) }));
      return record.id;
    } finally {
      this.pending.update((count) => count - 1);
    }
  }

  async exportAssets(
    data: unknown,
  ): Promise<{ id: string; name: string; type: string; data: string }[]> {
    const references = [...new Set(JSON.stringify(data).match(/asset:[\w-]+/g) || [])];
    return Promise.all(
      references.map(async (id) => {
        const record = await this.read(id);
        if (!record)
          throw new Error(
            'یکی از فایل‌ها موجود نیست. پیش از دریافت پشتیبان، آن را دوباره آپلود کنید.',
          );
        const encoded = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('افزودن یکی از فایل‌ها به پشتیبان ممکن نیست.'));
          reader.readAsDataURL(record.blob);
        });
        return { id, name: record.name, type: record.blob.type, data: encoded };
      }),
    );
  }

  private open(): Promise<IDBDatabase> {
    return (this.db ??= new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('ذخیره‌سازی فایل در این مرورگر در دسترس نیست.'));
        return;
      }
      const request = indexedDB.open('maryam-portfolio-media', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('assets', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('دسترسی به محل ذخیره‌سازی فایل ممکن نیست.'));
    }));
  }

  private async read(id: string): Promise<MediaRecord | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction('assets').objectStore('assets').get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async write(record: MediaRecord): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('assets', 'readwrite');
      transaction.objectStore('assets').put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(new Error('فایل ذخیره نشد. ممکن است فضای مرورگر پر شده باشد.'));
      transaction.onabort = () => reject(new Error('ذخیره‌سازی فایل متوقف شد.'));
    });
  }
}
