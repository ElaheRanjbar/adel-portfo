import { vi } from 'vitest';
import { SmoothScroller } from './smooth-scroller';

describe('Anchor scrolling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.style.scrollPaddingTop = '';
    document.getElementById('anchor-test')?.remove();
  });

  it('animates to an anchor below the sticky header and respects reduced motion', () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const preference = vi.fn();
    vi.stubGlobal('matchMedia', preference);
    preference.mockReturnValue({ matches: false } as MediaQueryList);
    const target = document.createElement('section');
    target.id = 'anchor-test';
    document.body.append(target);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ top: 800 } as DOMRect);
    document.documentElement.style.scrollPaddingTop = '148px';
    const scroller = new SmoothScroller();
    scroller.scrollToAnchor('anchor-test');
    expect(scroll).toHaveBeenLastCalledWith({ left: 0, top: 652, behavior: 'smooth' });
    preference.mockReturnValue({ matches: true } as MediaQueryList);
    scroller.scrollToAnchor('anchor-test');
    expect(scroll).toHaveBeenLastCalledWith({ left: 0, top: 652, behavior: 'instant' });
    scroller.scrollToPosition([0, 400]);
    expect(scroll).toHaveBeenLastCalledWith({ left: 0, top: 400, behavior: 'instant' });
  });
});
