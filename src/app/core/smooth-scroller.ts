import { ViewportScroller } from '@angular/common';
import { Injectable } from '@angular/core';

/** Let the browser animate anchors on its compositor; history restoration stays instant. */
@Injectable({ providedIn: 'root' })
export class SmoothScroller extends ViewportScroller {
  private offset: [number, number] | (() => [number, number]) = [0, 0];

  override setOffset(offset: [number, number] | (() => [number, number])): void {
    this.offset = offset;
  }

  override getScrollPosition(): [number, number] {
    return [window.scrollX, window.scrollY];
  }

  override scrollToPosition([left, top]: [number, number]): void {
    window.scrollTo({ left, top, behavior: 'instant' });
  }

  override scrollToAnchor(anchor: string): void {
    const target = document.getElementById(anchor) || document.getElementsByName(anchor)[0];
    if (!target) return;
    const offset = typeof this.offset === 'function' ? this.offset() : this.offset;
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const top =
      anchor === 'top'
        ? 0
        : target.getBoundingClientRect().top + window.scrollY - offset[1] - padding - margin;
    window.scrollTo({
      left: window.scrollX,
      top: Math.max(0, top),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }

  override setHistoryScrollRestoration(value: 'auto' | 'manual'): void {
    window.history.scrollRestoration = value;
  }
}
