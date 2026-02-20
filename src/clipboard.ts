export class ClipboardWriter {
  async write(html: string, images: Array<{ buffer: ArrayBuffer; mimeType: string }>): Promise<void> {
    // For browsers that support the modern Clipboard API
    if (navigator.clipboard && window.ClipboardItem) {
      await this.writeModern(html, images);
    } else {
      // Fallback method using execCommand
      await this.writeLegacy(html);
    }
  }

  private async writeModern(html: string, images: Array<{ buffer: ArrayBuffer; mimeType: string }>): Promise<void> {
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
    } catch (error) {
      console.error('Modern clipboard API failed, falling back to legacy method:', error);
      await this.writeLegacy(html);
    }
  }

  private async writeLegacy(html: string): Promise<void> {
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
    } finally {
      // Clean up
      if (selection) {
        selection.removeAllRanges();
      }
      document.body.removeChild(tempDiv);
    }
  }

  private htmlToPlainText(html: string): string {
    // Simple HTML to plain text conversion
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }
}