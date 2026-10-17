import { Injectable, inject } from '@angular/core';
import DOMPurify from 'dompurify';
import { MediaStore } from './media-store';
import { CaseSection } from './portfolio.models';

@Injectable({ providedIn: 'root' })
export class RichHtml {
  private readonly media = inject(MediaStore);

  sanitize(html: string): string {
    const clean = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'iframe'],
      ALLOWED_URI_REGEXP:
        /^(?:(?:https?|mailto|tel|blob|asset):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    // Keep editor alignment and image/table sizing, without arbitrary CSS.
    for (const element of doc.body.querySelectorAll<HTMLElement>('[style]')) {
      const style = element.style;
      const allowed: [string, string][] = [];
      for (const name of Array.from(style)) {
        const value = style.getPropertyValue(name).trim();
        if (
          (name === 'text-align' && /^(left|right|center|justify|start|end)$/.test(value)) ||
          (['width', 'height', 'max-width', 'margin-left', 'margin-right'].includes(name) &&
            /^(auto|0|\d+(?:\.\d+)?(?:px|%|em|rem))$/.test(value)) ||
          (name === 'float' && /^(left|right|none)$/.test(value))
        )
          allowed.push([name, value]);
      }
      element.removeAttribute('style');
      for (const [name, value] of allowed) element.style.setProperty(name, value);
    }
    for (const anchor of doc.body.querySelectorAll('a')) {
      anchor.setAttribute('rel', 'noopener noreferrer');
      if (anchor.getAttribute('href')?.startsWith('asset:')) anchor.setAttribute('download', '');
    }
    return doc.body.innerHTML;
  }

  storage(html: string): string {
    return this.rewrite(this.sanitize(html), (url) => this.media.reference(url));
  }

  view(html: string): string {
    return this.sanitize(this.rewrite(html, (url) => this.media.url(url)));
  }

  async editable(html: string): Promise<string> {
    const references = [...new Set(html.match(/asset:[\w-]+/g) || [])];
    await Promise.all(references.map((id) => this.media.resolve(id)));
    return this.view(html);
  }

  section(section: CaseSection): string {
    if (section.html !== undefined) return section.html;
    const escape = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML.replace(/\n/g, '<br>');
    };
    const quote = section.quote ? `<blockquote><p>${escape(section.quote)}</p></blockquote>` : '';
    return [
      section.quoteFirst ? quote : '',
      ...(section.paragraphs || []).map((text) => `<p>${escape(text)}</p>`),
      !section.quoteFirst ? quote : '',
      ...(section.subsections || []).map((sub) => {
        const img = document.createElement('img');
        img.setAttribute('src', sub.image);
        img.setAttribute('alt', sub.heading || section.title);
        return [
          sub.heading ? `<h3>${escape(sub.heading)}</h3>` : '',
          sub.text ? `<p>${escape(sub.text)}</p>` : '',
          sub.image
            ? `<figure class="image">${img.outerHTML}${sub.caption ? `<figcaption>${escape(sub.caption)}</figcaption>` : ''}</figure>`
            : '',
        ].join('');
      }),
    ].join('');
  }

  private rewrite(html: string, resolve: (url: string) => string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    for (const element of doc.body.querySelectorAll('img[src],a[href]')) {
      const attribute = element.tagName === 'IMG' ? 'src' : 'href';
      const value = element.getAttribute(attribute) || '';
      if (attribute === 'href' && value.startsWith('asset:')) element.setAttribute('download', '');
      element.setAttribute(attribute, resolve(value));
      // Uploaded images use a single persistent reference, never temporary srcset URLs.
      if (element.tagName === 'IMG' && (value.startsWith('asset:') || value.startsWith('blob:')))
        element.removeAttribute('srcset');
    }
    return doc.body.innerHTML;
  }
}
