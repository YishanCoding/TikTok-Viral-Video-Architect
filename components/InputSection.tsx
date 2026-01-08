import React from 'react';
import { Upload, FileText, Sparkles, X, Trash2, Video, ScanFace } from 'lucide-react';
import { AppState } from '../types';

interface InputSectionProps {
  state: AppState;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveAllImages: () => void;
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: () => void;
  onAnalyzeVideo: () => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  state,
  onFileChange,
  onRemoveImage,
  onRemoveAllImages,
  onVideoChange,
  onRemoveVideo,
  onAnalyzeVideo,
  onDescriptionChange
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        Input Configuration
      </h2>

      <div className="space-y-8">
        
        {/* 1. Description (Moved to Top) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            1. Product Description & Selling Points
          </label>
          <div className="relative">
            <FileText className="absolute top-3 left-3 w-4 h-4 text-slate-500" />
            <textarea
              value={state.productDescription}
              onChange={onDescriptionChange}
              placeholder="e.g. A waterproof hiking backpack with anti-theft pockets..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px] resize-none"
            />
          </div>
        </div>

        {/* 2. Product Images Upload */}
        <div>
          <div className="flex justify-between items-center mb-2">
             <label className="block text-sm font-medium text-slate-300">
              2. Product Images
            </label>
            {state.productImagePreviews.length > 0 && (
              <button 
                onClick={onRemoveAllImages}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Remove All
              </button>
            )}
          </div>
         
          <div className="relative group">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`
              border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center
              ${state.productImagePreviews.length > 0 
                ? 'border-purple-500/30 bg-purple-500/5' 
                : 'border-slate-600 hover:border-purple-400 hover:bg-slate-700/50'}
            `}>
              <Upload className="w-8 h-8 text-slate-400 mb-3 group-hover:text-purple-400 transition-colors" />
              <p className="text-sm text-slate-400">Click to upload product images</p>
            </div>
          </div>

          {/* Image Previews Grid */}
          {state.productImagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {state.productImagePreviews.map((src, index) => (
                <div key={index} className="relative group/image aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                  <img 
                    src={src} 
                    alt={`Preview ${index}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onRemoveImage(index)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/80 text-white p-1 rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover/image:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Reference Video Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            3. Reference Viral Video
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">Analysis</span>
          </label>
          
          {!state.referenceVideo ? (
             <div className="relative group">
               <input
                 type="file"
                 accept="video/*"
                 onChange={onVideoChange}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               />
               <div className="border-2 border-dashed border-slate-600 group-hover:border-purple-400 rounded-xl p-6 transition-all flex flex-col items-center justify-center bg-slate-700/30 group-hover:bg-slate-700/50">
                 <Video className="w-6 h-6 text-slate-400 mb-2 group-hover:text-purple-400" />
                 <p className="text-sm text-slate-400">Upload a viral TikTok</p>
                 <p className="text-xs text-slate-500 mt-1">AI will mimic its structure</p>
               </div>
             </div>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden border border-slate-600 bg-slate-900">
                <video 
                  src={state.referenceVideoPreview || ''} 
                  className="w-full h-32 object-cover opacity-60" 
                  controls={false}
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col bg-black/40">
                  <p className="text-sm font-medium text-white mb-2 truncate max-w-[90%] px-4">
                    {state.referenceVideo.name}
                  </p>
                  <button
                    onClick={onRemoveVideo}
                    className="bg-red-500/80 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors backdrop-blur-sm"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Video
                  </button>
                </div>
              </div>
              
              <button 
                onClick={onAnalyzeVideo}
                disabled={state.isAnalyzing || !!state.videoAnalysis}
                className={`w-full py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors
                   ${state.videoAnalysis 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30 cursor-default' 
                      : 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 disabled:opacity-50'}
                `}
              >
                  {state.isAnalyzing ? <span className="animate-spin">⏳</span> : (state.videoAnalysis ? <CheckIcon /> : <ScanFace className="w-3 h-3" />)}
                  {state.isAnalyzing ? "Analyzing Video..." : (state.videoAnalysis ? "Analysis Complete" : "Analyze Video Structure")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
