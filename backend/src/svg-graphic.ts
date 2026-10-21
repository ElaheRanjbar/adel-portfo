import { BadRequestException } from '@nestjs/common';
import { DOMParser } from '@xmldom/xmldom';

/** Accept self-contained vector artwork, preserving its original geometry and bytes. */
export function validateSvgGraphic(buffer: Buffer): void {
  if (buffer.length > 1024 * 1024) throw new BadRequestException('SVG size must be under 1 MB.');
  const source = buffer.toString('utf8');
  const invalid = () =>
    new BadRequestException(
      'Choose a valid, self-contained SVG without scripts, event handlers or external resources.',
    );
  if (/<!DOCTYPE|<!ENTITY/i.test(source) || source.includes('\0')) throw invalid();
  try {
    const document = new DOMParser({
      onError: () => {
        throw invalid();
      },
    }).parseFromString(source, 'image/svg+xml');
    const root = document.documentElement;
    if (!root || root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg')
      throw invalid();
    const blocked = new Set([
      'script',
      'foreignobject',
      'iframe',
      'object',
      'embed',
      'audio',
      'video',
      'set',
      'animate',
      'animatemotion',
      'animatetransform',
      'handler',
      'listener',
    ]);
    const stack = [document as any];
    let count = 0;
    while (stack.length) {
      const node = stack.pop()!;
      if (++count > 20000) throw invalid();
      if (node.nodeType === 7 && node.nodeName !== 'xml') throw invalid();
      if (node.nodeType === 1) {
        if (node.namespaceURI !== root.namespaceURI || blocked.has(node.localName.toLowerCase()))
          throw invalid();
        for (let i = 0; i < node.attributes.length; i++) {
          const attribute = node.attributes.item(i);
          const name = attribute.name.toLowerCase();
          const value = attribute.value.trim();
          if (
            attribute.localName.toLowerCase().startsWith('on') ||
            name === 'xml:base' ||
            /javascript\s*:|vbscript\s*:/i.test(value)
          )
            throw invalid();
          if (
            attribute.localName.toLowerCase() === 'href' &&
            value &&
            !value.startsWith('#') &&
            !/^data:image\/(?:png|jpeg|webp|gif|avif);base64,[a-z\d+/=\s]+$/i.test(value)
          )
            throw invalid();
          if (
            /url\s*\(/i.test(value) &&
            [...value.matchAll(/url\s*\(([^)]*)\)/gi)].some(
              (match) => !/^['"]?#[\w:.-]+['"]?$/.test(match[1].trim()),
            )
          )
            throw invalid();
          if (
            (name === 'style' || name === 'fill' || name === 'filter' || name === 'stroke') &&
            /\\|@import|expression\s*\(/i.test(value)
          )
            throw invalid();
        }
        if (node.localName.toLowerCase() === 'style') {
          const css = node.textContent || '';
          if (/\\|@import|expression\s*\(|javascript\s*:/i.test(css)) throw invalid();
          if (
            [...css.matchAll(/url\s*\(([^)]*)\)/gi)].some(
              (match) => !/^['"]?#[\w:.-]+['"]?$/.test(match[1].trim()),
            )
          )
            throw invalid();
        }
      }
      for (let child = node.firstChild; child; child = child.nextSibling) stack.push(child);
    }
  } catch {
    throw invalid();
  }
}
