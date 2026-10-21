import {
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  afterRenderEffect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminHelpState {
  readonly current = signal<{ title: string; text: string } | null>(null);
}

@Component({
  selector: 'app-admin-help',
  template: `<button
    type="button"
    class="help-trigger"
    [attr.aria-label]="'Help: ' + title()"
    aria-haspopup="dialog"
    aria-controls="admin-help-dialog"
    (click)="open($event)"
  >
    ?
  </button>`,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
      margin-inline-start: 6px;
    }
    button {
      display: inline-grid;
      place-items: center;
      width: 24px;
      height: 24px;
      padding: 0;
      border: 1px solid #536b91;
      border-radius: 50%;
      background: #18243b;
      color: #bcd7ff;
      font:
        600 14px Inter,
        sans-serif;
      cursor: pointer;
    }
    button:hover {
      background: #2b4063;
    }
    button:focus-visible {
      outline: 2px solid #8bb8ff;
      outline-offset: 3px;
    }
  `,
})
export class AdminHelp {
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  private readonly help = inject(AdminHelpState);
  open(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.help.current.set({ title: this.title(), text: this.text() });
  }
}

@Component({
  selector: 'app-admin-help-dialog',
  template: `
    <dialog
      #dialog
      id="admin-help-dialog"
      aria-labelledby="admin-help-title"
      aria-describedby="admin-help-description"
      (cancel)="help.current.set(null)"
      (close)="help.current.set(null)"
      (click)="$event.target === dialog && help.current.set(null)"
    >
      @if (help.current(); as content) {
        <div class="help-heading">
          <h2 id="admin-help-title" lang="en" dir="ltr">{{ content.title }}</h2>
          <button type="button" aria-label="Close help" (click)="help.current.set(null)" autofocus>
            ×
          </button>
        </div>
        <p id="admin-help-description" lang="fa" dir="rtl">{{ content.text }}</p>
        <button type="button" class="done" (click)="help.current.set(null)">Close</button>
      }
    </dialog>
  `,
  styles: `
    dialog {
      margin: auto;
      width: min(520px, calc(100vw - 32px));
      max-height: calc(100dvh - 40px);
      overflow-y: auto;
      padding: 24px;
      border: 1px solid #354a6d;
      border-radius: 20px;
      background: #0e1625;
      color: #edf3ff;
    }
    dialog::backdrop {
      background: #000b;
    }
    .help-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    h2 {
      font:
        600 20px Inter,
        sans-serif;
    }
    p {
      font:
        400 15px/2 Vazirmatn,
        Tahoma,
        sans-serif;
      color: #c8d4e7;
      margin: 20px 0;
      white-space: pre-line;
    }
    button {
      border: 1px solid #536b91;
      border-radius: 10px;
      background: #18243b;
      color: #edf3ff;
      padding: 4px 12px;
      font: inherit;
      cursor: pointer;
    }
    .help-heading button {
      font-size: 24px;
    }
    .done {
      padding: 8px 20px;
    }
  `,
})
export class AdminHelpDialog {
  readonly help = inject(AdminHelpState);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  constructor() {
    inject(DestroyRef).onDestroy(() => this.help.current.set(null));
    afterRenderEffect((onCleanup) => {
      const dialog = this.dialog().nativeElement;
      if (this.help.current()) {
        if (!dialog.open) {
          if (typeof dialog.showModal === 'function') dialog.showModal();
          else dialog.setAttribute('open', '');
        }
        const overflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        onCleanup(() => {
          document.documentElement.style.overflow = overflow;
        });
      } else if (dialog.open) {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      }
    });
  }
}
