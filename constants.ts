import { Platform, Language, RefinementAction, ModelTier } from './types';

export const PLATFORM_CONFIG: Record<Platform, { 
  aspectRatio: string; 
  iconName: string; 
  description: string;
  color: string;
}> = {
  [Platform.LINKEDIN]: {
    aspectRatio: '16:9', // Professional standard
    iconName: 'linkedin',
    description: 'Long-form, professional insights.',
    color: 'blue-700'
  },
  [Platform.TWITTER]: {
    aspectRatio: '16:9', // Best for preview cards
    iconName: 'twitter',
    description: 'Short, punchy, hashtag-aware.',
    color: 'sky-500'
  },
  [Platform.INSTAGRAM]: {
    aspectRatio: '1:1', // Classic square
    iconName: 'instagram',
    description: 'Visual-first, engaging captions.',
    color: 'pink-600'
  },
  [Platform.THREADS]: {
    aspectRatio: '3:4', // Mobile vertical optimized
    iconName: 'at-sign',
    description: 'Conversational, authentic, thread-starter.',
    color: 'neutral-900'
  }
};

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: Language.ENGLISH, label: '🇺🇸 English' },
  { value: Language.SPANISH, label: '🇪🇸 Spanish' },
  { value: Language.FRENCH, label: '🇫🇷 French' },
  { value: Language.GERMAN, label: '🇩🇪 German' },
  { value: Language.PORTUGUESE, label: '🇧🇷 Portuguese' },
  { value: Language.CHINESE, label: '🇨🇳 Chinese' },
  { value: Language.JAPANESE, label: '🇯🇵 Japanese' },
  { value: Language.HINDI, label: '🇮🇳 Hindi' },
];

export const REFINEMENT_ACTIONS: { action: RefinementAction; label: string; icon: string }[] = [
  { action: 'shorten', label: 'Shorten', icon: 'minimize-2' },
  { action: 'expand', label: 'Expand', icon: 'maximize-2' },
  { action: 'funnier', label: 'Make Funnier', icon: 'smile' },
  { action: 'rewrite', label: 'Rewrite', icon: 'refresh-cw' },
];

export const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image';
export const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash';

export const PRO_2_5_TEXT_MODEL = 'gemini-2.5-pro-preview-09-2025';

export const PRO_IMAGE_MODEL = 'gemini-3-pro-image-preview';
export const PRO_TEXT_MODEL = 'gemini-3-pro-preview';

export const MODEL_OPTIONS: { id: ModelTier; label: string; shortLabel: string; icon: string }[] = [
  { id: 'flash-2.5', label: 'Gemini 2.5 Flash', shortLabel: 'Flash 2.5', icon: 'zap' },
  { id: 'pro-2.5', label: 'Gemini 2.5 Pro', shortLabel: 'Pro 2.5', icon: 'brain' },
  { id: 'pro-3.0', label: 'Gemini 3.0 Pro', shortLabel: 'Pro 3.0', icon: 'crown' },
];