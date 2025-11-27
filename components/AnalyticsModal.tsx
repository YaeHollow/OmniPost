import React, { useMemo } from 'react';
import { GenerationHistoryItem, Platform, Tone } from '../types';
import { X, BarChart3, TrendingUp, Share2 } from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: GenerationHistoryItem[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, history }) => {
  const stats = useMemo(() => {
    const toneCounts: Record<string, number> = {};
    const platformCounts: Record<string, number> = {};
    let totalPosts = 0;

    history.forEach(item => {
      const postCount = item.platforms.length;
      totalPosts += postCount;

      // Count tones (weighted by number of posts generated in that batch)
      toneCounts[item.tone] = (toneCounts[item.tone] || 0) + postCount;

      // Count platforms
      item.platforms.forEach(p => {
        platformCounts[p] = (platformCounts[p] || 0) + 1;
      });
    });

    // Sort for ranking
    const sortedTones = Object.entries(toneCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tone, count]) => ({ tone: tone as Tone, count }));

    const sortedPlatforms = Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([platform, count]) => ({ platform: platform as Platform, count }));

    return {
      totalPosts,
      sortedTones,
      sortedPlatforms,
      maxToneCount: sortedTones[0]?.count || 1,
      maxPlatformCount: sortedPlatforms[0]?.count || 1
    };
  }, [history]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-xl font-bold">Performance Analytics</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={32} className="text-slate-400" />
              </div>
              <p className="font-medium">No data available yet</p>
              <p className="text-sm mt-1">Generate some posts to see your analytics!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Big Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                  <p className="text-indigo-600 text-sm font-semibold mb-1">Total Posts Generated</p>
                  <p className="text-3xl font-bold text-indigo-900">{stats.totalPosts}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                  <p className="text-emerald-600 text-sm font-semibold mb-1">Top Tone</p>
                  <p className="text-xl font-bold text-emerald-900 truncate">
                    {stats.sortedTones[0]?.tone || '-'}
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                  <p className="text-amber-600 text-sm font-semibold mb-1">Top Platform</p>
                  <p className="text-xl font-bold text-amber-900 truncate">
                    {stats.sortedPlatforms[0]?.platform || '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tone Distribution */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
                    <TrendingUp size={18} className="text-slate-400" />
                    <h3>Tone Usage</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.sortedTones.map(({ tone, count }) => (
                      <div key={tone} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700">{tone}</span>
                          <span className="text-slate-500">{count} posts</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${(count / stats.maxToneCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform Popularity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
                    <Share2 size={18} className="text-slate-400" />
                    <h3>Platform Popularity</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.sortedPlatforms.map(({ platform, count }) => (
                      <div key={platform} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700">{platform}</span>
                          <span className="text-slate-500">{count} posts</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-pink-500 rounded-full transition-all duration-500"
                            style={{ width: `${(count / stats.maxPlatformCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};