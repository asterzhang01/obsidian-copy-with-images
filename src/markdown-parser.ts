import { App, TFile, Vault } from 'obsidian';
import * as path from 'path';

export interface ParseResult {
  html: string;
  images: Array<{ buffer: ArrayBuffer; mimeType: string }>;
}

export class MarkdownImageParser {
  private app: App;
  private imageCache: Map<string, { buffer: ArrayBuffer; mimeType: string }>;

  constructor(app: App) {
    this.app = app;
    this.imageCache = new Map();
  }

  async parseMarkdown(content: string, filePath: string): Promise<ParseResult> {
    console.log('[Debug] Starting Markdown parsing, content length:', content.length);
    console.log('[Debug] File path:', filePath);
    
    this.imageCache.clear();
    const noteDir = path.dirname(filePath);
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

  private async parseObsidianImages(content: string, noteDir: string): Promise<string> {
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
          content = content.replace(
            fullMatch,
            `<img src="${finalDataUrl}" alt="${imageName}" style="max-width: 100%; height: auto;" />`
          );
        } else {
          console.warn(`[Debug] Could not find image file: ${imageName}`);
          console.log('[Debug] Search path:', noteDir);
          console.log('[Debug] Tried paths:', this.getAllPossiblePaths(imageName, noteDir));
        }
      } catch (error) {
        console.error(`[Debug] Error processing image ${imageName}:`, error);
      }
    }

    return content;
  }

  private async parseStandardImages(content: string, noteDir: string): Promise<string> {
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
          content = content.replace(
            fullMatch,
            `<img src="${finalDataUrl}" alt="${alt}" style="max-width: 100%; height: auto;" />`
          );
        } else {
          console.warn(`[Debug] Could not find image file: ${imagePath}`);
          console.log('[Debug] Search path:', noteDir);
          console.log('[Debug] Tried paths:', this.getAllPossiblePaths(imagePath, noteDir));
        }
      } catch (error) {
        console.error(`[Debug] Error processing image ${imagePath}:`, error);
      }
    }

    return content;
  }

  /**
   * Get all possible paths (for debugging)
   */
  private getAllPossiblePaths(imageName: string, noteDir: string): string[] {
    const paths = [];
    
    // Relative to current note
    paths.push(path.posix.join(noteDir, imageName));
    
    // In vault root
    paths.push(imageName);
    
    // Try with extensions
    const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
    for (const ext of extensions) {
      if (!imageName.toLowerCase().endsWith(ext)) {
        paths.push(imageName + ext);
        paths.push(path.posix.join(noteDir, imageName + ext));
      }
    }
    
    return paths;
  }

  /**
   * Find image file in vault
   */
  private findImageFile(imageName: string, noteDir: string): TFile | null {
    console.log('[Debug] Starting to search for image:', imageName, 'in directory:', noteDir);
    
    // Get vault root path
    const vaultRoot = this.app.vault.getRoot().path;
    
    // Try different path combinations
    const possiblePaths = [
      // Relative to current note
      path.posix.join(noteDir, imageName),
      // With POSIX format
      path.posix.join(noteDir, imageName).replace(/\\/g, '/'),
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
        if (imageFile instanceof TFile) {
          console.log('[Debug] Found file by path:', imageFile.path);
          return imageFile;
        }
      } catch (error) {
        console.log('[Debug] Path lookup failed:', normalizedPath, error);
      }
    }
    
    // If path lookup fails, try searching entire vault
    console.log('[Debug] Searching entire vault...');
    const files = this.app.vault.getFiles();
    console.log('[Debug] Total files:', files.length);
    
    // Search for matching filenames
    for (const file of files) {
      const fileName = path.basename(file.path);
      if (fileName.toLowerCase() === path.basename(imageName).toLowerCase()) {
        console.log('[Debug] Found by filename:', file.path);
        return file;
      }
    }
    
    // If still not found, try adding extensions
    const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
    for (const ext of extensions) {
      if (!imageName.toLowerCase().endsWith(ext)) {
        const fileNameWithExt = path.basename(imageName) + ext;
        for (const file of files) {
          const fileName = path.basename(file.path);
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

  private async processImageFile(imageFile: TFile): Promise<{
    dataUrl: string;
    buffer: ArrayBuffer;
    mimeType: string;
  }> {
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
    } catch (error) {
      console.error('[Debug] Failed to read image file:', error);
      throw error;
    }
  }

  private getMimeType(extension: string): string {
    const ext = extension.toLowerCase();
    const mimeTypes: Record<string, string> = {
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binaryString);
  }

  private markdownToHtml(markdown: string): string {
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

  private wrapHtmlDocument(bodyContent: string): string {
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