import { Component, input, output } from '@angular/core';
import { AdminFields, EditorField } from '../admin-fields/admin-fields';

@Component({
  selector: 'app-admin-collection',
  imports: [AdminFields],
  templateUrl: './admin-collection.html',
  styleUrl: './admin-collection.css',
})
export class AdminCollection {
  readonly items = input.required<any[]>();
  readonly fields = input.required<EditorField[]>();
  readonly emptyItem = input.required<Record<string, unknown>>();
  readonly label = input('مورد');
  readonly changed = output<void>();
  add(): void {
    this.items().push(structuredClone(this.emptyItem()));
    this.changed.emit();
  }
  remove(index: number): void {
    this.items().splice(index, 1);
    this.changed.emit();
  }
  move(index: number, direction: number): void {
    const target = index + direction;
    if (target < 0 || target >= this.items().length) return;
    [this.items()[index], this.items()[target]] = [this.items()[target], this.items()[index]];
    this.changed.emit();
  }
}
