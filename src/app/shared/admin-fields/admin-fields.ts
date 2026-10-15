import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MediaField } from '../media-field/media-field';

export interface EditorField {
  key: string;
  label: string;
  options?: { value: string; label: string }[];
  type?: 'text' | 'textarea' | 'image' | 'lines' | 'checkbox' | 'select';
}

@Component({
  selector: 'app-admin-fields',
  imports: [FormsModule, MediaField],
  templateUrl: './admin-fields.html',
  styleUrl: './admin-fields.css',
})
export class AdminFields {
  // The schema controls keys; values belong to the typed parent portfolio model.
  readonly value = input.required<Record<string, any>>();
  readonly fields = input.required<EditorField[]>();
  readonly changed = output<void>();
  update(key: string, value: unknown): void {
    this.value()[key] = value;
    this.changed.emit();
  }
  lines(value: unknown): string {
    return Array.isArray(value) ? value.join('\n') : '';
  }
  updateLines(key: string, text: string): void {
    this.update(key, text.split('\n'));
  }
}
