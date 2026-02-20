# Copy with Images

This plugin allows you to copy markdown notes with embedded images to your clipboard, preserving both the text formatting and images. When pasted into rich text editors like Google Docs, Notion, or Word, the images will appear alongside the formatted text.

## Features

- Copies entire notes with images to clipboard
- Preserves markdown formatting as HTML
- Embeds images directly in the clipboard data
- Works with both `![](image.png)` and `![[image.png]]` syntax
- Supports common image formats (PNG, JPG, JPEG, GIF, WebP, BMP, SVG)

## Usage

There are two ways to use this plugin:

1. **Command Palette**: Open Command Palette (`Ctrl/Cmd+P`) and search for "Copy with Images: Copy full note with images"
2. **Right-click Menu**: Right-click on a markdown file in the file explorer and select "Copy full note with images"

## Installation

### From Community Plugins (Recommended)
1. Open Obsidian Settings
2. Go to "Community plugins"
3. Click "Browse" and search for "Copy with Images"
4. Install the plugin

### Manual Installation
1. Download the latest release from GitHub
2. Extract to your vault's `.obsidian/plugins/` folder
3. Restart Obsidian and enable the plugin

## Configuration

The plugin includes several configuration options:
- Include code blocks in copy
- Maximum image size for embedding
- Image quality for compression

## Supported Platforms

This plugin works on all platforms (Windows, macOS, Linux, mobile).

## Issues & Contributions

Report issues or contribute on [GitHub](https://github.com/yourusername/obsidian-copy-with-images).