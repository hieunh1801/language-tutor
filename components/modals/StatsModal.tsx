
import React, { useMemo } from 'react';
import { BarChart3, X, Flame, Trophy, Target, TrendingUp, Book, BrainCircuit } from 'lucide-react';
import { LessonProgress, SavedSession, VocabularyItem, Lesson } from '../../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  vocabList: VocabularyItem[];
  progress: Record<string, LessonProgress>;
  allLessons: Lesson[];
}

export const StatsModal: React.FC<StatsModalProps> = ({ 
  isOpen, onClose, sessions, vocabList, progress, allLessons 
}) => {
  
  // Calculate Stats
  const stats = useMemo(() => {
    // 1. Calculate Streak (Consecutive days ending today or yesterday)
    const uniqueDates = new Set(
      sessions.map(s => new Date(s.timestamp).setHours(0, 0, 0, 0))
    );
    // Add 'lastStudied' from progress as well to be accurate
    Object.values(progress).forEach(p => {
        uniqueDates.add(new Date(p.lastStudied).setHours(0,0,0,0));
    });

    const sortedDates = Array.from(uniqueDates).sort((a, b) => b - a);
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = today - 86400000;

    let currentStreak = 0;
    if (sortedDates.length > 0) {
      // If most recent is today or yesterday, start counting
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
          // Check if next date is consecutive (difference is approx 1 day)
          const diff = sortedDates[i] - sortedDates[i+1];
          if (diff === 86400000) { // exactly 1 day
             currentStreak++;
          } else {
             break;
          }
        }
      }
    }

    // 2. Level Breakdown
    const completedLessonIds = Object.keys(progress);
    const levelCounts = {
      Beginner: 0,
      Intermediate: 0,
      Advanced: 0
    };
    
    completedLessonIds.forEach(id => {
      const lesson = allLessons.find(l => l.id === id);
      if (lesson) {
        levelCounts[lesson.level]++;
      }
    });

    // 3. SRS Distribution (Memory Health)
    const srsDistribution = [0, 0, 0, 0, 0, 0]; // Levels 0-5
    Object.values(progress).forEach(p => {
      const level = Math.min(p.srsLevel, 5);
      srsDistribution[level]++;
    });

    return {
      streak: currentStreak,
      totalSessions: sessions.length,
      totalVocab: vocabList.length,
      levelCounts,
      srsDistribution,
      totalLearnedLessons: completedLessonIds.length
    };
  }, [sessions, vocabList, progress, allLessons]);

  if (!isOpen) return null;

  const maxSrs = Math.max(...stats.srsDistribution, 1);

  return (
    <div className="absolute inset-0 z-50 bg-slate-50/90 backdrop-blur-sm flex flex-col animate-in fade-in duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-100 shadow-sm flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="text-indigo-600" /> Thống kê học tập
        </h2>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Hero Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-200 relative overflow-hidden">
            <Flame className="absolute -bottom-2 -right-2 text-white/20 w-24 h-24" />
            <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1">Chuỗi học</p>
            <div className="text-3xl font-extrabold">{stats.streak} <span className="text-base font-medium">ngày</span></div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
            <Trophy className="absolute -bottom-2 -right-2 text-white/20 w-24 h-24" />
             <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1">Đã hoàn thành</p>
            <div className="text-3xl font-extrabold">{stats.totalLearnedLessons} <span className="text-base font-medium">bài</span></div>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-green-100 text-green-600 rounded-xl">
                    <Book size={20} />
                </div>
                <div>
                    <div className="text-xl font-bold text-slate-800">{stats.totalVocab}</div>
                    <div className="text-xs text-slate-400">Từ vựng</div>
                </div>
            </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                    <TrendingUp size={20} />
                </div>
                <div>
                    <div className="text-xl font-bold text-slate-800">{stats.totalSessions}</div>
                    <div className="text-xs text-slate-400">Lượt luyện tập</div>
                </div>
            </div>
        </div>

        {/* Roadmap / Level Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm uppercase tracking-wider">
                <Target size={16} className="text-indigo-500" /> Phân bổ trình độ
            </div>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-600">Sơ cấp (Beginner)</span>
                        <span className="font-bold text-slate-800">{stats.levelCounts.Beginner} bài</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${(stats.levelCounts.Beginner / Math.max(stats.totalLearnedLessons, 1)) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-600">Trung cấp (Intermediate)</span>
                        <span className="font-bold text-slate-800">{stats.levelCounts.Intermediate} bài</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className="bg-yellow-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${(stats.levelCounts.Intermediate / Math.max(stats.totalLearnedLessons, 1)) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-600">Cao cấp (Advanced)</span>
                        <span className="font-bold text-slate-800">{stats.levelCounts.Advanced} bài</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${(stats.levelCounts.Advanced / Math.max(stats.totalLearnedLessons, 1)) * 100}%` }}></div>
                    </div>
                </div>
            </div>
        </div>

        {/* SRS Memory Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold text-sm uppercase tracking-wider">
                <BrainCircuit size={16} className="text-pink-500" /> Biểu đồ trí nhớ (SRS)
            </div>
            
            <div className="px-2">
                {/* Chart Area - Fixed Height */}
                <div className="flex items-end justify-between h-32 border-b border-slate-100 pb-px">
                    {stats.srsDistribution.map((count, idx) => {
                        const heightPercent = (count / maxSrs) * 100;
                        return (
                            <div key={idx} className="flex flex-col items-center justify-end h-full w-1/6 group relative">
                                {/* Tooltip */}
                                <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    {count} bài
                                </div>

                                {/* The Bar */}
                                <div className="w-full flex justify-center items-end h-full">
                                     <div 
                                        className={`w-3 md:w-5 rounded-t-md transition-all duration-1000 ${
                                            idx === 0 ? 'bg-slate-300' :
                                            idx < 3 ? 'bg-indigo-300' :
                                            'bg-indigo-600'
                                        }`}
                                        style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Labels Area */}
                <div className="flex justify-between mt-2">
                    {stats.srsDistribution.map((_, idx) => (
                         <span key={idx} className="w-1/6 text-center text-[10px] font-bold text-slate-400">
                            Lv.{idx}
                         </span>
                    ))}
                </div>
            </div>

             <div className="text-center text-[10px] text-slate-400 mt-4 italic">
                *Lv.0: Mới học &mdash; Lv.5: Đã thuộc lòng
            </div>
        </div>
      </div>
    </div>
  );
};
