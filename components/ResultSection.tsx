import React, { useState } from 'react';
import { Download, Copy, Clapperboard, Sparkles, Image as ImageIcon, Check, RefreshCw } from 'lucide-react';
import { AppState } from '../types';

interface ResultSectionProps {
  state: AppState;
  onRegenerateVisual: () => void;
  onRegenerateStrategy: () => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({ state, onRegenerateVisual, onRegenerateStrategy }) => {
  if (!state.generatedContent) return null;
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { visualAssetBase64, variants } = state.generatedContent;
  const activeVariant = variants[activeTab];

  const getCombinedText = () => {
    if (!activeVariant) return "";
    const scriptText = activeVariant.script.map(s => 
      `[${s.timeframe}] Scene: ${s.visual} | Audio: "${s.audio}"`
    ).join('\n');

    return `SORA-2 IMAGE-TO-VIDEO PROMPT:
${activeVariant.soraPrompt}

TIMELINE GUIDANCE:
${scriptText}`;
  };

  const handleCopyCombined = () => {
    navigator.clipboard.writeText(getCombinedText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (visualAssetBase64) {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${visualAssetBase64}`;
      link.download = 'tiktok-4k-9grid-reference.jpg';
      link.click();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Visual Asset Section */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            1. Visual Base: 4K 9-Grid Reference
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={onRegenerateVisual}
              disabled={state.isRegeneratingVisual}
              className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3 h-3 ${state.isRegeneratingVisual ? 'animate-spin' : ''}`} />
              {state.isRegeneratingVisual ? 'Redrawing...' : 'Regenerate'}
            </button>
            <button 
              onClick={handleDownloadImage}
              className="text-xs flex items-center gap-1 bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-1.5 rounded-full transition-colors"
            >
              <Download className="w-3 h-3" /> Save
            </button>
          </div>
        </div>
        <div className="p-6 flex justify-center bg-slate-900/20 relative min-h-[300px]">
          {state.isRegeneratingVisual ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs text-blue-300">Rendering 4K Visuals...</p>
             </div>
          ) : null}
          
          {visualAssetBase64 ? (
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-700 max-w-[320px] w-full group">
              {/* Aspect Ratio 9:16 Container */}
              <div className="relative w-full pb-[177.77%]"> 
                <img 
                  src={`data:image/jpeg;base64,${visualAssetBase64}`} 
                  alt="Generated 9-Grid" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                Gemini 3 Pro | 4K
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center text-slate-500 italic h-[300px] w-full">
                <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
                No image available
             </div>
          )}
        </div>
      </div>

      {/* 2. Strategy Section */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 bg-slate-900/30 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            2. Content Strategy
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={onRegenerateStrategy}
              disabled={state.isRegeneratingStrategy}
              className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3 h-3 ${state.isRegeneratingStrategy ? 'animate-spin' : ''}`} />
              {state.isRegeneratingStrategy ? 'Thinking...' : 'Regenerate'}
            </button>
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
            <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-slate-700">
                {/* Left: Visual Prompt */}
                <div className="p-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Sora-2 Motion Prompt</h4>
                    <div className="bg-black/30 p-4 rounded-xl border border-slate-700/50 min-h-[150px]">
                        <p className="font-mono text-sm text-purple-200 whitespace-pre-wrap">{activeVariant.soraPrompt}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                        *Tip: Upload the 9-grid image above to Sora, then paste this prompt.
                    </p>
                </div>

                {/* Right: Script Breakdown */}
                <div className="p-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <Clapperboard className="w-3 h-3" />
                        Script Guidance: {activeVariant.name}
                    </h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {activeVariant.script.map((row, idx) => (
                            <div key={idx} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{row.timeframe}</span>
                                    <span className="text-[10px] text-slate-500 border border-slate-700 px-1.5 rounded">{row.style}</span>
                                </div>
                                <div className="text-xs text-slate-300 mb-1.5"><span className="text-slate-500">Visual:</span> {row.visual}</div>
                                <div className="text-sm font-medium text-white italic pl-2 border-l-2 border-green-500/50">
                                    "{row.audio}"
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

    </div>
  );
};
