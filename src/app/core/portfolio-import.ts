import { Injectable, inject } from '@angular/core';
import { MediaStore } from './media-store';
import { normalizePortfolio } from './portfolio-normalize';
import { PortfolioData } from './portfolio.models';

@Injectable({ providedIn: 'root' })
export class PortfolioImport {
  private readonly media = inject(MediaStore);
  private async legacyFile(id: string): Promise<{ blob: Blob; name: string }> {
    if (typeof indexedDB === 'undefined')
      throw new Error('Old browser media storage is unavailable.');
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('maryam-portfolio-media');
      request.onerror = () => reject(new Error('Could not open old browser media.'));
      request.onupgradeneeded = () => {
        request.transaction?.abort();
        reject(new Error('No old browser media was found.'));
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('assets')) {
          db.close();
          reject(new Error('No old browser media was found.'));
          return;
        }
        const read = db.transaction('assets').objectStore('assets').get(id);
        read.onsuccess = () => {
          db.close();
          read.result
            ? resolve(read.result)
            : reject(
                new Error(`Old browser file ${id} is missing. Upload it again before importing.`),
              );
        };
        read.onerror = () => {
          db.close();
          reject(new Error('Could not read an old browser file.'));
        };
      };
    });
  }
  async browserContent(): Promise<PortfolioData> {
    const raw = localStorage.getItem('maryam_portfolio_store');
    if (!raw) throw new Error('No previous portfolio content was found in this browser.');
    return this.prepare(JSON.parse(raw));
  }
  async backup(file: File): Promise<PortfolioData> {
    if (file.size > 100 * 1024 * 1024) throw new Error('Backup must be under 100 MB.');
    return this.prepare(JSON.parse(await file.text()));
  }
  private async prepare(input: any): Promise<PortfolioData> {
    const source = input?.portfolio || input;
    if (
      !source ||
      typeof source !== 'object' ||
      !source.hero ||
      !source.header ||
      !Array.isArray(source.caseStudiesList)
    )
      throw new Error('This is not a portfolio backup.');
    let content = JSON.stringify(normalizePortfolio(source));
    const assets = new Map<string, any>(
      (Array.isArray(input.assets) ? input.assets : []).map((asset: any) => [asset.id, asset]),
    );
    const references = new Set<string>([
      ...(content.match(/asset:[\w-]+/g) || []),
      ...[...assets.keys()].filter((id) => content.includes(id)),
    ]);
    for (const id of references) {
      const backup = assets.get(id);
      let blob: Blob;
      let name: string;
      if (backup) {
        const encoded =
          typeof backup.data === 'string'
            ? /^data:([\w.+/-]+)(?:;charset=[\w-]+)?;base64,([\s\S]*)$/.exec(backup.data)
            : null;
        if (!encoded) throw new Error('A backup file has invalid data.');
        const bytes = Uint8Array.from(atob(encoded[2]), (character) => character.charCodeAt(0));
        blob = new Blob([bytes], { type: encoded[1] });
        name = backup.name || 'attachment';
      } else {
        const record = await this.legacyFile(id);
        blob = record.blob;
        name = record.name;
      }
      const kind =
        blob.type === 'image/svg+xml'
          ? 'svg'
          : blob.type.startsWith('image/')
            ? 'image'
            : /\.(pdf|doc|docx)$/i.test(name)
              ? 'document'
              : 'attachment';
      const url = await this.media.upload(new File([blob], name, { type: blob.type }), kind);
      content = content.split(id).join(url);
    }
    if (/asset:|blob:/.test(content))
      throw new Error('The backup contains unresolved browser-only file references.');
    return JSON.parse(content, (_key, value) =>
      typeof value === 'string'
        ? value
            .replace(/^(?:\.\/)?index\.html(?=[?#]|$)/, '/')
            .replace(/^(?:\.\/)?projects\.html(?=[?#]|$)/, '/projects')
            .replace(/^(?:\.\/)?project-detail\.html(?=[?#]|$)/, '/project-detail')
        : value,
    );
  }
}
