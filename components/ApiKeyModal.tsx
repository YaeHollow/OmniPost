import React, { useEffect, useState } from 'react';
import { ensureApiKey } from '../services/geminiService';
import { Key } from 'lucide-react';

interface ApiKeyModalProps {
  onKeySelected: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySelected }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const checkKey = async () => {
    setIsLoading(true);
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (hasKey) {
          setIsVisible(false);
          onKeySelected();
        }
      } else if (process.env.API_KEY) {
         // Fallback for environments where key is injected directly
         setIsVisible(false);
         onKeySelected();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    const success = await ensureApiKey();
    if (success) {
      setIsVisible(false);
      onKeySelected();
    }
    setIsLoading(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-slate-200">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Key size={32} />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Connect Google AI</h2>
            <p className="mt-2 text-slate-600">
              Connect your Google API key to start generating social media content with Gemini.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 text-left w-full">
            <p className="font-semibold mb-1">Free Tier Available</p>
            <p>
              You can use a free API key to access Gemini Flash models for fast text and image generation.
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Connect API Key
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};