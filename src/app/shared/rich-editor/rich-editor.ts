import { AdminHelp } from '../admin-help/admin-help';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { ClassicEditor } from 'ckeditor5';
import { MediaStore } from '../../core/media-store';
import { RichHtml } from '../../core/rich-html';

@Component({
  selector: 'app-rich-editor',
  imports: [AdminHelp],
  templateUrl: './rich-editor.html',
  styleUrl: './rich-editor.css',
})
export class RichEditor {
  readonly value = input('');
  readonly valueChange = output<string>();
  readonly ready = signal(false);
  readonly error = signal('');
  readonly uploading = signal(false);
  readonly sourceMode = signal(false);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('editorHost');
  private readonly media = inject(MediaStore);
  private readonly html = inject(RichHtml);
  private readonly destroyRef = inject(DestroyRef);
  private editor?: ClassicEditor;

  constructor() {
    this.destroyRef.onDestroy(() => {
      void this.editor?.destroy();
    });
    afterNextRender(() => {
      void this.initialize();
    });
  }

  private async initialize(): Promise<void> {
    try {
      await loadEditorStyles();
      const ck = await import('ckeditor5');
      const data = await this.html.editable(this.value());
      if (this.destroyRef.destroyed) return;
      const media = this.media;
      const editor = await ck.ClassicEditor.create(this.host().nativeElement, {
        licenseKey: 'GPL',
        plugins: [
          ck.Essentials,
          ck.Paragraph,
          ck.Heading,
          ck.Bold,
          ck.Italic,
          ck.Underline,
          ck.Strikethrough,
          ck.Link,
          ck.List,
          ck.BlockQuote,
          ck.Table,
          ck.TableToolbar,
          ck.Image,
          ck.ImageUpload,
          ck.ImageToolbar,
          ck.ImageCaption,
          ck.ImageStyle,
          ck.ImageResize,
          ck.ImageTextAlternative,
          ck.Alignment,
          ck.SourceEditing,
          ck.GeneralHtmlSupport,
        ],
        initialData: data,
        language: { ui: 'en', content: 'en' },
        toolbar: {
          items: [
            'undo',
            'redo',
            '|',
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            '|',
            'link',
            'uploadImage',
            'insertTable',
            'blockQuote',
            '|',
            'bulletedList',
            'numberedList',
            'alignment',
            '|',
            'sourceEditing',
          ],
          shouldNotGroupWhenFull: false,
        },
        image: {
          toolbar: [
            'imageTextAlternative',
            'toggleImageCaption',
            '|',
            'imageStyle:inline',
            'imageStyle:block',
            'imageStyle:side',
            '|',
            'resizeImage',
          ],
        },
        table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
        htmlSupport: {
          allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
          disallow: [{ name: /^(script|iframe|style|form|input|button|object|embed)$/ }],
        },
        extraPlugins: [
          function (editor) {
            editor.plugins.get(ck.FileRepository).createUploadAdapter = (loader) => {
              let aborted = false;
              return {
                upload: async () => {
                  const file = await loader.file;
                  if (!file || aborted) throw new Error('Upload cancelled.');
                  const id = await media.upload(file, 'image');
                  if (aborted) throw new Error('Upload cancelled.');
                  return { default: await media.resolve(id) };
                },
                abort: () => {
                  aborted = true;
                },
              };
            };
          },
        ],
      });
      if (this.destroyRef.destroyed) {
        await editor.destroy();
        return;
      }
      this.editor = editor;
      editor.model.document.on('change:data', () => this.publish());
      // Source editing temporarily locks the model; persist its changes before Save All.
      const source = editor.plugins.get(ck.SourceEditing);
      source.on('change:isSourceEditingMode', () => {
        this.sourceMode.set(source.isSourceEditingMode);
        this.publish();
      });
      this.ready.set(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load the editor.');
    }
  }

  syncSource(): void {
    // CKEditor synchronizes the source textarea into its model when getData runs.
    if (this.sourceMode())
      queueMicrotask(() => {
        if (!this.destroyRef.destroyed) this.publish();
      });
  }

  private publish(): void {
    if (this.editor) this.valueChange.emit(this.html.storage(this.editor.getData()));
  }

  async attach(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!this.editor || !files.length) return;
    this.uploading.set(true);
    this.error.set('');
    try {
      for (const file of files) {
        const id = await this.media.upload(file, 'attachment');
        const url = await this.media.resolve(id);
        if (this.destroyRef.destroyed) return;
        this.editor.model.change((writer) => {
          const selected = this.editor!.model.document.selection.getSelectedElement();
          if (selected) writer.setSelection(selected, 'after');
          this.editor!.model.insertContent(writer.createText(file.name, { linkHref: url }));
          this.editor!.model.insertContent(writer.createText(' '));
        });
      }
      this.editor.editing.view.focus();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'File upload failed.');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }
}

let editorStyles: Promise<void> | undefined;
function loadEditorStyles(): Promise<void> {
  return (editorStyles ??= new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/ckeditor/ckeditor5.css';
    link.onload = () => resolve();
    link.onerror = () => {
      editorStyles = undefined;
      link.remove();
      reject(new Error('Could not load editor styles.'));
    };
    document.head.append(link);
  }));
}
