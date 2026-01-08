import React, { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { ResultSection } from './components/ResultSection';
import { HistorySection } from './components/HistorySection';
import { VideoAnalysisSection } from './components/VideoAnalysisSection';
import { AppState, Language, Duration, HistoryItem, VideoScene, ScriptRow } from './types';
import { 
    generateCampaign, 
    regenerateVisualsOnly, 
    regenerateStrategyOnly, 
    analyzeVideoContent, 
    captureVideoFrames, 
    generateSceneImage,
    regenerateScriptRow
} from './services/geminiService';
import { Play, Key, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isKeyCheckLoading, setIsKeyCheckLoading] = useState(true);

  const [state, setState] = useState<AppState>({
    productImages: [],
    productImagePreviews: [],
    referenceVideo: null,
    referenceVideoPreview: null,
    
    isAnalyzing: false,
    videoAnalysis: null,

    productDescription: '',
    language: Language.ENGLISH,
    duration: Duration.SHORT,
    variantCount: 1, 
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
      setState(prev => ({ ...prev, error: null }));
    }
  };

  const handleError = (error: any) => {
     console.error(error);
      let errorMessage = "Failed to generate content.";
      const errorStr = JSON.stringify(error);
      if (errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED')) {
         errorMessage = "Permission Denied: Access to Gemini models requires a paid API Key. Please click 'Change API Key'.";
      } else {
         errorMessage = "An error occurred. Please try again later.";
      }
      return errorMessage;
  };

  // --- File Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[];
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
    setState((prev) => ({ ...prev, productImages: [], productImagePreviews: [] }));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setState(prev => ({
        ...prev,
        referenceVideo: file,
        referenceVideoPreview: url,
        videoAnalysis: null // Reset analysis on new video
      }));
    }
  };

  const handleRemoveVideo = () => {
    if (state.referenceVideoPreview) URL.revokeObjectURL(state.referenceVideoPreview);
    setState(prev => ({
      ...prev,
      referenceVideo: null,
      referenceVideoPreview: null,
      videoAnalysis: null
    }));
  };

  // --- Logic Handlers ---

  const handleAnalyzeVideo = async () => {
    if (!state.referenceVideo) return;
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    try {
        // 1. Get structured data from Gemini
        const rawAnalysis = await analyzeVideoContent(state.referenceVideo);
        
        // 2. Extract timestamps for frame capture
        const captureTargets = rawAnalysis.map(s => ({ start: (s as any).rawStartTime }));
        
        // 3. Capture frames
        const screenshots = await captureVideoFrames(state.referenceVideo, captureTargets);

        // 4. Merge
        const finalAnalysis: VideoScene[] = rawAnalysis.map((scene, idx) => ({
            ...scene,
            screenshot: screenshots[idx] || ''
        }));

        setState(prev => ({
            ...prev,
            isAnalyzing: false,
            videoAnalysis: finalAnalysis
        }));

    } catch (error) {
        setState(prev => ({ ...prev, isAnalyzing: false, error: handleError(error) }));
    }
  };

  const handleSubmit = async () => {
    if (state.productImages.length === 0 || !state.productDescription) return;

    setState((prev) => ({ ...prev, isGenerating: true, error: null, generatedContent: null }));

    try {
      const content = await generateCampaign(
        state.productImages,
        state.videoAnalysis, // Pass analysis instead of raw video
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
        videoAnalysis: state.videoAnalysis,
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
      setState((prev) => ({ ...prev, isGenerating: false, error: handleError(error) }));
    }
  };

  // --- Result Action Handlers ---

  const handleRestoreHistory = (item: HistoryItem) => {
    setState(prev => ({
      ...prev,
      productImages: item.productImages,
      productImagePreviews: item.productImagePreviews,
      referenceVideo: item.referenceVideo,
      referenceVideoPreview: item.referenceVideoPreview,
      videoAnalysis: item.videoAnalysis,
      productDescription: item.productDescription,
      language: item.language,
      duration: item.duration,
      variantCount: item.variantCount,
      generatedContent: item.generatedContent,
      error: null
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegenerateStrategy = async () => {
    if (!state.generatedContent) return;
    setState(prev => ({ ...prev, isRegeneratingStrategy: true, error: null }));
    try {
        const newVariants = await regenerateStrategyOnly(
            state.productImages,
            state.videoAnalysis,
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

  const handleGenerateSceneVisual = async (variantIndex: number, rowIndex: number, visualDesc: string) => {
    // Optimistic Update: Set row loading state
    updateRowState(variantIndex, rowIndex, { isRegenerating: true });
    
    try {
        // Get the reference image from state
        const refImage = state.generatedContent?.productReferenceBase64 || null;
        
        const base64Image = await generateSceneImage(visualDesc, refImage);
        updateRowState(variantIndex, rowIndex, { isRegenerating: false, generatedVisual: base64Image });
    } catch (error) {
        console.error(error);
        updateRowState(variantIndex, rowIndex, { isRegenerating: false });
    }
  };

  const handleRegenerateRow = async (variantIndex: number, rowIndex: number) => {
    if (!state.generatedContent) return;
    updateRowState(variantIndex, rowIndex, { isRegenerating: true });
    
    try {
        const variant = state.generatedContent.variants[variantIndex];
        const row = variant.script[rowIndex];
        const context = `Product: ${state.productDescription}. Full Script so far: ${variant.script.map(s => s.visual).join(' | ')}`;
        
        const newRow = await regenerateScriptRow(row, context, state.language);
        
        // Update state with new row
        setState(prev => {
            if (!prev.generatedContent) return prev;
            const newVariants = [...prev.generatedContent.variants];
            newVariants[variantIndex].script[rowIndex] = { ...newRow, isRegenerating: false };
            return {
                ...prev,
                generatedContent: { ...prev.generatedContent, variants: newVariants }
            };
        });

    } catch (error) {
        updateRowState(variantIndex, rowIndex, { isRegenerating: false });
    }
  };

  const handleGenerateAllVisuals = async (variantIndex: number) => {
      if (!state.generatedContent) return;
      const variant = state.generatedContent.variants[variantIndex];
      
      // Mark all as loading
      variant.script.forEach((_, idx) => {
          if(!variant.script[idx].generatedVisual) updateRowState(variantIndex, idx, { isRegenerating: true });
      });

      // Process in parallel (batches of 3 to not hit rate limits too hard)
      // For simplicity in this demo, we do loop
      for (let i = 0; i < variant.script.length; i++) {
          const row = variant.script[i];
          if (!row.generatedVisual) {
              await handleGenerateSceneVisual(variantIndex, i, row.visual);
          }
      }
  };

  // Helper to deep update a row
  const updateRowState = (vIdx: number, rIdx: number, updates: Partial<ScriptRow>) => {
      setState(prev => {
          if (!prev.generatedContent) return prev;
          const newVariants = [...prev.generatedContent.variants];
          const newScript = [...newVariants[vIdx].script];
          newScript[rIdx] = { ...newScript[rIdx], ...updates };
          newVariants[vIdx] = { ...newVariants[vIdx], script: newScript };
          return {
              ...prev,
              generatedContent: { ...prev.generatedContent, variants: newVariants }
          };
      });
  };

  // Placeholder for old visual regen if needed, but we mostly use scene-based now
  const handleRegenerateVisual = () => {}; 

  if (isKeyCheckLoading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
    </div>;
  }

  // Landing Screen
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
                <button onClick={handleConnectKey} className="text-xs font-medium text-slate-400 hover:text-white">Change Key</button>
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
                 <button onClick={handleConnectKey} className="mt-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg">Change API Key</button>
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
                onAnalyzeVideo={handleAnalyzeVideo}
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
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
             
             {/* New: Video Analysis Section */}
             <VideoAnalysisSection 
                analysis={state.videoAnalysis} 
                isLoading={state.isAnalyzing} 
             />

             {state.generatedContent ? (
               <ResultSection 
                 state={state} 
                 onRegenerateVisual={handleRegenerateVisual}
                 onRegenerateStrategy={handleRegenerateStrategy}
                 onGenerateSceneVisual={handleGenerateSceneVisual}
                 onRegenerateRow={handleRegenerateRow}
                 onGenerateAllVisuals={handleGenerateAllVisuals}
               />
             ) : (
               !state.isAnalyzing && !state.videoAnalysis && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                    {!state.isGenerating ? (
                    <>
                        <Play className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">Ready to generate your campaign</p>
                        <p className="text-sm opacity-60">Upload video & analyze, or fill inputs to begin</p>
                    </>
                    ) : (
                    <>
                        <div className="relative w-16 h-16 mb-4">
                        <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-lg text-purple-200 animate-pulse">Designing Campaign...</p>
                        <p className="text-sm text-slate-500 mt-2">1. Generating Product Reference Grid...</p>
                        <p className="text-sm text-slate-500">2. Analyzing Video & Strategy...</p>
                    </>
                    )}
                </div>
               )
             )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
