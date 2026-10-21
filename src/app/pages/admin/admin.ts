import { pageSnapshot, reconcilePage, isAdminPage, AdminPage } from '../../core/admin-page-save';
import { AdminSave } from '../../shared/admin-save/admin-save';
import { defaultBadgeImage } from '../../../../shared/floating-badges';
import { AdminAuth } from '../../core/admin-auth';
import { ApiError } from '../../core/api-client';
import { PortfolioImport } from '../../core/portfolio-import';
import { AdminHelp, AdminHelpDialog } from '../../shared/admin-help/admin-help';
import { RichEditor } from '../../shared/rich-editor/rich-editor';
import { RichContent } from '../../shared/rich-content/rich-content';
import { RichHtml } from '../../core/rich-html';
import { createId } from '../../core/create-id';
import { AdminConfirm, ConfirmationRequest } from '../../shared/admin-confirm/admin-confirm';
import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { PortfolioStore } from '../../core/portfolio-store';
import { AdminEditor } from '../../core/admin-editor';
import { MediaStore } from '../../core/media-store';
import { PortfolioLink } from '../../core/portfolio-link';
import { tagCollections } from '../../core/portfolio-normalize';
import { CaseStudy, ProjectCard } from '../../core/portfolio.models';
import { AdminFields } from '../../shared/admin-fields/admin-fields';
import { AdminCollection } from '../../shared/admin-collection/admin-collection';
import { MediaField } from '../../shared/media-field/media-field';
import { MediaUrl } from '../../core/media-url';
import { TagPicker } from '../../shared/tag-picker/tag-picker';
import { FIELDS } from './admin-fields-config';

@Component({
  selector: 'app-admin',
  imports: [
    AdminSave,
    AdminHelp,
    AdminHelpDialog,
    RichEditor,
    RichContent,
    AdminConfirm,
    FormsModule,
    PortfolioLink,
    RouterLink,
    AdminFields,
    AdminCollection,
    MediaField,
    MediaUrl,
    TagPicker,
  ],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css', './admin-server.css'],
})
export class Admin implements OnDestroy {
  readonly defaultBadgeImage = defaultBadgeImage;
  readonly store = inject(PortfolioStore);
  readonly auth = inject(AdminAuth);
  private readonly importer = inject(PortfolioImport);
  readonly importing = signal(false);
  readonly mediaLoading = signal(false);
  loginUsername = 'admin';
  loginPassword = '';
  async signIn(): Promise<void> {
    await this.auth.login(this.loginUsername, this.loginPassword);
    this.loginPassword = '';
  }
  async refreshMedia(): Promise<void> {
    this.mediaLoading.set(true);
    try {
      await this.media.list();
    } catch (error) {
      this.report(error);
    } finally {
      this.mediaLoading.set(false);
    }
  }
  deleteMedia(id: string, url: string): void {
    if (JSON.stringify(this.data).includes(url)) {
      this.notify(
        'This file is used in the current draft. Remove its references and save before deleting.',
      );
      return;
    }
    this.ask(
      'Delete uploaded file',
      'Permanently delete this unused file from the server?',
      async () => {
        await this.media.remove(id);
        this.notify('File deleted from the server.');
      },
    );
  }
  importBrowser(): void {
    this.ask(
      'Import browser content',
      'Replace server content with the old content and files from this browser?',
      async () => {
        await this.importContent(() => this.importer.browserContent());
      },
    );
  }
  importBackup(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.ask('Restore backup', 'Replace the current server content with this backup?', async () => {
      await this.importContent(() => this.importer.backup(file));
    });
  }
  private async importContent(
    read: () => Promise<import('../../core/portfolio.models').PortfolioData>,
  ): Promise<void> {
    this.importing.set(true);
    try {
      const data = await read();
      await this.store.save(data, this.editor.revision);
      this.editor.reload();
      this.notify('Content and files imported to the server.');
    } finally {
      this.importing.set(false);
    }
  }
  refreshContent(): void {
    this.ask(
      'Reload server content',
      'Discard this draft and load the latest server version?',
      async () => {
        await this.store.load();
        if (this.store.error()) throw new Error(this.store.error());
        this.editor.reload();
      },
    );
  }
  private report(error: unknown): void {
    if (error instanceof ApiError && error.status === 401) this.auth.user.set(null);
    this.notify(error instanceof Error ? error.message : 'The server request failed.');
  }
  readonly editor = inject(AdminEditor);
  readonly media = inject(MediaStore);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  get data() {
    return this.editor.data;
  }
  readonly tab = computed(() => this.params().get('section') || 'hero');
  readonly toast = signal('');
  readonly confirmation = signal<ConfirmationRequest | null>(null);
  private confirmationAction?: () => void | Promise<void>;
  readonly richHtml = inject(RichHtml);
  readonly editingSection = signal('');
  readonly selectedId = signal('');
  readonly exporting = signal(false);
  readonly fields = FIELDS;
  newTag = '';
  newTagLink = '';
  readonly tabs = [
    {
      id: 'hero',
      label: '✨ Hero and resume',
      help: 'عکس، نام، عنوان شغلی، دکمه‌های معرفی و فایل رزومه در بالای سایت را از اینجا تغییر دهید.',
    },
    {
      id: 'header',
      label: '◈ Header and logo',
      help: 'لوگو، لینک‌های منوی بالای سایت و دکمه تماس را مدیریت کنید. لینک بخش‌های صفحه اصلی را به صورت /#about وارد کنید.',
    },
    {
      id: 'projects',
      label: '💼 Case studies',
      help: 'پروژه‌ها و صفحه جزئیات آن‌ها را از اینجا بسازید و ویرایش کنید. هر پروژه کارت، معرفی، بخش‌های داستان و پیشنهاد انتهایی مستقل دارد.',
    },
    {
      id: 'tags',
      label: '# Tags',
      help: 'تگ را یک بار بسازید و در چند پروژه انتخاب کنید. تغییر نام یا لینک در همه جا اعمال می‌شود. لینک اختیاری است؛ تگ بدون لینک فقط متن نمایش می‌دهد.',
    },
    {
      id: 'home-projects',
      label: '▤ Home projects',
      help: 'کارت‌های صفحه اصلی و ترتیب نمایششان را مدیریت کنید. دکمه‌های بالا و پایین ترتیب را عوض می‌کنند. مقصد هر کارت را می‌توانید به یک مطالعه موردی متصل کنید.',
    },
    {
      id: 'about',
      label: '◉ About and skills',
      help: 'زندگی‌نامه، ویژگی‌های تیم دلخواه، مهارت‌ها و کارت‌های آماری بخش درباره من را ویرایش کنید.',
    },
    {
      id: 'experience',
      label: '↗ Work experience',
      help: 'هر مورد یک سابقه کاری است. نقش، شرکت و بازه زمانی را بنویسید و با دکمه‌های بالا و پایین ترتیب را تنظیم کنید.',
    },
    {
      id: 'testimonials',
      label: '❞ Testimonials',
      help: 'نظرات نمایش‌داده‌شده در اسلایدر را مدیریت کنید. نسخه کوتاه در کارت و متن کامل با Read more نمایش داده می‌شود.',
    },
    {
      id: 'photos',
      label: '▧ Photo gallery',
      help: 'عکس‌های گالری و توضیح هر عکس را مدیریت کنید. بازدیدکننده با کلیک، فایل اصلی عکس را تمام‌صفحه می‌بیند؛ تصویر با وضوح کافی آپلود کنید.',
    },
    {
      id: 'partners',
      label: '◇ Skills ticker',
      help: 'این متن‌ها همراه ستاره در نوار متحرک بالای سایت تکرار می‌شوند. هر عنوان را در یک خط جداگانه وارد کنید.',
    },
    {
      id: 'footer',
      label: '✉ Footer and contact',
      help: 'عنوان تماس، وضعیت همکاری، پیوندهای شبکه‌های اجتماعی و متن حقوق نشر پایین سایت را مدیریت کنید.',
    },
    {
      id: 'content',
      label: 'Headings and button text',
      help: 'متن مشترک عنوان بخش‌ها و دکمه‌های سایت را تغییر دهید. برای رنگ آبی بخشی از عنوان می‌توانید از span با کلاس text-blue استفاده کنید.',
    },
    {
      id: 'media',
      label: '▧ Uploaded files',
      help: 'فایل‌ها روی سرور ذخیره می‌شوند و در همه دستگاه‌ها در دسترس هستند. فقط فایل بدون استفاده را حذف کنید؛ فایل استفاده‌شده ابتدا باید از محتوا حذف و تغییرات ذخیره شود.',
    },
    {
      id: 'backup',
      label: '⚙ Backup and reset',
      help: 'Download full backup محتوای ذخیره‌شده و فایل‌های آپلودشده را در یک فایل JSON دریافت می‌کند. Restore defaults پس از تأیید، محتوا را به نسخه اولیه برمی‌گرداند.',
    },
  ];
  private toastTimer?: ReturnType<typeof setTimeout>;
  get currentProject(): ProjectCard | undefined {
    return (
      this.data.caseStudiesList.find((p) => p.id === this.selectedId()) ||
      this.data.caseStudiesList[0]
    );
  }
  get currentDetail(): CaseStudy | undefined {
    const project = this.currentProject;
    return project ? this.data.detailedCaseStudies[project.id] : undefined;
  }

  constructor() {
    effect(() => {
      if (this.auth.user() && this.tab() === 'media') void this.refreshMedia();
    });
    // Older backups may contain a listing without a matching detail record.
    for (const project of this.data.caseStudiesList) {
      this.ensureDetail(project);
      project.tags = [...new Set(this.data.detailedCaseStudies[project.id].tags)];
    }
  }

  readonly editablePage = computed(() => isAdminPage(this.tab()));

  async savePage(page: AdminPage = this.tab() as AdminPage): Promise<void> {
    if (!isAdminPage(page)) return;
    if (this.store.saving() || this.importing()) return;
    if (this.media.pending()) {
      this.notify('Please wait for file uploads to finish.');
      return;
    }
    try {
      const previous = this.store.draft();
      const featuredChanges = new Map(this.editor.featuredChanges);
      const candidate = pageSnapshot(previous, this.data, page, featuredChanges);
      for (const detail of Object.values(candidate.detailedCaseStudies)) {
        const ids = detail.sections.map((section) => section.id.trim());
        if (
          ids.some((value) => !/^[a-zA-Z][\w-]*$/.test(value)) ||
          new Set(ids).size !== ids.length
        ) {
          this.notify(`Fix duplicate or invalid section IDs in "${detail.title}".`);
          return;
        }
      }
      if (
        candidate.tags.some((tag) => !tag.name.trim()) ||
        new Set(candidate.tags.map((tag) => tag.name.trim().toLowerCase())).size !==
          candidate.tags.length
      ) {
        this.notify('Tag names must be unique and cannot be empty.');
        return;
      }
      await this.store.save(candidate, this.editor.revision);
      reconcilePage(this.data, previous, candidate, this.store.data());
      this.editor.revision = this.store.revision();
      if (page === 'projects' || page === 'home-projects') {
        for (const [id, featured] of featuredChanges)
          if (this.editor.featuredChanges.get(id) === featured)
            this.editor.featuredChanges.delete(id);
      }
      this.notify('Page saved successfully. Drafts on other pages have been kept.');
    } catch (error) {
      this.report(error);
    }
  }
  addProject(): void {
    const id = `case-${createId()}`;
    const project: ProjectCard = {
      id,
      title: 'New project',
      subtitle: 'Product design',
      description: '',
      tags: [],
      image: '',
      ctaText: 'View case study',
      detailUrl: `/project-detail?id=${id}`,
    };
    this.data.caseStudiesList.push(project);
    this.ensureDetail(project);
    this.selectedId.set(id);
  }

  removeProject(index: number): void {
    const project = this.data.caseStudiesList[index];
    if (!project) return;
    this.data.caseStudiesList.splice(index, 1);
    delete this.data.detailedCaseStudies[project.id];
    this.data.homeProjects = this.data.homeProjects.filter((item) => item.id !== project.id);
    for (const home of this.data.homeProjects)
      if (this.targetId(home.caseStudyUrl) === project.id) home.caseStudyUrl = '/projects';
    for (const detail of Object.values(this.data.detailedCaseStudies))
      if (this.targetId(detail.nextProject?.link) === project.id) delete detail.nextProject;
    this.selectedId.set(this.data.caseStudiesList[0]?.id || '');
  }

  deleteCurrent(): void {
    const project = this.currentProject;
    if (project)
      this.ask('Delete case study', `Delete "${project.title}" and all of its details?`, () =>
        this.removeProject(this.data.caseStudiesList.indexOf(project)),
      );
  }

  isFeatured(id: string): boolean {
    return this.data.homeProjects.some((p) => p.id === id);
  }
  toggleFeatured(project: ProjectCard): void {
    this.editor.featuredChanges.set(project.id, !this.isFeatured(project.id));
    if (this.isFeatured(project.id))
      this.data.homeProjects = this.data.homeProjects.filter((p) => p.id !== project.id);
    else
      this.data.homeProjects.push({
        ...structuredClone(project),
        caseStudyUrl: `/project-detail?id=${project.id}`,
      });
  }

  setProjectTags(project: ProjectCard, tags: string[]): void {
    const assigned = [...new Set(tags)];
    project.tags = assigned;
    this.ensureDetail(project);
    this.data.detailedCaseStudies[project.id].tags = [...assigned];
    this.syncHome(project);
  }

  syncHome(project: ProjectCard): void {
    const home = this.data.homeProjects.find((p) => p.id === project.id);
    if (home) Object.assign(home, structuredClone(project), { caseStudyUrl: project.detailUrl });
  }

  addHomeProject(): void {
    this.data.homeProjects.push({
      id: `home-${createId()}`,
      title: 'New project',
      subtitle: '',
      description: '',
      image: '',
      tags: [],
      ctaText: 'View case study',
      caseStudyUrl: '/projects',
    });
  }

  addSection(detail: CaseStudy): void {
    detail.sections.push({
      id: `section-${createId()}`,
      title: 'New section',
      paragraphs: [],
      quote: '',
      subsections: [],
    });
  }
  move<T>(items: T[], index: number, direction: number): void {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
  }
  enableNext(detail: CaseStudy): void {
    detail.nextProject = { title: '', subtitle: '', image: '', tags: [], link: '/projects' };
  }
  pickNext(detail: CaseStudy, id: string): void {
    const next = this.data.caseStudiesList.find((p) => p.id === id);
    if (next)
      detail.nextProject = {
        title: next.title,
        subtitle: next.subtitle,
        image: next.image,
        tags: [...next.tags],
        link: `/project-detail?id=${id}`,
      };
  }

  addTag(): void {
    const name = this.newTag.trim();
    if (!name || this.data.tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      this.notify('Enter a new, unique tag name.');
      return;
    }
    this.data.tags.push({ id: `tag-${createId()}`, name, link: this.newTagLink.trim() });
    this.newTag = '';
    this.newTagLink = '';
  }
  deleteTag(id: string): void {
    this.data.tags = this.data.tags.filter((tag) => tag.id !== id);
    for (const tags of tagCollections(this.data))
      for (let i = tags.length - 1; i >= 0; i--) if (tags[i] === id) tags.splice(i, 1);
  }
  tagUsage(id: string): number {
    return tagCollections(this.data).filter((tags) => tags.includes(id)).length;
  }
  setPartners(text: string): void {
    this.data.partners = text.split('\n');
  }

  async exportBackup(): Promise<void> {
    this.exporting.set(true);
    try {
      const assets = await this.media.exportAssets(this.data);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify({ version: 2, portfolio: this.data, assets }, null, 2)], {
          type: 'application/json',
        }),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'portfolio-backup.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      this.notify(error instanceof Error ? error.message : 'Backup export failed.');
    } finally {
      this.exporting.set(false);
    }
  }

  reset(): void {
    this.ask('Restore defaults', 'Restore all content to the original defaults?', async () => {
      try {
        await this.store.reset(this.editor.revision);
        this.editor.reload();
        this.selectedId.set('');
        this.notify('Defaults restored.');
      } catch (error) {
        this.report(error);
      }
    });
  }
  discard(): void {
    this.ask('Discard changes', 'Discard all unsaved changes?', () => {
      this.editor.reload();
      this.selectedId.set('');
    });
  }
  async confirmPending(): Promise<void> {
    const action = this.confirmationAction;
    this.cancelPending();
    try {
      await action?.();
    } catch (error) {
      this.report(error);
    }
  }
  cancelPending(): void {
    this.confirmation.set(null);
    this.confirmationAction = undefined;
  }
  private ask(title: string, message: string, action: () => void | Promise<void>): void {
    this.confirmationAction = action;
    this.confirmation.set({ title, message });
  }
  ngOnDestroy(): void {
    clearTimeout(this.toastTimer);
  }

  private ensureDetail(project: ProjectCard): void {
    if (!this.data.detailedCaseStudies[project.id])
      this.data.detailedCaseStudies[project.id] = {
        title: project.title,
        subtitle: project.subtitle,
        leadSummary: project.description,
        heroImage: project.image,
        tags: [...project.tags],
        meta: [
          { label: 'Timeline', value: '' },
          { label: 'Role', value: '' },
          { label: 'Client', value: '' },
          { label: 'Scope', value: '' },
        ],
        sections: [],
      };
    for (const section of this.data.detailedCaseStudies[project.id].sections) {
      section.paragraphs ??= [];
      section.subsections ??= [];
    }
  }
  private targetId(link?: string): string | null {
    return link ? new URL(link, 'https://portfolio.local').searchParams.get('id') : null;
  }
  private notify(message: string): void {
    clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastTimer = setTimeout(() => this.toast.set(''), 5000);
  }
}
