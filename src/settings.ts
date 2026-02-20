import { App, PluginSettingTab, Setting } from 'obsidian';
import CopyWithImagesPlugin from './main';
import { i18n } from './i18n/i18n';

import { LanguageCode } from "./i18n/langs";

export interface CopyWithImagesSettings {
  includeCodeBlocks: boolean;
  maxImageSize: number;
  imageQuality: number;
  language: LanguageCode;
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

    // Language selection setting
    new Setting(containerEl)
      .setName(i18n.t('settings.language.name'))
      .setDesc(i18n.t('settings.language.desc'))
      .addDropdown(dropdown => dropdown
        .addOption('en', 'English')
        .addOption('zh', '简体中文')
        .setValue(this.plugin.settings.language || 'en')
        .onChange(async (value: LanguageCode) => {
          this.plugin.settings.language = value;
          await this.plugin.saveSettings();
          // Update i18n locale
          i18n.setLocale(value);
          // Refresh the settings UI to update all labels
          this.display();
        }));

    new Setting(containerEl)
      .setName(i18n.t('settings.include_code_blocks.name'))
      .setDesc(i18n.t('settings.include_code_blocks.desc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeCodeBlocks)
        .onChange(async (value) => {
          this.plugin.settings.includeCodeBlocks = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
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

    new Setting(containerEl)
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