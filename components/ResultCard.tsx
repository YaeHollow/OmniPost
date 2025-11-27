import React, { useState } from 'react';
import { GenerationResult, Platform, RefinementAction } from '../types';
import { PLATFORM_CONFIG, REFINEMENT_ACTIONS } from '../constants';
import { Copy, Check, Download, Calendar, X, Linkedin, Twitter, Instagram, AtSign, Wand2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResultCardProps {
  result: GenerationResult;
  onRegenerate?: () => void;
  onSchedule: (date: Date) => void;
  onRefine: (action: RefinementAction) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onSchedule, onRefine }) => {
  const config = PLATFORM_CONFIG[result.platform];
  const [copied, setCopied] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showRefineMenu, setShowRefineMenu] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (result.imageUrl) {
      const link = document.createElement('a');
      link.href = result.imageUrl;
      link.download = `${result.platform.toLowerCase()}-image.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleScheduleConfirm = () => {
    if (scheduleDate) {
        onSchedule(new Date(scheduleDate));
        setShowSchedule(false);
        setScheduleDate('');
    }
  }

  // Platform specific branding
  const getBorderColor = () => {
    switch(result.platform) {
      case Platform.LINKEDIN: return 'border-blue-200 hover:border-blue-300';
      case Platform.TWITTER: return 'border-sky-200 hover:border-sky-300';
      case Platform.INSTAGRAM: return 'border-pink-200 hover:border-pink-300';
      case Platform.THREADS: return 'border-neutral-200 hover:border-neutral-300';
    }
  };

  const getHeaderBg = () => {
    switch(result.platform) {
      case Platform.LINKEDIN: return 'bg-blue-50 text-blue-900';
      case Platform.TWITTER: return 'bg-sky-50 text-sky-900';
      case Platform.INSTAGRAM: return 'bg-pink-50 text-pink-900';
      case Platform.THREADS: return 'bg-neutral-100 text-neutral-900';
    }
  };

  const getIcon = () => {
    switch(result.platform) {
        case Platform.LINKEDIN: return <Linkedin size={20} />;
        case Platform.TWITTER: return <Twitter size={20} />;
        case Platform.INSTAGRAM: return <Instagram size={20} />;
        case Platform.THREADS: return <AtSign size={20} />;
        default: return null;
    }
  };

  const isLoadingText = result.status === 'loading-text' || result.status === 'idle' || result.status === 'refining';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all duration-300 flex flex-col overflow-hidden h-full ${getBorderColor()}`}>
      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between border-b border-slate-100 ${getHeaderBg()}`}>
        <div className="flex items-center gap-3">
          {getIcon()}
          <h3 className="font-bold text-lg">{result.platform}</h3>
        </div>
        <div className="text-xs font-medium opacity-70 bg-white/50 px-2 py-1 rounded-md">
          {config.aspectRatio}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6 relative">
        {/* Text Content */}
        <div className="flex-1 min-h-[120px]">
          {isLoadingText ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4 flex items-center gap-2">
                 {result.status === 'refining' && <Loader2 className="animate-spin w-3 h-3 text-slate-400"/>}
                 {result.status === 'refining' && <span className="text-xs text-slate-400">Refining...</span>}
              </div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-slate-700">
              <ReactMarkdown>{result.text}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Scheduling Overlay */}
        {showSchedule && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-2 animate-in fade-in slide-in-from-bottom-2">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Pick a date & time</label>
                <div className="flex gap-2">
                    <input 
                        type="datetime-local" 
                        className="flex-1 text-sm p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                    />
                    <button 
                        onClick={handleScheduleConfirm}
                        disabled={!scheduleDate}
                        className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={16} />
                    </button>
                    <button 
                        onClick={() => setShowSchedule(false)}
                        className="bg-white text-slate-600 border border-slate-200 p-2 rounded-lg hover:bg-slate-50"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        )}

        {/* Action Bar */}
        {(result.status === 'completed' || result.status === 'refining') && !showSchedule && (
            <div className="flex gap-2 justify-end relative">
                {/* Refine Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowRefineMenu(!showRefineMenu)}
                    disabled={result.status === 'refining'}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {result.status === 'refining' ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14} />}
                    Refine
                  </button>
                  
                  {showRefineMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setShowRefineMenu(false)}
                      />
                      <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden animate-in fade-in zoom-in-95">
                        {REFINEMENT_ACTIONS.map((item) => (
                          <button
                            key={item.action}
                            onClick={() => {
                              onRefine(item.action);
                              setShowRefineMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                          >
                             {item.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button 
                    onClick={() => setShowSchedule(true)}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                    <Calendar size={14} />
                    Schedule
                </button>
                <button 
                    onClick={handleCopy}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
        )}

        {/* Image Content - Only shown if image was requested (imageEnabled) */}
        {result.imageEnabled && (
            <div className="mt-auto rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative group min-h-[200px] flex items-center justify-center">
                {result.status === 'loading-image' || result.status === 'loading-text' || result.status === 'idle' || result.status === 'refining' && !result.imageUrl ? (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
                        {result.status !== 'idle' && <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                        <span className="text-sm font-medium">
                            {result.status === 'idle' ? 'Ready to generate' : 
                            result.status === 'loading-text' ? 'Drafting content...' :
                            result.status === 'loading-image' ? 'Rendering visuals...' :
                            'Refining content...'}
                        </span>
                    </div>
                ) : result.imageUrl ? (
                    <>
                        <img 
                            src={result.imageUrl} 
                            alt={`Generated for ${result.platform}`}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button 
                                onClick={handleDownload}
                                className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-slate-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                            >
                                <Download size={16} />
                                Download
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-red-500 text-sm p-4 text-center">
                        Failed to generate image.
                    </div>
                )}
            </div>
        )}
      </div>
      
      {result.error && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-100 text-red-600 text-xs">
          Error: {result.error}
        </div>
      )}
    </div>
  );
};