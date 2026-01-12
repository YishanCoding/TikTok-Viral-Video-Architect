
export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish'
}

export enum Duration {
  SHORT = '15 Seconds',
  LONG = '25 Seconds'
}

export interface ScriptRow {
  id: string; // Unique ID for regeneration targeting
  timeframe: string;
  visual: string; // The main action description
  visualTranslation: string; // Simplified Chinese
  
  // New Director Details
  shotType: string; // e.g., "Extreme Close-up", "Wide Angle"
  movement: string; // e.g., "Slow Pan Right", "Handheld Shake"
  lighting: string; // e.g., "Golden Hour", "Studio Softbox"
  
  audio: string;
  audioTranslation: string; // Simplified Chinese
  style: string;
  generatedVisual?: string | null; // Base64 of the Nano Banana image
  isRegenerating?: boolean;
}

export interface ScriptVariant {
  id: string;
  name: string;
  script: ScriptRow[];
  soraPrompt: string;
  soraPromptTranslation: string; // New: Simplified Chinese
}

export interface FeatureItem {
  text: string;
  translation: string;
}

export interface VideoAnalysisResult {
  scenes: VideoScene[];
  features: FeatureItem[]; // Extracted selling points with translation
  
  // New Global Analysis Fields
  visualStyle: string; // e.g., "High-Key Minimalist", "Gritty Urban"
  pacing: string; // e.g., "Fast-paced, energetic", "Slow, emotional"
  colorGrade: string; // e.g., "Warm Vintage", "Cool Cyberpunk"
}

export interface VideoScene {
  startTime: string; // "00:00"
  endTime: string;   // "00:04"
  screenshot: string; // Base64
  description: string; // Content summary
  category: 'Product Info' | 'Usage' | 'Benefits' | 'Hook' | 'CTA' | 'Other';
  transcriptOriginal: string;
  transcriptTranslation: string; // Simplifed Chinese
  rawStartTime: number;
}

export interface GeneratedContent {
  productReferenceBase64: string | null; // Step 1 White background product grid
  visualAssetBase64: string | null; // The Final 9-grid storyboard
  variants: ScriptVariant[]; 
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  productImages: File[];
  productImagePreviews: string[];
  referenceVideo: File | null;
  referenceVideoPreview: string | null;
  videoAnalysis: VideoAnalysisResult | null;
  selectedFeatures: string[];
  productDescription: string;
  language: Language;
  duration: Duration;
  sceneCount: number;
  variantCount: number;
  generatedContent: GeneratedContent; 
}

export interface AppState {
  productImages: File[];
  productImagePreviews: string[];
  referenceVideo: File | null; 
  referenceVideoPreview: string | null;
  
  // Analysis State
  isAnalyzing: boolean;
  videoAnalysis: VideoAnalysisResult | null;
  selectedFeatures: string[];

  productDescription: string;
  language: Language;
  duration: Duration;
  sceneCount: number;
  variantCount: number; 
  
  // Granular Generation States
  isGeneratingProductGrid: boolean;
  isGeneratingScripts: boolean;
  isComposingFinalGrid: boolean;
  
  generatedContent: GeneratedContent | null;
  history: HistoryItem[]; 
  error: string | null;
}
