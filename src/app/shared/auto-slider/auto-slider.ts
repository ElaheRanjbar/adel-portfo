import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  afterNextRender,
  afterRenderEffect,
  contentChild,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-auto-slider',
  imports: [NgTemplateOutlet],
  templateUrl: './auto-slider.html',
  styleUrl: './auto-slider.css',
})
export class AutoSlider {
  readonly label = input.required<string>();
  readonly speed = input(26);
  readonly gap = input(20);
  readonly slides = contentChild.required(TemplateRef);
  readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  readonly copies = signal([0, 1, 2]);
  readonly paused = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  private unit = 0;
  private position = 0;
  private hovered = false;
  private focused = false;
  private manualUntil = 0;
  private drag?: { x: number; left: number; pointer: number };

  constructor() {
    afterRenderEffect(() => {
      this.copies();
      // Repeated slides remain clickable without duplicating the keyboard tab order.
      this.viewport()
        .nativeElement.querySelectorAll<HTMLElement>(
          '[aria-hidden="true"] a, [aria-hidden="true"] button',
        )
        .forEach((element) => (element.tabIndex = -1));
    });
    afterNextRender(() => {
      const viewport = this.viewport().nativeElement;
      const group = viewport.querySelector<HTMLElement>('.slider-group')!;
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.paused.set(preference.matches);
      const changePreference = () => this.paused.set(preference.matches);
      preference.addEventListener('change', changePreference);
      const measure = () => {
        const width = group.getBoundingClientRect().width;
        const unit = width > 0 ? width + this.gap() : 0;
        const count = unit ? Math.max(3, Math.ceil(viewport.clientWidth / unit) + 2) : 3;
        if (count !== this.copies().length)
          this.copies.set(Array.from({ length: count }, (_, i) => i));
        if (unit !== this.unit) {
          this.unit = unit;
          this.position = unit + Math.max(0, (width - viewport.clientWidth) / 2);
          viewport.scrollLeft = this.position;
        }
      };
      const observer = new ResizeObserver(measure);
      observer.observe(viewport);
      observer.observe(group);
      measure();
      let frame = 0;
      let previous = performance.now();
      const animate = (now: number) => {
        const elapsed = Math.min((now - previous) / 1000, 0.05);
        previous = now;
        if (
          this.unit &&
          !this.paused() &&
          !this.hovered &&
          !this.focused &&
          !this.drag &&
          now > this.manualUntil &&
          !document.hidden
        ) {
          this.position =
            this.unit +
            ((((this.position - this.unit + elapsed * this.speed()) % this.unit) + this.unit) %
              this.unit);
          viewport.scrollLeft = this.position;
        } else this.position = viewport.scrollLeft;
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
      this.destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        preference.removeEventListener('change', changePreference);
      });
    });
  }

  hover(value: boolean): void {
    this.hovered = value;
  }
  focus(value: boolean): void {
    this.focused = value;
  }
  focusOut(event: FocusEvent): void {
    this.focused = this.viewport().nativeElement.contains(event.relatedTarget as Node | null);
  }
  hold(): void {
    this.manualUntil = performance.now() + 3000;
  }
  step(direction: number): void {
    this.hold();
    const viewport = this.viewport().nativeElement;
    viewport.scrollBy({
      left: direction * Math.max(220, viewport.clientWidth * 0.65),
      behavior: 'smooth',
    });
  }
  keydown(event: KeyboardEvent): void {
    if ((event.target as HTMLElement).closest('a,button,input')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      this.step(event.key === 'ArrowRight' ? 1 : -1);
    }
  }
  pointerDown(event: PointerEvent): void {
    this.hold();
    if (
      event.pointerType !== 'mouse' ||
      event.button !== 0 ||
      (event.target as HTMLElement).closest('a,button')
    )
      return;
    this.drag = {
      x: event.clientX,
      left: this.viewport().nativeElement.scrollLeft,
      pointer: event.pointerId,
    };
    this.viewport().nativeElement.setPointerCapture(event.pointerId);
  }
  pointerMove(event: PointerEvent): void {
    if (!this.drag) return;
    this.viewport().nativeElement.scrollLeft = this.drag.left + this.drag.x - event.clientX;
  }
  pointerUp(): void {
    if (this.drag && this.viewport().nativeElement.hasPointerCapture(this.drag.pointer))
      this.viewport().nativeElement.releasePointerCapture(this.drag.pointer);
    this.drag = undefined;
    this.hold();
  }
}
