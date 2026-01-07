export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish'
}

export enum Duration {
  SHORT = '15 Seconds',
  LONG = '25 Seconds'
}

export interface ScriptRow {
  timeframe: string;
  visual: string;
  audio: string;
  style: string;
}

export interface ScriptVariant {
  id: string;
  name: string;
  script: ScriptRow[];
  soraPrompt: string;
}

export interface GeneratedContent {
  visualAssetBase64: string | null; // The 9-grid image
  variants: ScriptVariant[]; // Array of script/prompt variations
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  productImages: File[];
  productImagePreviews: string[];
  referenceVideo: File | null;
  referenceVideoPreview: string | null;
  productDescription: string;
  language: Language;
  duration: Duration;
  variantCount: number;
  generatedContent: GeneratedContent; 
}

export interface AppState {
  productImages: File[];
  productImagePreviews: string[];
  referenceVideo: File | null; 
  referenceVideoPreview: string | null; 
  productDescription: string;
  language: Language;
  duration: Duration;
  variantCount: number; // New: Number of variants to generate
  isGenerating: boolean;
  isRegeneratingVisual: boolean; // New: Loading state for visual regen
  isRegeneratingStrategy: boolean; // New: Loading state for strategy regen
  generatedContent: GeneratedContent | null;
  history: HistoryItem[]; 
  error: string | null;
}
