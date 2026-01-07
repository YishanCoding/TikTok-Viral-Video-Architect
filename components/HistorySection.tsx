import React from 'react';
import { History, RotateCcw, Clock, Calendar } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistorySectionProps {
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history, onRestore }) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-xl mt-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-slate-400" />
        Generation History
      </h2>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group bg-slate-900/50 border border-slate-700/50 hover:border-purple-500/50 rounded-xl p-3 transition-all hover:bg-slate-800/80"
          >
            <div className="flex gap-3">
              {/* Thumbnail (Result) */}
              <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-700 bg-black">
                 {item.generatedContent.visualAssetBase64 ? (
                   <img 
                    src={`data:image/jpeg;base64,${item.generatedContent.visualAssetBase64}`} 
                    alt="Result" 
                    className="w-full h-full object-cover"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">No img</div>
                 )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                   <p className="text-xs font-medium text-slate-300 truncate max-w-[120px]">
                     {item.productDescription.slice(0, 30)}...
                   </p>
                   <span className="text-[10px] text-slate-500 flex items-center gap-1">
                     <Clock className="w-3 h-3" />
                     {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
                
                <div className="flex gap-2 mb-2">
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                    {item.language}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                    {item.duration}
                  </span>
                </div>

                <button 
                  onClick={() => onRestore(item)}
                  className="w-full flex items-center justify-center gap-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 text-xs py-1.5 rounded-lg border border-purple-500/20 transition-colors group-hover:bg-purple-600 group-hover:text-white"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reuse & Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
