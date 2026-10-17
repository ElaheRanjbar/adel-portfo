import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from './create-id';
import { normalizePortfolio } from './portfolio-normalize';

describe('Content IDs on HTTP origins', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the native UUID API when available', () => {
    const randomUUID = vi.fn(() => 'native-id');
    vi.stubGlobal('crypto', { randomUUID });
    expect(createId()).toBe('native-id');
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it('loads portfolio tags when only getRandomValues is available', () => {
    const getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
    vi.stubGlobal('crypto', { getRandomValues });
    const data = normalizePortfolio();
    expect(data.tags.length).toBeGreaterThan(0);
    expect(new Set(data.tags.map((tag) => tag.id)).size).toBe(data.tags.length);
    expect(normalizePortfolio(data).tags).toEqual(data.tags);
    expect(createId()).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
  });

  it('still creates distinct content IDs without Web Crypto', () => {
    vi.stubGlobal('crypto', undefined);
    const ids = Array.from({ length: 100 }, () => createId());
    expect(new Set(ids).size).toBe(ids.length);
    expect(() => normalizePortfolio()).not.toThrow();
  });
});
