import React, { useState } from 'react';
import { Download, Copy, Clapperboard, Sparkles, Image as ImageIcon, Check, RefreshCw, Wand2, ArrowRight, Box, Play, Layers, CheckCircle, ZoomIn, X } from 'lucide-react';
import { AppState, ScriptRow, Language, Duration } from '../types';

interface ResultSectionProps {
  state: AppState;
  onGenerateProductGrid: () => void;
  onGenerateScripts: () => void;
  onComposeFinalGrid: () => void;
  onRegenerateStrategy: () => void;
  onGenerateSceneVisual: (variantIndex: number, rowIndex: number, visualDesc: string) => void;
  onRegenerateRow: (variantIndex: number, rowIndex: number) => void;
  onGenerateAllVisuals: (variantIndex: number) => void;
  onToggleFeature: (feature: string) => void;
  onLanguageChange: (val: Language) => void;
  onDurationChange: (val: Duration) => void;
  onSceneCountChange: (val: number) => void;
  onVariantCountChange: (val: number) => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({ 
  state, 
  onGenerateProductGrid,
  onGenerateScripts,
  onComposeFinalGrid,
  onRegenerateStrategy, 
  onGenerateSceneVisual,
  onRegenerateRow,
  onGenerateAllVisuals,
  onToggleFeature,
  onLanguageChange,
  onDurationChange,
  onSceneCountChange,
  onVariantCountChange
}) => {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Derived state
  const variants = state.generatedContent?.variants || [];
  const activeVariant = variants[activeTab];
  const allVisualsGenerated = activeVariant?.script.every(row => !!row.generatedVisual);
  const productRef = state.generatedContent?.productReferenceBase64;
  const finalGrid = state.generatedContent?.visualAssetBase64;

  const handleCopyCombined = () => {
     if (!activeVariant) return;
     // Only copy English/Original content, ignore translations
     const scriptText = activeVariant.script.map(s => 
      `[${s.timeframe}] Scene: ${s.visual} | Audio: "${s.audio}"`
    ).join('\n');

    const text = `SORA-2 IMAGE-TO-VIDEO PROMPT:
${activeVariant.soraPrompt}

TIMELINE GUIDANCE:
${scriptText}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
           <button 
             onClick={() => setPreviewImage(null)}
             className="absolute top-4 right-4 text-white p-2 bg-slate-800/80 rounded-full hover:bg-slate-700 transition-colors z-50"
           >
             <X className="w-6 h-6" />
           </button>
           <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
             <img 
               src={previewImage} 
               className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
               onClick={(e) => e.stopPropagation()} // Prevent close on image click
               alt="Full Preview"
             />
           </div>
        </div>
      )}

      {/* 1. Product Reference Grid */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-400" />
            1. Product Reference (White Base)
          </h3>
          <div className="flex gap-2">
              <button
                onClick={onGenerateProductGrid}
                disabled={state.isGeneratingProductGrid || state.productImages.length === 0}
                className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors 
                    ${state.isGeneratingProductGrid ? 'bg-indigo-700 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}
                `}
              >
                  {state.isGeneratingProductGrid ? (
                      <><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</>
                  ) : (
                      <><RefreshCw className="w-3 h-3" /> {productRef ? 'Regenerate' : 'Generate Reference'}</>
                  )}
              </button>
              {productRef && (
                <button 
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = `data:image/jpeg;base64,${productRef}`;
                        link.download = 'product-reference-grid.jpg';
                        link.click();
                    }}
                    className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                >
                    <Download className="w-3 h-3" /> Save
                </button>
              )}
          </div>
        </div>
        <div className="p-6 bg-slate-900/20 flex justify-center min-h-[160px]">
             {productRef ? (
               <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-700 max-w-[200px] w-full group">
                 <div className="relative w-full pb-[177.77%]"> 
                   <img 
                     src={`data:image/jpeg;base64,${productRef}`} 
                     alt="Product Grid" 
                     className="absolute inset-0 w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                     <button
                        onClick={() => setPreviewImage(`data:image/jpeg;base64,${productRef}`)}
                        className="bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-transform hover:scale-110"
                     >
                       <ZoomIn className="w-5 h-5" />
                     </button>
                   </div>
                 </div>
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Box className="w-8 h-8 opacity-20" />
                    <p className="text-sm">Generate a white-background product grid first.</p>
                </div>
             )}
        </div>
      </div>

      {/* 2. Strategy Section (Script Guidance & Scenes) */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 bg-slate-900/30 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-purple-400" />
            3. Script Guidance & Scenes
          </h3>
        </div>
        
        {/* NEW: Configuration Area (Features, Lang, Dur, Qty) */}
        <div className="p-6 bg-slate-900/20 border-b border-slate-700/50">
            {/* Features Selection */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Select Extracted Features to Integrate
                </h4>
                {state.videoAnalysis ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {state.videoAnalysis.features.map((featureItem, idx) => {
                            const isSelected = state.selectedFeatures.includes(featureItem.text);
                            return (
                                <label key={idx} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-purple-900/20 border-purple-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={() => onToggleFeature(featureItem.text)}
                                        className="mt-1 w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500 bg-slate-900 shrink-0" 
                                    />
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-400'}`}>{featureItem.text}</span>
                                        <span className="text-[10px] text-slate-500 mt-0.5">{featureItem.translation}</span>
                                    </div>
                                </label>
                            )
                        })}
                    </div>
                ) : (
                    <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 text-center text-slate-500 text-xs italic">
                        Analyze video first to extract features.
                    </div>
                )}
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full grid grid-cols-4 gap-3">
                    {/* Language */}
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Language</label>
                        <select
                            value={state.language}
                            onChange={(e) => onLanguageChange(e.target.value as Language)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            {Object.values(Language).map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Duration</label>
                        <select
                            value={state.duration}
                            onChange={(e) => onDurationChange(e.target.value as Duration)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            {Object.values(Duration).map((dur) => (
                            <option key={dur} value={dur}>{dur}</option>
                            ))}
                        </select>
                    </div>

                    {/* Scene Count (New) */}
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Scenes</label>
                        <select
                            value={state.sceneCount || 5}
                            onChange={(e) => onSceneCountChange(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <option key={n} value={n}>{n} Scenes</option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Variants</label>
                        <select
                            value={state.variantCount}
                            onChange={(e) => onVariantCountChange(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            <option value={1}>1 Option</option>
                            <option value={2}>2 Options</option>
                            <option value={3}>3 Options</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={onGenerateScripts}
                    disabled={state.isGeneratingScripts || !state.videoAnalysis || state.selectedFeatures.length === 0}
                    className={`h-10 px-6 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-lg
                        ${state.isGeneratingScripts 
                            ? 'bg-purple-700 cursor-wait text-purple-200' 
                            : (!state.videoAnalysis || state.selectedFeatures.length === 0) 
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20 hover:shadow-purple-500/40'
                        }
                    `}
                >
                    {state.isGeneratingScripts ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Scripts...</>
                    ) : (
                        <><Sparkles className="w-4 h-4" /> {variants.length > 0 ? 'Regenerate Scripts' : 'Generate Scripts'}</>
                    )}
                </button>
            </div>
        </div>
        
        {/* Generated Variants Tabs */}
        {variants.length > 0 && (
            <div className="flex border-b border-slate-700 px-4 bg-slate-900/20 overflow-x-auto mt-4">
                {variants.map((variant, idx) => (
                    <button
                        key={variant.id}
                        onClick={() => setActiveTab(idx)}
                        className={`
                            py-3 px-4 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
                            ${idx === activeTab 
                                ? 'border-purple-500 text-purple-400' 
                                : 'border-transparent text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        Option {idx + 1}: {variant.name}
                    </button>
                ))}
            </div>
        )}

        <div className="relative min-h-[400px]">
           {state.isGeneratingScripts && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs text-purple-300">Designing new strategies...</p>
             </div>
           )}

           {activeVariant ? (
            <div className="flex flex-col">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Clapperboard className="w-3 h-3" />
                            Script Timeline
                        </h4>
                        {!allVisualsGenerated && (
                          <div className="relative group/tooltip">
                            <button
                                onClick={() => onGenerateAllVisuals(activeTab)}
                                disabled={!productRef}
                                className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-lg
                                   ${!productRef 
                                     ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                                     : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}
                                `}
                            >
                                <Wand2 className="w-3 h-3" /> Generate All Visuals
                            </button>
                            {!productRef && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-300 shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none">
                                    Generate Product Reference Grid (Step 1) first to enable scene visuals.
                                </div>
                            )}
                          </div>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        {activeVariant.script.map((row, idx) => (
                            <div key={row.id} className="group bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all overflow-hidden flex flex-col sm:flex-row">
                                {/* Visual Preview / Gen */}
                                <div className="sm:w-32 h-40 sm:h-auto bg-black shrink-0 relative border-b sm:border-b-0 sm:border-r border-slate-700/50 group/image">
                                   {row.generatedVisual ? (
                                     <>
                                        <img src={`data:image/jpeg;base64,${row.generatedVisual}`} className="w-full h-full object-cover" alt="Scene" />
                                        <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100 pointer-events-none">
                                            <button
                                                onClick={() => setPreviewImage(`data:image/jpeg;base64,${row.generatedVisual}`)}
                                                className="bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-transform hover:scale-110 pointer-events-auto"
                                            >
                                                <ZoomIn className="w-4 h-4" />
                                            </button>
                                        </div>
                                     </>
                                   ) : (
                                     <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                                       {row.isRegenerating ? (
                                         <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                                       ) : (
                                          <button 
                                            onClick={() => onGenerateSceneVisual(activeTab, idx, row.visual)}
                                            disabled={!productRef}
                                            className={`p-2 rounded-full transition-colors 
                                                ${!productRef 
                                                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                                                    : 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white'}
                                            `}
                                            title={!productRef ? "Generate Product Reference first" : "Generate Scene Image"}
                                          >
                                            <ImageIcon className="w-4 h-4" />
                                          </button>
                                       )}
                                       <span className="text-[10px] text-slate-500 mt-2">Generate Visual</span>
                                     </div>
                                   )}
                                   {row.generatedVisual && (
                                     <button 
                                        onClick={() => onGenerateSceneVisual(activeTab, idx, row.visual)}
                                        className="absolute bottom-1 right-1 bg-black/60 hover:bg-slate-700 text-white p-1.5 rounded-md opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
                                        title="Regenerate Image"
                                     >
                                       <RefreshCw className="w-3 h-3" />
                                     </button>
                                   )}
                                </div>

                                {/* Script Content */}
                                <div className="p-4 flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-2">
                                            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{row.timeframe}</span>
                                            <span className="text-[10px] text-slate-500 border border-slate-700 px-1.5 rounded">{row.style}</span>
                                        </div>
                                        <button 
                                          onClick={() => onRegenerateRow(activeTab, idx)}
                                          disabled={row.isRegenerating}
                                          className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1"
                                        >
                                           <RefreshCw className={`w-3 h-3 ${row.isRegenerating ? 'animate-spin' : ''}`} /> 
                                           Rewrite
                                        </button>
                                    </div>
                                    
                                    {/* Visual Text */}
                                    <div className="mb-3">
                                        <div className="text-sm text-slate-300">
                                            <span className="text-slate-500 text-xs uppercase font-bold mr-2">Visual:</span> 
                                            {row.visual}
                                        </div>
                                        {row.visualTranslation && (
                                            <div className="text-xs text-slate-500 mt-1 pl-10">
                                                {row.visualTranslation}
                                            </div>
                                        )}
                                    </div>

                                    {/* Audio Text */}
                                    <div className="bg-slate-800/50 p-2 rounded border-l-2 border-green-500/50">
                                      <p className="text-xs text-slate-400 mb-1">Audio ({state.language})</p>
                                      <p className="text-sm font-medium text-white italic">"{row.audio}"</p>
                                      {row.audioTranslation && (
                                          <p className="text-xs text-slate-500 italic mt-1">"{row.audioTranslation}"</p>
                                      )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
               <Clapperboard className="w-10 h-10 mb-2 opacity-20" />
               <p>{state.videoAnalysis ? "Configure and generate scripts above" : "Analyze video first"}</p>
             </div>
           )}
        </div>
      </div>

      {/* 3. Sora-2 Prompt Section */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <Sparkles className="w-5 h-5 text-blue-400" />
             3. Sora-2 Motion Prompt
          </h3>
          <button 
              onClick={handleCopyCombined}
              disabled={!activeVariant}
              className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors font-medium
                ${copied 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'}
              `}
            >
              {copied ? <><Check className="w-3 h-3" /> Copied (English Only)!</> : <><Copy className="w-3 h-3" /> Copy Full (EN)</>}
            </button>
        </div>
        <div className="p-6 bg-slate-900/20">
             {activeVariant ? (
                <>
                    <div className="bg-black/30 p-4 rounded-xl border border-slate-700/50 min-h-[100px] text-sm text-purple-200 font-mono whitespace-pre-wrap">
                        {activeVariant.soraPrompt}
                    </div>
                    {activeVariant.soraPromptTranslation && (
                        <div className="mt-2 pl-2 text-xs text-slate-500 font-mono border-l-2 border-slate-700">
                            {activeVariant.soraPromptTranslation}
                        </div>
                    )}
                    <div className="mt-4 text-[10px] text-slate-500">
                        * Use the Image Grid generated below as the start_image for this prompt.
                    </div>
                </>
             ) : (
                 <div className="text-slate-500 italic">No prompt generated</div>
             )}
        </div>
      </div>

      {/* 4. Final Visual Grid (Summary) */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            4. Final 9-Grid Storyboard
          </h3>
          <div className="flex gap-2">
            <button 
                onClick={onComposeFinalGrid}
                disabled={!allVisualsGenerated || state.isComposingFinalGrid}
                className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors
                   ${!allVisualsGenerated 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white'}
                `}
            >
                {state.isComposingFinalGrid ? (
                     <><RefreshCw className="w-3 h-3 animate-spin" /> Composing...</>
                ) : (
                     <><ImageIcon className="w-3 h-3" /> Compose Final Grid</>
                )}
            </button>
            {finalGrid && (
                <button 
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = `data:image/jpeg;base64,${finalGrid}`;
                        link.download = 'final-9-grid-storyboard.jpg';
                        link.click();
                    }}
                    className="text-xs flex items-center gap-1 bg-green-600/80 hover:bg-green-600 text-white px-3 py-1.5 rounded-full transition-colors"
                >
                    <Download className="w-3 h-3" /> Download Grid
                </button>
            )}
          </div>
        </div>
        <div className="p-6 bg-slate-900/20 min-h-[400px] flex justify-center">
          {finalGrid ? (
             <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-700 max-w-[300px] w-full group">
                 <div className="relative w-full pb-[177.77%]"> 
                   <img 
                     src={`data:image/jpeg;base64,${finalGrid}`} 
                     alt="Final Grid" 
                     className="absolute inset-0 w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                     <button
                        onClick={() => setPreviewImage(`data:image/jpeg;base64,${finalGrid}`)}
                        className="bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-transform hover:scale-110"
                     >
                       <ZoomIn className="w-5 h-5" />
                     </button>
                   </div>
                 </div>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center text-slate-500 italic h-full w-full">
                <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
                <p>Generate visuals for all script scenes above to compose the final 9-Grid.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
