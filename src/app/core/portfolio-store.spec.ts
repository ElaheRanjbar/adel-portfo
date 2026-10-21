import { TestBed } from '@angular/core/testing';
import { PortfolioStore } from './portfolio-store';
import { ApiClient } from './api-client';
import { MemoryPortfolioApi } from '../../testing/portfolio-api';

describe('Server portfolio state', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [MemoryPortfolioApi, { provide: ApiClient, useExisting: MemoryPortfolioApi }],
    }),
  );
  it('loads published content only from the API', async () => {
    const api = TestBed.inject(MemoryPortfolioApi);
    api.data.hero.name = 'Server name';
    const store = TestBed.inject(PortfolioStore);
    expect(store.loaded()).toBe(false);
    await store.load();
    expect(store.data().hero.name).toBe('Server name');
    expect(api.calls).toContain('GET /portfolio');
  });
  it('shows a network error instead of silently displaying demo content', async () => {
    TestBed.inject(MemoryPortfolioApi).fail = true;
    const store = TestBed.inject(PortfolioStore);
    await store.load();
    expect(store.loaded()).toBe(false);
    expect(store.data()).toBeNull();
    expect(store.error()).toContain('Server unavailable');
  });
  it('preserves published content and the draft when a save conflicts or fails', async () => {
    const api = TestBed.inject(MemoryPortfolioApi);
    const store = TestBed.inject(PortfolioStore);
    await store.load();
    const revision = store.revision();
    const draft = store.draft();
    draft.hero.name = 'Unsaved draft';
    api.revision++;
    await expect(store.save(draft, revision)).rejects.toThrow('Content changed');
    expect(store.data().hero.name).toBe('Maryam');
    expect(draft.hero.name).toBe('Unsaved draft');
    expect(store.saving()).toBe(false);
    api.fail = true;
    await expect(store.save(draft, revision)).rejects.toThrow('Server unavailable');
    expect(api.writes).toBe(0);
  });
});
