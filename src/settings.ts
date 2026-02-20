import { App, PluginSettingTab, Setting } from 'obsidian';
import CopyWithImagesPlugin from './main';

export interface CopyWithImagesSettings {
  includeCodeBlocks: boolean;
  maxImageSize: number;
  imageQuality: number;
}

export class CopyWithImagesSettingTab extends PluginSettingTab {
  plugin: CopyWithImagesPlugin;

  constructor(app: App, plugin: CopyWithImagesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Include code blocks')
      .setDesc('Whether to include code blocks when copying')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeCodeBlocks)
        .onChange(async (value) => {
          this.plugin.settings.includeCodeBlocks = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Maximum image size')
      .setDesc('Maximum image size in pixels for embedding (0 = no limit)')
      .addSlider(slider => slider
        .setLimits(0, 10000, 100)
        .setValue(this.plugin.settings.maxImageSize)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.maxImageSize = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Image quality')
      .setDesc('Quality for image compression (0.1 = lowest, 1.0 = highest)')
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