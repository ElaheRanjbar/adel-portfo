import { RichEditor } from '../../shared/rich-editor/rich-editor';
import { RichContent } from '../../shared/rich-content/rich-content';
import { RichHtml } from '../../core/rich-html';
import { createId } from '../../core/create-id';
import { AdminConfirm, ConfirmationRequest } from '../../shared/admin-confirm/admin-confirm';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
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
  styleUrl: './admin.css',
})
export class Admin implements OnDestroy {
  readonly store = inject(PortfolioStore);
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
  private confirmationAction?: () => void;
  readonly richHtml = inject(RichHtml);
  readonly editingSection = signal('');
  readonly selectedId = signal('');
  readonly exporting = signal(false);
  readonly fields = FIELDS;
  newTag = '';
  readonly tabs = [
    { id: 'hero', label: '✨ معرفی و رزومه' },
    { id: 'header', label: '◈ سربرگ و لوگو' },
    { id: 'projects', label: '💼 مطالعه‌های موردی' },
    { id: 'tags', label: '# تگ‌ها' },
    { id: 'home-projects', label: '▤ پروژه‌های خانه' },
    { id: 'about', label: '◉ دربارهٔ من و مهارت‌ها' },
    { id: 'experience', label: '↗ سوابق کاری' },
    { id: 'testimonials', label: '❞ نظرات همکاران' },
    { id: 'photos', label: '▧ گالری عکس‌ها' },
    { id: 'partners', label: '◇ نوار مهارت‌ها' },
    { id: 'footer', label: '✉ پاورقی و تماس' },
    { id: 'content', label: 'عنوان‌ها و متن دکمه‌ها' },
    { id: 'html', label: '⌘ کد سفارشی' },
    { id: 'backup', label: '⚙ پشتیبان‌گیری و بازنشانی' },
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
    // Older backups may contain a listing without a matching detail record.
    for (const project of this.data.caseStudiesList) this.ensureDetail(project);
  }

  save(): void {
    if (this.media.pending()) {
      this.notify('لطفاً تا پایان آپلود فایل‌ها صبر کنید.');
      return;
    }
    for (const [id, detail] of Object.entries(this.data.detailedCaseStudies)) {
      const ids = detail.sections.map((section) => section.id.trim());
      if (
        ids.some((value) => !/^[a-zA-Z][\w-]*$/.test(value)) ||
        new Set(ids).size !== ids.length
      ) {
        this.notify(`شناسه‌های تکراری یا نامعتبر بخش‌های «${detail.title}» را اصلاح کنید.`);
        return;
      }
    }
    if (
      this.data.tags.some((tag) => !tag.name.trim()) ||
      new Set(this.data.tags.map((tag) => tag.name.trim().toLowerCase())).size !==
        this.data.tags.length
    ) {
      this.notify('نام تگ‌ها نباید خالی یا تکراری باشد.');
      return;
    }
    try {
      this.store.save(this.data);
      this.notify('تغییرات با موفقیت ذخیره شد.');
    } catch {
      this.notify('ذخیره نشد. فضای ذخیره‌سازی مرورگر را بررسی کنید.');
    }
  }

  addProject(): void {
    const id = `case-${createId()}`;
    const project: ProjectCard = {
      id,
      title: 'پروژهٔ جدید',
      subtitle: 'طراحی محصول',
      description: '',
      tags: [],
      image: '',
      ctaText: 'مشاهدهٔ پروژه',
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
      this.ask('حذف مطالعهٔ موردی', `پروژهٔ «${project.title}» و همهٔ جزئیات آن حذف شود؟`, () =>
        this.removeProject(this.data.caseStudiesList.indexOf(project)),
      );
  }

  isFeatured(id: string): boolean {
    return this.data.homeProjects.some((p) => p.id === id);
  }
  toggleFeatured(project: ProjectCard): void {
    if (this.isFeatured(project.id))
      this.data.homeProjects = this.data.homeProjects.filter((p) => p.id !== project.id);
    else
      this.data.homeProjects.push({
        ...structuredClone(project),
        caseStudyUrl: `/project-detail?id=${project.id}`,
      });
  }

  syncHome(project: ProjectCard): void {
    const home = this.data.homeProjects.find((p) => p.id === project.id);
    if (home) Object.assign(home, structuredClone(project), { caseStudyUrl: project.detailUrl });
  }

  addHomeProject(): void {
    this.data.homeProjects.push({
      id: `home-${createId()}`,
      title: 'پروژهٔ جدید',
      subtitle: '',
      description: '',
      image: '',
      tags: [],
      ctaText: 'مشاهدهٔ پروژه',
      caseStudyUrl: '/projects',
    });
  }

  addSection(detail: CaseStudy): void {
    detail.sections.push({
      id: `section-${createId()}`,
      title: 'بخش جدید',
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
      this.notify('یک نام تازه و غیرتکراری برای تگ وارد کنید.');
      return;
    }
    this.data.tags.push({ id: `tag-${createId()}`, name });
    this.newTag = '';
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
      anchor.download = 'پشتیبان-پورتفولیو.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      this.notify(error instanceof Error ? error.message : 'دریافت پشتیبان ناموفق بود.');
    } finally {
      this.exporting.set(false);
    }
  }

  reset(): void {
    this.ask('بازگردانی تنظیمات اولیه', 'همهٔ محتواها به نسخهٔ اولیه برگردند؟', () => {
      try {
        this.store.reset();
        this.editor.reload();
        this.selectedId.set('');
        this.notify('تنظیمات اولیه بازگردانده شد.');
      } catch {
        this.notify('بازنشانی اطلاعات مرورگر ناموفق بود.');
      }
    });
  }
  discard(): void {
    this.ask('لغو تغییرات', 'تغییرات ذخیره‌نشده کنار گذاشته شوند؟', () => {
      this.editor.reload();
      this.selectedId.set('');
    });
  }
  confirmPending(): void {
    const action = this.confirmationAction;
    this.cancelPending();
    action?.();
  }
  cancelPending(): void {
    this.confirmation.set(null);
    this.confirmationAction = undefined;
  }
  private ask(title: string, message: string, action: () => void): void {
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
          { label: 'زمان‌بندی', value: '' },
          { label: 'نقش', value: '' },
          { label: 'مشتری', value: '' },
          { label: 'دامنهٔ پروژه', value: '' },
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
