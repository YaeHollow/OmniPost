export enum Platform {
  LINKEDIN = 'LinkedIn',
  TWITTER = 'Twitter',
  INSTAGRAM = 'Instagram',
  THREADS = 'Threads'
}

export enum Tone {
  PROFESSIONAL = 'Professional',
  WITTY = 'Witty',
  URGENT = 'Urgent',
  INSPIRATIONAL = 'Inspirational',
  CASUAL = 'Casual'
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}

export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  PORTUGUESE = 'Portuguese',
  JAPANESE = 'Japanese',
  HINDI = 'Hindi',
  CHINESE = 'Chinese'
}

export type RefinementAction = 'shorten' | 'expand' | 'funnier' | 'rewrite';

export type ModelTier = 'flash-2.5' | 'pro-2.5' | 'pro-3.0';

export interface GenerationResult {
  platform: Platform;
  text: string;
  imageUrl: string | null;
  imageEnabled: boolean;
  status: 'idle' | 'loading-text' | 'loading-image' | 'completed' | 'error' | 'refining';
  error?: string;
}

export interface ScheduledPost {
  id: string;
  platform: Platform;
  text: string;
  imageUrl: string | null;
  scheduledDate: Date;
}

export interface GenerationRequest {
  topic: string;
  tone: Tone;
  imageSize: ImageSize;
}

export interface GenerationHistoryItem {
  timestamp: number;
  tone: Tone;
  platforms: Platform[];
}

export type GenerationState = Record<Platform, GenerationResult>;