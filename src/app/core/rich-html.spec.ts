import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RichHtml } from './rich-html';
import { MediaStore } from './media-store';

describe('Case study HTML', () => {
  it('preserves formatting while removing scripts, event handlers, unsafe links and CSS', () => {
    const html = TestBed.inject(RichHtml).sanitize(
      '<p style="text-align:center">Aligned text</p><script>alert(1)</script><p style="text-align:center;background:url(https://example.com);position:fixed">Hello <strong>world</strong></p>' +
        '<img src="/image.png" onerror="alert(1)"><a href="javascript:alert(1)">Bad</a><iframe src="/unsafe"></iframe>',
    );
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('text-align: center');
    for (const forbidden of [
      '<script',
      'onerror',
      'javascript:',
      'background',
      'position:',
      '<iframe',
    ])
      expect(html).not.toContain(forbidden);
  });

  it('stores stable asset references and rehydrates images and downloadable attachments', async () => {
    const media = TestBed.inject(MediaStore);
    vi.spyOn(media, 'reference').mockImplementation((url) => url.replace('blob:local-', 'asset:'));
    vi.spyOn(media, 'url').mockImplementation((id) =>
      (id || '').replace('asset:', 'blob:restored-'),
    );
    const resolve = vi.spyOn(media, 'resolve').mockResolvedValue('blob:restored-file');
    const rich = TestBed.inject(RichHtml);
    const stored = rich.storage(
      '<img src="blob:local-photo"><a href="blob:local-file">Brief.pdf</a>',
    );
    expect(stored).toContain('src="asset:photo"');
    expect(stored).toContain('href="asset:file"');
    expect(stored).not.toContain('blob:');
    const rendered = await rich.editable(stored);
    expect(resolve).toHaveBeenCalledWith('asset:photo');
    expect(rendered).toContain('src="blob:restored-photo"');
    expect(rendered).toContain('href="blob:restored-file"');
    expect(rendered).toContain('download=""');
  });

  it('converts existing sections without losing their text, quotes, images or captions', () => {
    const html = TestBed.inject(RichHtml).section({
      id: 'challenge',
      title: 'Challenge',
      quoteFirst: true,
      quote: 'A real insight',
      paragraphs: ['Paragraph <one>\nNext line'],
      subsections: [
        { heading: 'Decision', text: 'Rationale', image: 'asset:photo', caption: 'Sketch' },
      ],
    });
    expect(html.indexOf('A real insight')).toBeLessThan(html.indexOf('Paragraph'));
    expect(html).toContain('&lt;one&gt;<br>');
    expect(html).toContain('src="asset:photo"');
    expect(html).toContain('<figcaption>Sketch</figcaption>');
  });
});
