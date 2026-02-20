import { TranslationKeys, LanguageCode } from './langs';

// Embedded translations
const enTranslations: TranslationKeys = {
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

const zhTranslations: TranslationKeys = {
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

export class I18n {
  private locale: LanguageCode = 'en';
  private translations: Record<LanguageCode, TranslationKeys>;

  constructor() {
    this.translations = {
      en: enTranslations,
      zh: zhTranslations
    };
  }

  setLocale(locale: LanguageCode) {
    this.locale = locale;
  }

  getLocale(): LanguageCode {
    return this.locale;
  }

  t(key: keyof TranslationKeys, params?: Record<string, string | number>): string {
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
  getAvailableLocales(): LanguageCode[] {
    return Object.keys(this.translations) as LanguageCode[];
  }
}

// Export a singleton instance
export const i18n = new I18n();