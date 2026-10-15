import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-tag-picker',
  templateUrl: './tag-picker.html',
  styleUrl: './tag-picker.css',
})
export class TagPicker {
  readonly tags = input.required<{ id: string; name: string }[]>();
  readonly selected = input<string[]>([]);
  readonly selectedChange = output<string[]>();
  toggle(id: string): void {
    this.selectedChange.emit(
      this.selected().includes(id)
        ? this.selected().filter((item) => item !== id)
        : [...this.selected(), id],
    );
  }
}
