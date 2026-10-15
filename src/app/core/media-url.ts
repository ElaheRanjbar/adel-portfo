import { Pipe, PipeTransform, inject } from '@angular/core';
import { MediaStore } from './media-store';

@Pipe({ name: 'mediaUrl', pure: false })
export class MediaUrl implements PipeTransform {
  private readonly media = inject(MediaStore);
  transform(value: string | undefined): string {
    return this.media.url(value);
  }
}
