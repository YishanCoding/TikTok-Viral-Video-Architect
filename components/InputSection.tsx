import React from 'react';
import { Upload, FileText, Globe, Clock, Sparkles, X, Trash2, Video, AlertCircle, Layers } from 'lucide-react';
import { Language, Duration, AppState } from '../types';

interface InputSectionProps {
  state: AppState;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveAllImages: () => void;
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: () => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onLanguageChange: (val: Language) => void;
  onDurationChange: (val: Duration) => void;
  onVariantCountChange: (val: number) => void;
  onSubmit: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  state,
  onFileChange,
  onRemoveImage,
  onRemoveAllImages,
  onVideoChange,
  onRemoveVideo,
  onDescriptionChange,
  onLanguageChange,
  onDurationChange,
  onVariantCountChange,
  onSubmit
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        Configuration
      </h2>

      <div className="space-y-6">
        {/* Product Images Upload */}
        <div>
          <div className="flex justify-between items-center mb-2">
             <label className="block text-sm font-medium text-slate-300">
              Product Images
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

        {/* Reference Video Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            Reference Viral Video
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
          )}
          
          <div className="mt-2 flex items-start gap-2 text-xs text-yellow-500/80 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
             <AlertCircle className="w-4 h-4 shrink-0" />
             <p>Upload a "Best Seller" video here. The AI will analyze its hook, pacing, and transitions.</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Product Description & Selling Points
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

        <div className="grid grid-cols-3 gap-3">
          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Language
            </label>
            <div className="relative">
              <select
                value={state.language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                {Object.values(Language).map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Duration
            </label>
            <div className="relative">
              <select
                value={state.duration}
                onChange={(e) => onDurationChange(e.target.value as Duration)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                {Object.values(Duration).map((dur) => (
                  <option key={dur} value={dur}>{dur}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
               <Layers className="w-3 h-3" /> Quantity
            </label>
            <div className="relative">
              <select
                value={state.variantCount}
                onChange={(e) => onVariantCountChange(Number(e.target.value))}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                <option value={1}>1 Option</option>
                <option value={2}>2 Options</option>
                <option value={3}>3 Options</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={state.isGenerating || state.productImages.length === 0 || !state.productDescription}
          className={`
            w-full py-3 px-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-300
            ${state.isGenerating || state.productImages.length === 0 || !state.productDescription
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:shadow-purple-500/25 active:scale-[0.98]'}
          `}
        >
          {state.isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Assets...
            </span>
          ) : (
            "Generate Strategy"
          )}
        </button>
      </div>
    </div>
  );
};
