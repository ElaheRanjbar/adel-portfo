import sanitize from 'sanitize-html';
import type { PortfolioData } from '../../shared/portfolio.models';

const dimension = /^(?:auto|0|\d+(?:\.\d+)?(?:px|%|em|rem))$/;
const options: sanitize.IOptions = {
  allowedTags: [...sanitize.defaults.allowedTags, 'img', 'figure', 'figcaption', 'span'],
  allowedAttributes: {
    '*': ['class', 'style'],
    a: ['href', 'target', 'rel', 'download'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  allowedStyles: {
    '*': {
      'text-align': [/^(left|right|center|justify|start|end)$/],
      width: [dimension],
      height: [dimension],
      'max-width': [dimension],
      'margin-left': [dimension],
      'margin-right': [dimension],
      float: [/^(left|right|none)$/],
    },
  },
  transformTags: {
    a: (tagName, attributes) => ({
      tagName,
      attribs: { ...attributes, rel: 'noopener noreferrer' },
    }),
  },
};
export function sanitizePortfolio(data: PortfolioData): PortfolioData {
  // Legacy backups may still include this retired field; never publish or retain new HTML.
  data.customHtmlEmbed = '';
  data.footer.headline = sanitize(data.footer.headline, options);
  for (const [key, value] of Object.entries(data.content))
    if (key.endsWith('Title') && typeof value === 'string')
      (data.content as any)[key] = sanitize(value, options);
  for (const detail of Object.values(data.detailedCaseStudies))
    for (const section of detail.sections)
      if (section.html !== undefined) section.html = sanitize(section.html, options);
  return data;
}
