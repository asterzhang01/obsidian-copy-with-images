'use strict';

var obsidian = require('obsidian');
var path = require('path');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);

// Embedded translations
const enTranslations = {
    "commands.copy_note_with_images": "Copy full note with images",
    "notices.no_active_file": "No active note file",
    "notices.processing_images": "Processing images and copying...",
    "notices.no_images_found": "No images found, copying text content only",
    "notices.copy_success": "Copied: {{filename}} (including {{count}} images)",
    "notices.copy_failed": "Copy failed: {{message}}",
    "settings.header": "Copy with Images Settings",
    "settings.include_code_blocks.name": "Include code blocks",
    "settings.include_code_blocks.desc": "Whether to include code blocks when copying",
    "settings.max_image_size.name": "Maximum image size",
    "settings.max_image_size.desc": "Maximum image size in pixels for embedding (0 = no limit)",
    "settings.image_quality.name": "Image quality",
    "settings.image_quality.desc": "Quality for image compression (0.1 = lowest, 1.0 = highest)",
    "settings.language.name": "Language",
    "settings.language.desc": "Choose the language for the plugin interface"
};
const zhTranslations = {
    "commands.copy_note_with_images": "复制完整笔记（含图片）",
    "notices.no_active_file": "没有活动的笔记文件",
    "notices.processing_images": "正在处理图片并复制...",
    "notices.no_images_found": "未找到图片，仅复制文本内容",
    "notices.copy_success": "已复制：{{filename}}（包含 {{count}} 张图片）",
    "notices.copy_failed": "复制失败：{{message}}",
    "settings.header": "图片复制设置",
    "settings.include_code_blocks.name": "包含代码块",
    "settings.include_code_blocks.desc": "复制时是否包含代码块",
    "settings.max_image_size.name": "最大图片尺寸",
    "settings.max_image_size.desc": "嵌入图片的最大像素尺寸（0 = 无限制）",
    "settings.image_quality.name": "图片质量",
    "settings.image_quality.desc": "图片压缩质量（0.1 = 最低，1.0 = 最高）",
    "settings.language.name": "语言",
    "settings.language.desc": "选择插件界面的语言"
};
class I18n {
    constructor() {
        this.locale = 'en';
        this.translations = {
            en: enTranslations,
            zh: zhTranslations
        };
    }
    setLocale(locale) {
        this.locale = locale;
    }
    getLocale() {
        return this.locale;
    }
    t(key, params) {
        let translation = this.translations[this.locale][key] || key;
        // Replace placeholders with provided parameters
        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
            });
        }
        return translation;
    }
    // Get available languages
    getAvailableLocales() {
        return Object.keys(this.translations);
    }
}
// Export a singleton instance
const i18n = new I18n();

class CopyWithImagesSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        // Language selection setting
        new obsidian.Setting(containerEl)
            .setName(i18n.t('settings.language.name'))
            .setDesc(i18n.t('settings.language.desc'))
            .addDropdown(dropdown => dropdown
            .addOption('en', 'English')
            .addOption('zh', '简体中文')
            .setValue(this.plugin.settings.language || 'en')
            .onChange(async (value) => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
            // Update i18n locale
            i18n.setLocale(value);
            // Refresh the settings UI to update all labels
            this.display();
        }));
        new obsidian.Setting(containerEl)
            .setName(i18n.t('settings.include_code_blocks.name'))
            .setDesc(i18n.t('settings.include_code_blocks.desc'))
            .addToggle(toggle => toggle
            .setValue(this.plugin.settings.includeCodeBlocks)
            .onChange(async (value) => {
            this.plugin.settings.includeCodeBlocks = value;
            await this.plugin.saveSettings();
        }));
        new obsidian.Setting(containerEl)
            .setName(i18n.t('settings.max_image_size.name'))
            .setDesc(i18n.t('settings.max_image_size.desc'))
            .addSlider(slider => slider
            .setLimits(0, 10000, 100)
            .setValue(this.plugin.settings.maxImageSize)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.settings.maxImageSize = value;
            await this.plugin.saveSettings();
        }));
        new obsidian.Setting(containerEl)
            .setName(i18n.t('settings.image_quality.name'))
            .setDesc(i18n.t('settings.image_quality.desc'))
            .addSlider(slider => slider
            .setLimits(0.1, 1.0, 0.1)
            .setValue(this.plugin.settings.imageQuality)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.settings.imageQuality = value;
            await this.plugin.saveSettings();
        }));
    }
}

class MarkdownImageParser {
    constructor(app) {
        this.app = app;
        this.imageCache = new Map();
    }
    async parseMarkdown(content, filePath) {
        console.log('[Debug] Starting Markdown parsing, content length:', content.length);
        console.log('[Debug] File path:', filePath);
        this.imageCache.clear();
        const noteDir = path__namespace.dirname(filePath);
        console.log('[Debug] Note directory:', noteDir);
        let html = content;
        // Parse Obsidian format images: ![[image.png]]
        html = await this.parseObsidianImages(html, noteDir);
        // Parse standard Markdown format images: ![alt](path)
        html = await this.parseStandardImages(html, noteDir);
        // Convert Markdown to HTML
        html = this.markdownToHtml(html);
        // Wrap in complete HTML document
        const fullHtml = this.wrapHtmlDocument(html);
        console.log('[Debug] Parsing completed, number of images found:', this.imageCache.size);
        console.log('[Debug] Image cache contents:', Array.from(this.imageCache.keys()));
        return {
            html: fullHtml,
            images: Array.from(this.imageCache.values())
        };
    }
    async parseObsidianImages(content, noteDir) {
        console.log('[Debug] Checking for Obsidian image format');
        const obsidianImageRegex = /!\[\[([^\]]+)\]\]/g;
        const matches = [...content.matchAll(obsidianImageRegex)];
        console.log('[Debug] Found Obsidian image count:', matches.length);
        for (const match of matches) {
            const [fullMatch, imageName] = match;
            console.log('[Debug] Processing Obsidian image:', imageName);
            try {
                // Find image file
                const imageFile = this.findImageFile(imageName, noteDir);
                if (imageFile) {
                    console.log('[Debug] Found image file:', imageFile.path);
                    const { dataUrl, buffer, mimeType } = await this.processImageFile(imageFile);
                    // Cache image data
                    this.imageCache.set(imageName, { buffer, mimeType });
                    console.log('[Debug] Image cached, size:', buffer.byteLength, 'bytes');
                    // Replace with HTML img tag
                    const finalDataUrl = `data:${mimeType};base64,${this.arrayBufferToBase64(buffer)}`;
                    content = content.replace(fullMatch, `<img src="${finalDataUrl}" alt="${imageName}" style="max-width: 100%; height: auto;" />`);
                }
                else {
                    console.warn(`[Debug] Could not find image file: ${imageName}`);
                    console.log('[Debug] Search path:', noteDir);
                    console.log('[Debug] Tried paths:', this.getAllPossiblePaths(imageName, noteDir));
                }
            }
            catch (error) {
                console.error(`[Debug] Error processing image ${imageName}:`, error);
            }
        }
        return content;
    }
    async parseStandardImages(content, noteDir) {
        console.log('[Debug] Checking for standard Markdown image format');
        const standardImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const matches = [...content.matchAll(standardImageRegex)];
        console.log('[Debug] Found standard Markdown image count:', matches.length);
        for (const match of matches) {
            const [fullMatch, alt, imagePath] = match;
            // Skip external images
            if (imagePath.startsWith('data:') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                console.log('[Debug] Skipping external image:', imagePath);
                continue;
            }
            console.log('[Debug] Processing standard image:', imagePath);
            try {
                // Find image file
                const imageFile = this.findImageFile(imagePath, noteDir);
                if (imageFile) {
                    console.log('[Debug] Found image file:', imageFile.path);
                    const { dataUrl, buffer, mimeType } = await this.processImageFile(imageFile);
                    // Cache image data
                    this.imageCache.set(imagePath, { buffer, mimeType });
                    console.log('[Debug] Image cached, size:', buffer.byteLength, 'bytes');
                    // Replace with HTML img tag
                    const finalDataUrl = `data:${mimeType};base64,${this.arrayBufferToBase64(buffer)}`;
                    content = content.replace(fullMatch, `<img src="${finalDataUrl}" alt="${alt}" style="max-width: 100%; height: auto;" />`);
                }
                else {
                    console.warn(`[Debug] Could not find image file: ${imagePath}`);
                    console.log('[Debug] Search path:', noteDir);
                    console.log('[Debug] Tried paths:', this.getAllPossiblePaths(imagePath, noteDir));
                }
            }
            catch (error) {
                console.error(`[Debug] Error processing image ${imagePath}:`, error);
            }
        }
        return content;
    }
    /**
     * Get all possible paths (for debugging)
     */
    getAllPossiblePaths(imageName, noteDir) {
        const paths = [];
        // Relative to current note
        paths.push(path__namespace.posix.join(noteDir, imageName));
        // In vault root
        paths.push(imageName);
        // Try with extensions
        const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
        for (const ext of extensions) {
            if (!imageName.toLowerCase().endsWith(ext)) {
                paths.push(imageName + ext);
                paths.push(path__namespace.posix.join(noteDir, imageName + ext));
            }
        }
        return paths;
    }
    /**
     * Find image file in vault
     */
    findImageFile(imageName, noteDir) {
        console.log('[Debug] Starting to search for image:', imageName, 'in directory:', noteDir);
        // Get vault root path
        const vaultRoot = this.app.vault.getRoot().path;
        // Try different path combinations
        const possiblePaths = [
            // Relative to current note
            path__namespace.posix.join(noteDir, imageName),
            // With POSIX format
            path__namespace.posix.join(noteDir, imageName).replace(/\\/g, '/'),
            // Direct filename (if in root)
            imageName,
            // Part of absolute path
            imageName.replace(vaultRoot + '/', '')
        ];
        // Normalize path separators and remove duplicates
        const uniquePaths = [...new Set(possiblePaths.map(p => p.replace(/\\/g, '/').replace('//', '/').replace(vaultRoot + '/', '')))];
        console.log('[Debug] Trying paths:', uniquePaths);
        // Try all possible paths
        for (const imagePath of uniquePaths) {
            // Ensure path doesn't start with /
            const normalizedPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
            console.log('[Debug] Trying path:', normalizedPath);
            try {
                const imageFile = this.app.vault.getAbstractFileByPath(normalizedPath);
                if (imageFile instanceof obsidian.TFile) {
                    console.log('[Debug] Found file by path:', imageFile.path);
                    return imageFile;
                }
            }
            catch (error) {
                console.log('[Debug] Path lookup failed:', normalizedPath, error);
            }
        }
        // If path lookup fails, try searching entire vault
        console.log('[Debug] Searching entire vault...');
        const files = this.app.vault.getFiles();
        console.log('[Debug] Total files:', files.length);
        // Search for matching filenames
        for (const file of files) {
            const fileName = path__namespace.basename(file.path);
            if (fileName.toLowerCase() === path__namespace.basename(imageName).toLowerCase()) {
                console.log('[Debug] Found by filename:', file.path);
                return file;
            }
        }
        // If still not found, try adding extensions
        const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
        for (const ext of extensions) {
            if (!imageName.toLowerCase().endsWith(ext)) {
                const fileNameWithExt = path__namespace.basename(imageName) + ext;
                for (const file of files) {
                    const fileName = path__namespace.basename(file.path);
                    if (fileName.toLowerCase() === fileNameWithExt.toLowerCase()) {
                        console.log('[Debug] Found by adding extension:', file.path, 'with extension:', ext);
                        return file;
                    }
                }
            }
        }
        console.log('[Debug] Image file not found:', imageName);
        return null;
    }
    async processImageFile(imageFile) {
        console.log('[Debug] Starting to process image file:', imageFile.path);
        try {
            const buffer = await this.app.vault.readBinary(imageFile);
            console.log('[Debug] Image file read successfully, size:', buffer.byteLength, 'bytes');
            const mimeType = this.getMimeType(imageFile.extension);
            console.log('[Debug] MIME type:', mimeType);
            return {
                dataUrl: `data:${mimeType};base64,${this.arrayBufferToBase64(buffer)}`,
                buffer,
                mimeType
            };
        }
        catch (error) {
            console.error('[Debug] Failed to read image file:', error);
            throw error;
        }
    }
    getMimeType(extension) {
        const ext = extension.toLowerCase();
        const mimeTypes = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp'
        };
        return mimeTypes[ext] || 'image/png';
    }
    arrayBufferToBase64(buffer) {
        const uint8Array = new Uint8Array(buffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binaryString);
    }
    markdownToHtml(markdown) {
        // Simple Markdown to HTML conversion
        let html = markdown;
        // Handle headings
        html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
        html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
        html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        // Handle bold and italic
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Handle code blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        // Handle links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        // Handle paragraphs and line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br />');
        // Handle quotes
        html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
        // Handle lists
        html = html.replace(/^\- (.*$)/gm, '<ul><li>$1</li></ul>');
        html = html.replace(/^\d+\. (.*$)/gm, '<ol><li>$1</li></ol>');
        // Wrap in paragraph tags
        html = `<p>${html}</p>`;
        return html;
    }
    wrapHtmlDocument(bodyContent) {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 10px 0;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
    code {
      background: #f5f5f5;
      padding: 2px 5px;
      border-radius: 3px;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 15px;
      color: #666;
      margin: 10px 0;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 20px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
    }
}

class ClipboardWriter {
    async write(html, images) {
        // For browsers that support the modern Clipboard API
        if (navigator.clipboard && window.ClipboardItem) {
            await this.writeModern(html, images);
        }
        else {
            // Fallback method using execCommand
            await this.writeLegacy(html);
        }
    }
    async writeModern(html, images) {
        try {
            // Create HTML content
            const htmlBlob = new Blob([html], { type: 'text/html' });
            // Create plain text content (simple fallback)
            const textBlob = new Blob([this.htmlToPlainText(html)], { type: 'text/plain' });
            // Combine HTML and text in a single ClipboardItem
            const combinedItem = new ClipboardItem({
                'text/html': htmlBlob,
                'text/plain': textBlob
            });
            // Write the combined item first
            await navigator.clipboard.write([combinedItem]);
            console.log('Clipboard write completed with modern API, including', images.length, 'images');
        }
        catch (error) {
            console.error('Modern clipboard API failed, falling back to legacy method:', error);
            await this.writeLegacy(html);
        }
    }
    async writeLegacy(html) {
        // Create temporary element to hold content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.cssText = 'position: fixed; left: -9999px; top: -9999px; width: 0; height: 0;';
        document.body.appendChild(tempDiv);
        // Select content
        const range = document.createRange();
        range.selectNode(tempDiv);
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
        try {
            // Execute copy command
            document.execCommand('copy');
            console.log('Clipboard write completed with legacy API');
        }
        finally {
            // Clean up
            if (selection) {
                selection.removeAllRanges();
            }
            document.body.removeChild(tempDiv);
        }
    }
    htmlToPlainText(html) {
        // Simple HTML to plain text conversion
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    }
}

class CopyWithImagesPlugin extends obsidian.Plugin {
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
            editorCallback: async (editor, view) => {
                await this.copyCurrentNoteWithImages(view.file);
            }
        });
        // Add right-click menu
        this.registerEvent(this.app.workspace.on('file-menu', (menu, file, source) => {
            console.log('[Debug] File menu triggered, file:', file?.path, 'type:', file?.constructor.name);
            // Check if it's a Markdown file
            if (file instanceof obsidian.TFile && file.extension === 'md') {
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
            }
            else {
                // If it's an abstract file but not a TFile, or not an md file
                const extension = file instanceof obsidian.TFile ? file.extension : undefined;
                console.log('[Debug] File is not Markdown type, skipping menu item', extension);
            }
        }));
        // Add settings tab
        this.addSettingTab(new CopyWithImagesSettingTab(this.app, this));
        console.log('Copy with Images plugin loaded');
    }
    async copyCurrentNoteWithImages(file) {
        if (!file) {
            new obsidian.Notice(i18n.t('notices.no_active_file'));
            return;
        }
        try {
            new obsidian.Notice(i18n.t('notices.processing_images'));
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
                new obsidian.Notice(i18n.t('notices.no_images_found'));
            }
            else {
                console.log('[Debug] Found images, starting clipboard writing');
            }
            // Write to clipboard
            await this.clipboardWriter.write(result.html, result.images);
            new obsidian.Notice(i18n.t('notices.copy_success', { filename: file.basename, count: result.images.length }));
            console.log('[Debug] Copy completed');
        }
        catch (error) {
            console.error('Copy with images failed:', error);
            new obsidian.Notice(i18n.t('notices.copy_failed', { message: error.message }));
        }
    }
    async loadSettings() {
        this.settings = Object.assign({}, new (class CopyWithImagesSettings {
            constructor() {
                this.includeCodeBlocks = true;
                this.maxImageSize = 5000;
                this.imageQuality = 0.9;
                this.language = 'en';
            }
        })(), await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    onunload() {
        console.log('Copy with Images plugin unloaded');
    }
}

module.exports = CopyWithImagesPlugin;
