import React from 'react';
import { VideoScene } from '../types';
import { Play, Clock, MessageSquare, Globe, AlignLeft } from 'lucide-react';

interface VideoAnalysisSectionProps {
  analysis: VideoScene[] | null;
  isLoading: boolean;
}

const CategoryBadge = ({ category }: { category: string }) => {
  const colors: Record<string, string> = {
    'Product Info': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Usage': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Benefits': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Hook': 'bg-red-500/20 text-red-300 border-red-500/30',
    'CTA': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Other': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colors[category] || colors['Other']}`}>
      {category}
    </span>
  );
};

export const VideoAnalysisSection: React.FC<VideoAnalysisSectionProps> = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 mb-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
               <div className="w-24 h-32 bg-slate-800 rounded-lg"></div>
               <div className="flex-1 space-y-2">
                 <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
                 <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
               </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 text-purple-400">
           <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
           <span className="text-sm">Analyzing video scenes and transcript...</span>
        </div>
      </div>
    );
  }

  if (!analysis || analysis.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl overflow-hidden mb-6 shadow-2xl">
      <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <AlignLeft className="w-5 h-5 text-purple-400" />
          Video Scene Analysis
        </h3>
        <span className="text-xs text-slate-500">{analysis.length} Scenes Detected</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-6 space-y-4">
        {analysis.map((scene, idx) => (
          <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/30 transition-colors">
            {/* Screenshot */}
            <div className="shrink-0 w-24 h-40 bg-black rounded-lg overflow-hidden border border-slate-700 relative group">
              <img src={scene.screenshot} alt={`Scene ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 rounded">
                {scene.startTime}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">{scene.startTime} - {scene.endTime}</span>
                  <CategoryBadge category={scene.category} />
                </div>
              </div>

              <div className="space-y-2">
                 {/* Transcript Original */}
                 <div className="flex gap-2 items-start">
                    <MessageSquare className="w-3 h-3 text-slate-500 mt-1 shrink-0" />
                    <p className="text-xs text-slate-300 italic">"{scene.transcriptOriginal}"</p>
                 </div>
                 
                 {/* Translation */}
                 <div className="flex gap-2 items-start">
                    <Globe className="w-3 h-3 text-blue-400 mt-1 shrink-0" />
                    <p className="text-sm text-white font-medium">{scene.transcriptTranslation}</p>
                 </div>

                 {/* Visual Description */}
                 <div className="flex gap-2 items-start pt-1">
                    <Play className="w-3 h-3 text-purple-400 mt-1 shrink-0" />
                    <p className="text-xs text-slate-400 line-clamp-2">{scene.description}</p>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
