// Language codes supported by the plugin
export type LanguageCode = 'en' | 'zh';

// Define the structure of our translation keys
export interface TranslationKeys {
  // Commands
  'commands.copy_note_with_images': string;
  
  // Notices
  'notices.no_active_file': string;
  'notices.processing_images': string;
  'notices.no_images_found': string;
  'notices.copy_success': string;
  'notices.copy_failed': string;
  
  // Settings
  'settings.header': string;
  'settings.include_code_blocks.name': string;
  'settings.include_code_blocks.desc': string;
  'settings.max_image_size.name': string;
  'settings.max_image_size.desc': string;
  'settings.image_quality.name': string;
  'settings.image_quality.desc': string;
  'settings.language.name': string;
  'settings.language.desc': string;
}