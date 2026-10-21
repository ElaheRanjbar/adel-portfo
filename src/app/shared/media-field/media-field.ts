import { createId } from '../../core/create-id';
import { AdminHelp } from '../admin-help/admin-help';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MediaStore } from '../../core/media-store';
import { MediaUrl } from '../../core/media-url';

@Component({
  selector: 'app-media-field',
  imports: [FormsModule, MediaUrl, AdminHelp],
  templateUrl: './media-field.html',
  styleUrl: './media-field.css',
})
export class MediaField {
  readonly urlId = `media-url-${createId()}`;
  readonly value = input('');
  readonly valueChange = output<string>();
  readonly fileNameChange = output<string>();
  readonly kind = input<'image' | 'document' | 'svg' | 'icon'>('image');
  readonly label = input('Image');
  readonly defaultValue = input('');
  readonly help = input(
    'آدرس فایل را وارد کنید یا Upload / replace file را بزنید. فایل اصلی بدون تغییر کیفیت از طریق API روی سرور ذخیره می‌شود. Remove file مقدار این فیلد را پاک می‌کند.',
  );
  readonly busy = signal(false);
  readonly error = signal('');
  readonly media = inject(MediaStore);

  async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const reference = await this.media.upload(
        file,
        this.kind() === 'icon'
          ? /\.svg$/i.test(file.name)
            ? 'svg'
            : 'image'
          : (this.kind() as 'image' | 'document' | 'svg'),
      );
      this.valueChange.emit(reference);
      this.fileNameChange.emit(file.name);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'File upload failed.');
    } finally {
      this.busy.set(false);
      input.value = '';
    }
  }
}
