import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RichHtml } from '../../core/rich-html';

@Component({
  selector: 'app-rich-content',
  template: '<div class="rich-content" dir="auto" [innerHTML]="content()"></div>',
})
export class RichContent {
  readonly html = input('');
  private readonly richHtml = inject(RichHtml);
  private readonly sanitizer = inject(DomSanitizer);
  readonly content = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.richHtml.view(this.html())),
  );
}
