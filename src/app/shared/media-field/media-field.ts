import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MediaStore } from '../../core/media-store';
import { MediaUrl } from '../../core/media-url';

@Component({
  selector: 'app-media-field',
  imports: [FormsModule, MediaUrl],
  templateUrl: './media-field.html',
  styleUrl: './media-field.css',
})
export class MediaField {
  readonly value = input('');
  readonly valueChange = output<string>();
  readonly fileNameChange = output<string>();
  readonly kind = input<'image' | 'document'>('image');
  readonly label = input('تصویر');
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
      const reference = await this.media.upload(file, this.kind());
      this.valueChange.emit(reference);
      this.fileNameChange.emit(file.name);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'آپلود فایل ناموفق بود.');
    } finally {
      this.busy.set(false);
      input.value = '';
    }
  }
}
