import React, { useState, useCallback, useEffect } from 'react';
import { ResultCard } from './components/ResultCard';
import { AnalyticsModal } from './components/AnalyticsModal';
import { SettingsModal } from './components/SettingsModal';
import { GenerationState, Platform, Tone, ScheduledPost, GenerationHistoryItem, Language, RefinementAction, ModelTier } from './types';
import { generatePlatformImage, generatePlatformText, refineContent, checkApiKeyConnection } from './services/geminiService';
import { Settings2, Layout, Send, Calendar, Trash2, Clock, Linkedin, Twitter, Instagram, AtSign, BarChart3, Globe, Layers, KeyRound, Mic2, Image as ImageIcon, Settings, AlertTriangle } from 'lucide-react';
import { LANGUAGES, MODEL_OPTIONS } from './constants';

const INITIAL_STATE: GenerationState = {
  [Platform.LINKEDIN]: { platform: Platform.LINKEDIN, text: '', imageUrl: null, imageEnabled: true, status: 'idle' },
  [Platform.TWITTER]: { platform: Platform.TWITTER, text: '', imageUrl: null, imageEnabled: true, status: 'idle' },
  [Platform.INSTAGRAM]: { platform: Platform.INSTAGRAM, text: '', imageUrl: null, imageEnabled: true, status: 'idle' },
  [Platform.THREADS]: { platform: Platform.THREADS, text: '', imageUrl: null, imageEnabled: true, status: 'idle' },
};

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<Platform>>(new Set(Object.values(Platform)));
  const [results, setResults] = useState<GenerationState>(INITIAL_STATE);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  
  // Advanced Settings
  const [keywords, setKeywords] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [isThread, setIsThread] = useState(false);
  
  // Model Settings
  const [modelTier, setModelTier] = useState<ModelTier>('flash-2.5');
  const [generateImages, setGenerateImages] = useState(true);

  // Modal States
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isApiKeyConnected, setIsApiKeyConnected] = useState(false);

  const [history, setHistory] = useState<GenerationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('omnipost_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('omnipost_history', JSON.stringify(history));
  }, [history]);

  // Check API Key on mount
  useEffect(() => {
    const initCheck = async () => {
      const connected = await checkApiKeyConnection();
      setIsApiKeyConnected(connected);
      if (!connected) {
        setShowSettings(true);
      }
    };
    initCheck();
  }, []);

  const togglePlatform = (platform: Platform) => {
    setEnabledPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        if (next.size > 1) next.delete(platform); // Prevent disabling all
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    if (!isApiKeyConnected) {
        setShowSettings(true);
        return;
    }

    setIsGlobalLoading(true);
    
    // Explicitly cast to Platform[] to fix inference issues with Array.from on Set
    const platformsToGenerate = Array.from(enabledPlatforms) as Platform[];

    // Record history immediately for the attempt
    const newHistoryItem: GenerationHistoryItem = {
        timestamp: Date.now(),
        tone,
        platforms: platformsToGenerate
    };
    setHistory(prev => [newHistoryItem, ...prev]);

    // Reset states to loading for enabled platforms
    setResults(prev => {
        const next = { ...prev };
        platformsToGenerate.forEach(p => {
            next[p] = { 
                ...next[p], 
                status: 'loading-text', 
                error: undefined,
                imageEnabled: generateImages,
                imageUrl: null // Reset image
            };
        });
        return next;
    });

    // Process enabled platforms
    const promises = platformsToGenerate.map(async (platform) => {
      try {
        // 1. Generate Text
        const text = await generatePlatformText(platform, topic, tone, language, keywords, brandVoice, isThread, modelTier);
        
        setResults(prev => ({
          ...prev,
          [platform]: { 
              ...prev[platform], 
              text, 
              status: generateImages ? 'loading-image' : 'completed' 
          }
        }));

        // 2. Generate Image (if enabled)
        if (generateImages) {
            const imageUrl = await generatePlatformImage(platform, topic, text, tone, modelTier);
            setResults(prev => ({
                ...prev,
                [platform]: { ...prev[platform], imageUrl, status: 'completed' }
            }));
        }

      } catch (error: any) {
        console.error(`Failed processing ${platform}`, error);
        setResults(prev => ({
          ...prev,
          [platform]: { 
            ...prev[platform], 
            status: 'error', 
            error: error.message || 'Generation failed' 
          }
        }));
      }
    });

    await Promise.allSettled(promises);
    setIsGlobalLoading(false);
  }, [topic, tone, language, keywords, brandVoice, isThread, enabledPlatforms, modelTier, generateImages, isApiKeyConnected]);

  const handleRefine = async (platform: Platform, action: RefinementAction) => {
    const currentResult = results[platform];
    if (!currentResult || !currentResult.text) return;

    setResults(prev => ({
        ...prev,
        [platform]: { ...prev[platform], status: 'refining' }
    }));

    try {
        const refinedText = await refineContent(platform, currentResult.text, action, tone, language, modelTier);
        setResults(prev => ({
            ...prev,
            [platform]: { ...prev[platform], text: refinedText, status: 'completed' }
        }));
    } catch (error: any) {
        setResults(prev => ({
            ...prev,
            [platform]: { ...prev[platform], status: 'completed', error: 'Refinement failed' } // Revert to completed so text stays visible
        }));
    }
  };

  const handleSchedulePost = (platform: Platform, date: Date) => {
    const result = results[platform];
    if (!result || result.status !== 'completed') return;
    
    const newPost: ScheduledPost = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        platform,
        text: result.text,
        imageUrl: result.imageUrl,
        scheduledDate: date
    };
    
    setScheduledPosts(prev => [...prev, newPost].sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()));
  };

  const deleteScheduledPost = (id: string) => {
      setScheduledPosts(prev => prev.filter(p => p.id !== id));
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
        case Platform.LINKEDIN: return <Linkedin size={20} />;
        case Platform.TWITTER: return <Twitter size={20} />;
        case Platform.INSTAGRAM: return <Instagram size={20} />;
        case Platform.THREADS: return <AtSign size={20} />;
    }
  };

  const getPlatformColor = (platform: Platform) => {
     switch (platform) {
        case Platform.LINKEDIN: return 'text-blue-700';
        case Platform.TWITTER: return 'text-sky-500';
        case Platform.INSTAGRAM: return 'text-pink-600';
        case Platform.THREADS: return 'text-slate-900';
     }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentModel={modelTier}
        onModelChange={setModelTier}
        onConnectionStatusChange={setIsApiKeyConnected}
      />

      <AnalyticsModal 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)} 
        history={history} 
      />

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 rounded-lg text-white">
              <Layout size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-700">
              OmniPost
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={() => setShowAnalytics(true)}
                className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
             >
                <BarChart3 size={18} />
             </button>

             <div className="h-6 w-px bg-slate-200 mx-1"></div>

             <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg transition-all ${
                    !isApiKeyConnected 
                    ? 'bg-red-50 text-red-600 animate-pulse ring-1 ring-red-200' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
             >
                {!isApiKeyConnected ? <AlertTriangle size={20} /> : <Settings size={20} />}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 transition-all hover:shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Topic Input */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2 h-full">
                <label className="text-sm font-semibold text-slate-700">Content Topic</label>
                <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Launching our new eco-friendly coffee cup line made from recycled bamboo..."
                    className="w-full flex-1 min-h-[160px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              
              {/* Platform Selection */}
              <div>
                 <label className="text-sm font-semibold text-slate-700 mb-2 block">Target Platforms</label>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.values(Platform).map(platform => {
                        const isEnabled = enabledPlatforms.has(platform);
                        return (
                            <button
                                key={platform}
                                onClick={() => togglePlatform(platform)}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                    isEnabled 
                                    ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <div className={`${isEnabled ? 'text-white' : getPlatformColor(platform)}`}>
                                    {getPlatformIcon(platform)}
                                </div>
                                <span className="text-xs font-medium">{platform}</span>
                            </button>
                        );
                    })}
                 </div>
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tone */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                        <Settings2 size={12} /> Tone
                    </label>
                    <select 
                        value={tone}
                        onChange={(e) => setTone(e.target.value as Tone)}
                        className="w-full p-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                        {Object.values(Tone).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Language */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                        <Globe size={12} /> Language
                    </label>
                    <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="w-full p-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                </div>
              </div>

              {/* Advanced Toggles */}
              <div className="flex flex-col gap-3">
                 <div className="grid grid-cols-2 gap-3">
                     <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2">
                            <Layers size={16} className="text-slate-500"/>
                            <span className="text-sm font-medium text-slate-700">Thread Mode</span>
                        </div>
                        <button 
                            onClick={() => setIsThread(!isThread)}
                            className={`w-10 h-6 rounded-full transition-colors relative ${isThread ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isThread ? 'translate-x-4' : ''}`} />
                        </button>
                     </div>

                     <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2">
                            <ImageIcon size={16} className="text-slate-500"/>
                            <span className="text-sm font-medium text-slate-700">Generate Images</span>
                        </div>
                        <button 
                            onClick={() => setGenerateImages(!generateImages)}
                            className={`w-10 h-6 rounded-full transition-colors relative ${generateImages ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${generateImages ? 'translate-x-4' : ''}`} />
                        </button>
                     </div>
                 </div>
                 
                 <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <KeyRound size={14} className="absolute left-3 top-3 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Keywords (optional)"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            className="w-full pl-9 p-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div className="flex-1 relative">
                        <Mic2 size={14} className="absolute left-3 top-3 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Brand Voice (optional)"
                            value={brandVoice}
                            onChange={(e) => setBrandVoice(e.target.value)}
                            className="w-full pl-9 p-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                 </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || isGlobalLoading || !isApiKeyConnected}
                className={`w-full h-12 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] mt-2 ${
                    isGlobalLoading ? 'bg-slate-400 cursor-not-allowed' :
                    !isApiKeyConnected ? 'bg-slate-300 cursor-not-allowed' :
                    modelTier === 'pro-3.0' ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200' : 
                    modelTier === 'pro-2.5' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200' :
                    'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {isGlobalLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !isApiKeyConnected ? (
                  <>Connect API Key to Generate</>
                ) : (
                <>
                    <Send size={18} /> 
                    {`Generate with ${MODEL_OPTIONS.find(o => o.id === modelTier)?.shortLabel}`}
                </>
                )}
              </button>

            </div>

          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(Platform).filter(p => enabledPlatforms.has(p)).map((platform) => (
            <ResultCard 
              key={platform} 
              result={results[platform]} 
              onSchedule={(date) => handleSchedulePost(platform, date)}
              onRefine={(action) => handleRefine(platform, action)}
            />
          ))}
        </div>

        {/* Scheduled Content Section */}
        {scheduledPosts.length > 0 && (
            <div className="mt-16 border-t border-slate-200 pt-10 pb-20">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <Calendar size={20} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Upcoming Schedule</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {scheduledPosts.map(post => (
                        <div key={post.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md transition-shadow group">
                            {/* Platform Icon */}
                            <div className={`p-3 rounded-lg shrink-0 ${
                                post.platform === Platform.LINKEDIN ? 'bg-blue-100 text-blue-700' :
                                post.platform === Platform.TWITTER ? 'bg-sky-100 text-sky-600' :
                                post.platform === Platform.INSTAGRAM ? 'bg-pink-100 text-pink-600' :
                                'bg-neutral-100 text-neutral-900'
                            }`}>
                                {getPlatformIcon(post.platform)}
                            </div>
                            
                            {/* Date */}
                            <div className="min-w-[140px] flex items-center gap-2 text-slate-500 text-sm font-medium">
                                <Clock size={14} />
                                {post.scheduledDate.toLocaleString(undefined, { 
                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                                })}
                            </div>

                            {/* Content Preview */}
                            <div className="flex-1 min-w-0 w-full">
                                <p className="text-slate-700 text-sm line-clamp-2 font-medium">{post.text}</p>
                            </div>

                            {/* Image Thumbnail */}
                            {post.imageUrl && (
                                <img 
                                    src={post.imageUrl} 
                                    alt="Thumbnail" 
                                    className="w-16 h-16 rounded-lg object-cover border border-slate-100 shrink-0"
                                />
                            )}

                            {/* Delete Action */}
                            <button 
                                onClick={() => deleteScheduledPost(post.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto sm:ml-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                aria-label="Delete scheduled post"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;