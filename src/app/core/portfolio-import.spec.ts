import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PortfolioImport } from './portfolio-import';
import { MediaStore } from './media-store';
import { normalizePortfolio } from './portfolio-normalize';

describe('Portable portfolio backups', () => {
  it('decodes embedded files locally, uploads them and rewrites all references without data-URL fetches', async () => {
    const media = TestBed.inject(MediaStore);
    const upload = vi.spyOn(media, 'upload').mockResolvedValue('/api/media/new-file/file');
    const fetch = vi.spyOn(globalThis, 'fetch');
    const portfolio = normalizePortfolio();
    portfolio.hero.profileImage = '/api/media/old-file/file';
    portfolio.header.navLinks[0].href = 'index.html';
    portfolio.detailedCaseStudies['case-1'].sections[0].html =
      '<img src="/api/media/old-file/file">';
    const encoded = JSON.stringify({
      portfolio,
      assets: [
        {
          id: '/api/media/old-file/file',
          name: 'photo.png',
          type: 'image/png',
          data: 'data:image/png;charset=utf-8;base64,aGVsbG8=',
        },
      ],
    });
    const file = { size: encoded.length, text: async () => encoded } as File;
    const result = await TestBed.inject(PortfolioImport).backup(file);
    expect(fetch).not.toHaveBeenCalled();
    expect(upload).toHaveBeenCalledOnce();
    expect(upload.mock.calls[0][0].size).toBe(5);
    expect(upload.mock.calls[0][0].type).toBe('image/png');
    expect(result.hero.profileImage).toBe('/api/media/new-file/file');
    expect(result.detailedCaseStudies['case-1'].sections[0].html).toContain(
      '/api/media/new-file/file',
    );
    expect(result.header.navLinks[0].href).toBe('/');
    vi.restoreAllMocks();
  });
});
