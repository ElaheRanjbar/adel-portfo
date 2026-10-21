import { Component, inject, input, output } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { MediaStore } from '../../core/media-store';
import { AdminHelp } from '../admin-help/admin-help';

@Component({
  selector: 'app-admin-save',
  imports: [AdminHelp],
  template: `<div class="page-save">
    <button type="button" [disabled]="store.saving() || media.pending() > 0" (click)="save.emit()">
      Save {{ label() }}</button
    ><app-admin-help
      [title]="'Save ' + label()"
      text="تمام تغییرات صفحهٔ فعلی سایدبار ذخیره می‌شود؛ پیش‌نویس صفحه‌های دیگر منتشر یا پاک نمی‌شود. تگ‌های جدیدی که این صفحه لازم دارد هم ذخیره می‌شوند."
    />
  </div>`,
  styles: `
    :host {
      display: block;
    }
    .page-save {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    button {
      background: #397bff;
      border: 1px solid #397bff;
      color: white;
      border-radius: 10px;
      padding: 11px 18px;
      font: inherit;
      font-size: 14px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.5;
      cursor: wait;
    }
    button:focus-visible {
      outline: 2px solid #a9c5ff;
      outline-offset: 4px;
    }
  `,
})
export class AdminSave {
  readonly label = input.required<string>();
  readonly save = output<void>();
  readonly store = inject(PortfolioStore);
  readonly media = inject(MediaStore);
}
