import React, { useEffect, useState } from 'react';
import { ModelTier } from '../types';
import { MODEL_OPTIONS } from '../constants';
import { ensureApiKey, checkApiKeyConnection } from '../services/geminiService';
import { X, Key, Zap, Brain, Crown, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: ModelTier;
  onModelChange: (model: ModelTier) => void;
  onConnectionStatusChange: (isConnected: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentModel, 
  onModelChange,
  onConnectionStatusChange 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      const status = await checkApiKeyConnection();
      setIsConnected(status);
      onConnectionStatusChange(status);
    };
    if (isOpen) {
      check();
    }
  }, [isOpen, onConnectionStatusChange]);

  const handleConnect = async () => {
    setIsLoading(true);
    const success = await ensureApiKey();
    setIsConnected(success);
    onConnectionStatusChange(success);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* API Connection Section */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">API Connection</h3>
            <div className={`rounded-xl border p-4 transition-colors ${isConnected ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-full ${isConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                  {isConnected ? <ShieldCheck size={20} /> : <Key size={20} />}
                </div>
                <div>
                  <p className={`font-semibold ${isConnected ? 'text-emerald-900' : 'text-slate-900'}`}>
                    {isConnected ? 'Connected to Google AI' : 'Not Connected'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isConnected ? 'Ready to generate content.' : 'Connect to start using the app.'}
                  </p>
                </div>
              </div>

              {!isConnected && (
                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Connect API Key'
                  )}
                </button>
              )}
              
              {isConnected && (
                 <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 size={14} />
                    <span>Secure connection active</span>
                 </div>
              )}
            </div>
          </section>

          {/* Model Selection Section */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">AI Model Tier</h3>
            <div className="space-y-3">
              {MODEL_OPTIONS.map((option) => {
                const isActive = currentModel === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => onModelChange(option.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border text-left transition-all ${
                      isActive 
                        ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {option.id === 'flash-2.5' && <Zap size={20} />}
                      {option.id === 'pro-2.5' && <Brain size={20} />}
                      {option.id === 'pro-3.0' && <Crown size={20} />}
                    </div>
                    <div>
                      <p className={`font-medium ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {option.id === 'flash-2.5' ? 'Fastest generation, free tier supported.' : 
                         option.id === 'pro-2.5' ? 'Balanced reasoning and speed.' : 
                         'Highest quality reasoning and images.'}
                      </p>
                    </div>
                    {isActive && <CheckCircle2 size={18} className="text-indigo-600 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </section>

        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
             <button 
                onClick={onClose}
                className="text-slate-500 hover:text-slate-800 text-sm font-medium"
             >
                Close Settings
             </button>
        </div>

      </div>
    </div>
  );
};