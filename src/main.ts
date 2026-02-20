import { Plugin, Notice, TFile, TAbstractFile, Editor, MarkdownView } from 'obsidian';
import { CopyWithImagesSettings, CopyWithImagesSettingTab } from './settings';
import { MarkdownImageParser } from './markdown-parser';
import { ClipboardWriter } from './clipboard';
import { i18n } from './i18n/i18n';

interface ClipboardWithImage {
  html: string;
  images: Array<{ buffer: ArrayBuffer; mimeType: string }>;
}

export default class CopyWithImagesPlugin extends Plugin {
  settings: CopyWithImagesSettings;
  private markdownParser: MarkdownImageParser;
  private clipboardWriter: ClipboardWriter;

  async onload() {
    await this.loadSettings();
    
    // Initialize i18n with the selected language
    i18n.setLocale(this.settings.language || 'en');
    
    this.markdownParser = new MarkdownImageParser(this.app);
    this.clipboardWriter = new ClipboardWriter();

    // Add command panel command
    this.addCommand({
      id: 'copy-note-with-images',
      name: i18n.t('commands.copy_note_with_images'),
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        await this.copyCurrentNoteWithImages(view.file);
      }
    });

    // Add right-click menu
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file, source) => {
        console.log('[Debug] File menu triggered, file:', file?.path, 'type:', file?.constructor.name);
        
        // Check if it's a Markdown file
        if (file instanceof TFile && file.extension === 'md') {
          console.log('[Debug] Adding context menu item');
          menu.addItem((item) => {
            item
              .setTitle(i18n.t('commands.copy_note_with_images'))
              .setIcon('copy')
              .setSection('action')
              .onClick(async () => {
                console.log('[Debug] Context menu clicked, starting copy');
                await this.copyCurrentNoteWithImages(file);
              });
          });
        } else {
          // If it's an abstract file but not a TFile, or not an md file
          const extension = file instanceof TFile ? file.extension : undefined;
          console.log('[Debug] File is not Markdown type, skipping menu item', extension);
        }
      })
    );

    // Add settings tab
    this.addSettingTab(new CopyWithImagesSettingTab(this.app, this));

    console.log('Copy with Images plugin loaded');
  }

  async copyCurrentNoteWithImages(file: TFile | null) {
    if (!file) {
      new Notice(i18n.t('notices.no_active_file'));
      return;
    }

    try {
      new Notice(i18n.t('notices.processing_images'));

      // Read note content
      console.log('[Debug] Starting to read file:', file.path);
      const content = await this.app.vault.read(file);
      console.log('[Debug] File reading completed, content length:', content.length);
      
      // Parse Markdown, extract images and convert to HTML
      console.log('[Debug] Starting Markdown parsing');
      const result = await this.markdownParser.parseMarkdown(content, file.path);
      console.log('[Debug] Parsing completed, HTML length:', result.html.length, 'number of images:', result.images.length);
      
      // Check if there are any images
      if (result.images.length === 0) {
        console.warn('[Debug] No images found');
        new Notice(i18n.t('notices.no_images_found'));
      } else {
        console.log('[Debug] Found images, starting clipboard writing');
      }
      
      // Write to clipboard
      await this.clipboardWriter.write(result.html, result.images);

      new Notice(i18n.t('notices.copy_success', { filename: file.basename, count: result.images.length }));
      console.log('[Debug] Copy completed');
    } catch (error) {
      console.error('Copy with images failed:', error);
      new Notice(i18n.t('notices.copy_failed', { message: error.message }));
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, new (class CopyWithImagesSettings {
      includeCodeBlocks = true;
      maxImageSize = 5000;
      imageQuality = 0.9;
      language = 'en';
    })(), await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    console.log('Copy with Images plugin unloaded');
  }
}