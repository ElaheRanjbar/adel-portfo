import { Component, ElementRef, afterRenderEffect, input, output, viewChild } from '@angular/core';
export interface ConfirmationRequest {
  title: string;
  message: string;
}
@Component({
  selector: 'app-admin-confirm',
  templateUrl: './admin-confirm.html',
  styleUrl: './admin-confirm.css',
})
export class AdminConfirm {
  readonly request = input<ConfirmationRequest | null>(null);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.request() && !dialog.open) {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      } else if (!this.request() && dialog.open) {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      }
    });
  }
}
