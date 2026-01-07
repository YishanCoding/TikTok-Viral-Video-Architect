import React, { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { ResultSection } from './components/ResultSection';
import { HistorySection } from './components/HistorySection';
import { AppState, Language, Duration, HistoryItem } from './types';
import { generateCampaign, regenerateVisualsOnly, regenerateStrategyOnly } from './services/geminiService';
import { Play, Key, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isKeyCheckLoading, setIsKeyCheckLoading] = useState(true);

  const [state, setState] = useState<AppState>({
    productImages: [],
    productImagePreviews: [],
    referenceVideo: null,
    referenceVideoPreview: null,
    productDescription: '',
    language: Language.ENGLISH,
    duration: Duration.SHORT,
    variantCount: 1, // Default to 1
    isGenerating: false,
    isRegeneratingVisual: false,
    isRegeneratingStrategy: false,
    generatedContent: null,
    history: [],
    error: null,
  });

  // Check for API Key on mount
  useEffect(() => {
    async function checkKey() {
      if (window.aistudio) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        // If running outside of the specific environment, assume env var is set
        setHasApiKey(true);
      }
      setIsKeyCheckLoading(false);
    }
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      // Clear any previous errors
      setState(prev => ({ ...prev, error: null }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[];
      
      // Process previews
      const newPreviews: string[] = [];
      let processedCount = 0;

      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          processedCount++;
          if (processedCount === newFiles.length) {
            setState((prev) => ({
              ...prev,
              productImages: [...prev.productImages, ...newFiles],
              productImagePreviews: [...prev.productImagePreviews, ...newPreviews],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setState((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index),
      productImagePreviews: prev.productImagePreviews.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveAllImages = () => {
    setState((prev) => ({
      ...prev,
      productImages: [],
      productImagePreviews: [],
    }));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setState(prev => ({
        ...prev,
        referenceVideo: file,
        referenceVideoPreview: url
      }));
    }
  };

  const handleRemoveVideo = () => {
    if (state.referenceVideoPreview) {
      URL.revokeObjectURL(state.referenceVideoPreview);
    }
    setState(prev => ({
      ...prev,
      referenceVideo: null,
      referenceVideoPreview: null
    }));
  };

  const handleRestoreHistory = (item: HistoryItem) => {
    setState(prev => ({
      ...prev,
      productImages: item.productImages,
      productImagePreviews: item.productImagePreviews,
      referenceVideo: item.referenceVideo,
      referenceVideoPreview: item.referenceVideoPreview,
      productDescription: item.productDescription,
      language: item.language,
      duration: item.duration,
      variantCount: item.variantCount,
      generatedContent: item.generatedContent,
      error: null
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleError = (error: any) => {
     console.error(error);
      let errorMessage = "Failed to generate content.";
      const errorStr = JSON.stringify(error);
      if (errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED')) {
         errorMessage = "Permission Denied: The 'Gemini 3 Pro' model (4K images) requires a paid API Key. Please click 'Change API Key' below to select a project with billing enabled.";
      } else {
         errorMessage = "An error occurred. Please try again later.";
      }
      return errorMessage;
  };

  const handleSubmit = async () => {
    if (state.productImages.length === 0 || !state.productDescription) return;

    setState((prev) => ({ ...prev, isGenerating: true, error: null, generatedContent: null }));

    try {
      const content = await generateCampaign(
        state.productImages,
        state.referenceVideo,
        state.productDescription,
        state.language,
        state.duration,
        state.variantCount
      );

      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        productImages: state.productImages,
        productImagePreviews: state.productImagePreviews,
        referenceVideo: state.referenceVideo,
        referenceVideoPreview: state.referenceVideoPreview,
        productDescription: state.productDescription,
        language: state.language,
        duration: state.duration,
        variantCount: state.variantCount,
        generatedContent: content
      };

      setState((prev) => ({
        ...prev,
        isGenerating: false,
        generatedContent: content,
        history: [newItem, ...prev.history]
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: handleError(error),
      }));
    }
  };

  const handleRegenerateVisual = async () => {
    if (!state.generatedContent) return;
    setState(prev => ({ ...prev, isRegeneratingVisual: true, error: null }));
    try {
        const newVisual = await regenerateVisualsOnly(state.productImages, state.productDescription);
        setState(prev => ({
            ...prev,
            isRegeneratingVisual: false,
            generatedContent: prev.generatedContent ? {
                ...prev.generatedContent,
                visualAssetBase64: newVisual
            } : null
        }));
    } catch (error) {
        setState(prev => ({ ...prev, isRegeneratingVisual: false, error: handleError(error) }));
    }
  };

  const handleRegenerateStrategy = async () => {
    if (!state.generatedContent) return;
    setState(prev => ({ ...prev, isRegeneratingStrategy: true, error: null }));
    try {
        const newVariants = await regenerateStrategyOnly(
            state.productImages,
            state.referenceVideo,
            state.productDescription,
            state.language,
            state.duration,
            state.variantCount
        );
        setState(prev => ({
            ...prev,
            isRegeneratingStrategy: false,
            generatedContent: prev.generatedContent ? {
                ...prev.generatedContent,
                variants: newVariants
            } : null
        }));
    } catch (error) {
        setState(prev => ({ ...prev, isRegeneratingStrategy: false, error: handleError(error) }));
    }
  };

  if (isKeyCheckLoading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
    </div>;
  }

  // Landing Screen if no Key
  if (!hasApiKey && window.aistudio) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center shadow-2xl">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6">
            <Play className="w-8 h-8 text-white fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Viral Architect</h1>
          <p className="text-slate-400 mb-8">
            To generate 4K visuals and viral scripts, please connect your Google Cloud Project with a valid API Key.
          </p>
          <button
            onClick={handleConnectKey}
            className="w-full py-3 px-4 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
          >
            <Key className="w-5 h-5" />
            Connect Google API Key
          </button>
          <p className="text-xs text-slate-500 mt-4">
            Requires a project with billing enabled for Gemini 3 Pro access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-200">
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-slate-800/60 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
               <Play className="w-4 h-4 text-white fill-current" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              TikTok Viral Architect
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {window.aistudio && (
                <button 
                  onClick={handleConnectKey}
                  className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Change Key
                </button>
             )}
             <div className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                Gemini 3.0 Pro
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {state.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
             <div className="flex-1">
               <p className="text-red-400 text-sm font-medium">{state.error}</p>
               {state.error.includes("Permission Denied") && window.aistudio && (
                 <button 
                   onClick={handleConnectKey}
                   className="mt-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
                 >
                   Change API Key
                 </button>
               )}
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-24">
              <InputSection
                state={state}
                onFileChange={handleFileChange}
                onRemoveImage={handleRemoveImage}
                onRemoveAllImages={handleRemoveAllImages}
                onVideoChange={handleVideoChange}
                onRemoveVideo={handleRemoveVideo}
                onDescriptionChange={(e) => setState(prev => ({ ...prev, productDescription: e.target.value }))}
                onLanguageChange={(val) => setState(prev => ({ ...prev, language: val }))}
                onDurationChange={(val) => setState(prev => ({ ...prev, duration: val }))}
                onVariantCountChange={(val) => setState(prev => ({ ...prev, variantCount: val }))}
                onSubmit={handleSubmit}
              />

              <HistorySection 
                history={state.history} 
                onRestore={handleRestoreHistory} 
              />
              
              <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-xs text-slate-500 leading-relaxed">
                <p className="font-semibold text-slate-400 mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Upload raw product images.</li>
                  <li><strong>Optional:</strong> Upload a viral reference video.</li>
                  <li>AI generates a <strong>4K (9:16)</strong> visual base.</li>
                  <li>AI creates up to 3 viral strategies & Sora prompts.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
             {state.generatedContent ? (
               <ResultSection 
                 state={state} 
                 onRegenerateVisual={handleRegenerateVisual}
                 onRegenerateStrategy={handleRegenerateStrategy}
               />
             ) : (
               <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                 {!state.isGenerating ? (
                   <>
                     <Play className="w-16 h-16 mb-4 opacity-20" />
                     <p className="text-lg">Ready to generate your campaign</p>
                     <p className="text-sm opacity-60">Fill out the form on the left to begin</p>
                   </>
                 ) : (
                   <>
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-lg text-purple-200 animate-pulse">Designing Campaign...</p>
                    <p className="text-sm text-slate-500 mt-2">Analyzing video, rendering 4K assets & writing script</p>
                   </>
                 )}
               </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
