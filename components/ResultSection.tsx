import React, { useState } from 'react';
import { Download, Copy, Clapperboard, Sparkles, Image as ImageIcon, Check, RefreshCw, Wand2, ArrowRight, Box } from 'lucide-react';
import { AppState, ScriptRow } from '../types';

interface ResultSectionProps {
  state: AppState;
  onRegenerateVisual: () => void;
  onRegenerateStrategy: () => void;
  onGenerateSceneVisual: (variantIndex: number, rowIndex: number, visualDesc: string) => void;
  onRegenerateRow: (variantIndex: number, rowIndex: number) => void;
  onGenerateAllVisuals: (variantIndex: number) => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({ 
  state, 
  onRegenerateVisual, 
  onRegenerateStrategy, 
  onGenerateSceneVisual,
  onRegenerateRow,
  onGenerateAllVisuals
}) => {
  if (!state.generatedContent) return null;
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { productReferenceBase64, visualAssetBase64, variants } = state.generatedContent;
  const activeVariant = variants[activeTab];

  // Helper: check if all scenes in active variant have visuals
  const allVisualsGenerated = activeVariant.script.every(row => !!row.generatedVisual);

  const handleCopyCombined = () => {
     if (!activeVariant) return;
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
      
      {/* 1. Product Reference Grid (New Section) */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-400" />
            1. Product Reference (White Base)
          </h3>
          <button 
             onClick={() => {
                if (productReferenceBase64) {
                    const link = document.createElement('a');
                    link.href = `data:image/jpeg;base64,${productReferenceBase64}`;
                    link.download = 'product-reference-grid.jpg';
                    link.click();
                }
             }}
             className="text-xs flex items-center gap-1 bg-indigo-600/80 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-full transition-colors"
           >
             <Download className="w-3 h-3" /> Save
           </button>
        </div>
        <div className="p-6 bg-slate-900/20 flex justify-center">
             {productReferenceBase64 ? (
               <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-700 max-w-[200px] w-full group">
                 <div className="relative w-full pb-[177.77%]"> 
                   <img 
                     src={`data:image/jpeg;base64,${productReferenceBase64}`} 
                     alt="Product Grid" 
                     className="absolute inset-0 w-full h-full object-cover"
                   />
                 </div>
               </div>
             ) : (
                <div className="h-40 flex items-center text-slate-500">Generating Reference...</div>
             )}
        </div>
      </div>

      {/* 2. Strategy Section */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 bg-slate-900/30 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-purple-400" />
            2. Script Guidance & Scenes
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={onRegenerateStrategy}
              disabled={state.isRegeneratingStrategy}
              className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3 h-3 ${state.isRegeneratingStrategy ? 'animate-spin' : ''}`} />
              {state.isRegeneratingStrategy ? 'Thinking...' : 'Regenerate All'}
            </button>
          </div>
        </div>

        {/* Tab Navigation for Variants */}
        {variants.length > 1 && (
            <div className="flex border-b border-slate-700 px-4 bg-slate-900/20 overflow-x-auto">
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
           {state.isRegeneratingStrategy && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs text-purple-300">Designing new strategies...</p>
             </div>
           )}

           {activeVariant ? (
            <div className="flex flex-col">
                
                {/* Script Breakdown with Visual Gen */}
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Clapperboard className="w-3 h-3" />
                            Script Timeline
                        </h4>
                        {!allVisualsGenerated && (
                          <button
                            onClick={() => onGenerateAllVisuals(activeTab)}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-lg shadow-indigo-500/20"
                          >
                             <Wand2 className="w-3 h-3" /> Generate All Visuals
                          </button>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        {activeVariant.script.map((row, idx) => (
                            <div key={row.id} className="group bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all overflow-hidden flex flex-col sm:flex-row">
                                {/* Visual Preview / Gen */}
                                <div className="sm:w-32 h-40 sm:h-auto bg-black shrink-0 relative border-b sm:border-b-0 sm:border-r border-slate-700/50">
                                   {row.generatedVisual ? (
                                     <img src={`data:image/jpeg;base64,${row.generatedVisual}`} className="w-full h-full object-cover" alt="Scene" />
                                   ) : (
                                     <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                                       {row.isRegenerating ? (
                                         <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                                       ) : (
                                          <button 
                                            onClick={() => onGenerateSceneVisual(activeTab, idx, row.visual)}
                                            className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white p-2 rounded-full transition-colors"
                                            title="Generate Scene Image based on Product Reference"
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
                                        className="absolute bottom-1 right-1 bg-black/60 hover:bg-slate-700 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
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
                                    <div className="text-sm text-slate-300 mb-2">
                                      <span className="text-slate-500 text-xs uppercase font-bold mr-2">Visual:</span> 
                                      {row.visual}
                                    </div>
                                    <div className="bg-slate-800/50 p-2 rounded border-l-2 border-green-500/50">
                                      <p className="text-xs text-slate-400 mb-1">Audio ({state.language})</p>
                                      <p className="text-sm font-medium text-white italic">"{row.audio}"</p>
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
               <p>No strategy generated yet</p>
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
              {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Full</>}
            </button>
        </div>
        <div className="p-6 bg-slate-900/20">
             {activeVariant ? (
                <>
                    <div className="bg-black/30 p-4 rounded-xl border border-slate-700/50 min-h-[100px] text-sm text-purple-200 font-mono whitespace-pre-wrap">
                        {activeVariant.soraPrompt}
                    </div>
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
        </div>
        <div className="p-6 bg-slate-900/20 min-h-[300px]">
          {activeVariant && allVisualsGenerated ? (
             <div className="grid grid-cols-3 gap-1 max-w-sm mx-auto aspect-[9/16] bg-black p-1 border border-slate-700 rounded-lg shadow-2xl">
               {activeVariant.script.slice(0, 9).map((row, i) => ( // Show first 9 scenes or repeat if less
                  <div key={i} className="relative w-full h-full overflow-hidden bg-slate-800">
                      {row.generatedVisual ? (
                          <img src={`data:image/jpeg;base64,${row.generatedVisual}`} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">Empty</div>
                      )}
                  </div>
               ))}
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center text-slate-500 italic h-[300px] w-full">
                <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
                <p>Generate visuals for all script scenes above to compose the final 9-Grid.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
