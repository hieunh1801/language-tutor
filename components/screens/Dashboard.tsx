import React, { useState, useMemo } from 'react';
import { GraduationCap, Plus, BrainCircuit, Zap, RefreshCcw, ChevronRight, Library, FolderOpen, Sparkles, Trash2, History, BookOpen, BarChart3, LayoutGrid, Globe, Database, MessageCircle, BookOpenText, Search, X, Filter, Key, Clock, ChevronDown, Moon, Sun } from 'lucide-react';
import { Lesson, LessonProgress, LessonLevel } from '../../types';
import { NativeLanguage, TargetLanguage, t, TARGET_LANGUAGES } from '../../data/languages';

interface DashboardProps {
  suggestionList: Lesson[];
  libraryList: Lesson[];
  lessonProgress: Record<string, LessonProgress>;
  errorMsg: string | null;
  historyCount: number;
  vocabCount: number;
  nativeLang: NativeLanguage;
  targetLang: TargetLanguage;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onStartLesson: (lesson: Lesson) => void;
  onCreateClick: () => void;
  onDeleteLesson: (e: React.MouseEvent, id: string) => void;
  onOpenHistory: () => void;
  onOpenVocab: () => void;
  onOpenStats: () => void;
  onOpenBackup: () => void;
  onSetTargetLang: (lang: TargetLanguage) => void;
  onConfigureKey: () => void;
}

type FilterType = 'ALL' | 'Conversation' | 'Reading' | 'Beginner' | 'Intermediate' | 'Advanced';

export const Dashboard: React.FC<DashboardProps> = ({
  suggestionList,
  libraryList,
  lessonProgress,
  errorMsg,
  historyCount,
  vocabCount,
  nativeLang,
  targetLang,
  theme,
  onToggleTheme,
  onStartLesson,
  onCreateClick,
  onDeleteLesson,
  onOpenHistory,
  onOpenVocab,
  onOpenStats,
  onOpenBackup,
  onSetTargetLang,
  onConfigureKey
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const renderSRSLevel = (level: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((bar) => (
          <div
            key={bar}
            className={`w-1.5 h-3 rounded-sm ${level >= bar ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-600'}`}
          />
        ))}
      </div>
    );
  };

  const getReviewStatus = (lessonId: string) => {
    const prog = lessonProgress[lessonId];
    if (!prog) return { status: 'new', text: t(nativeLang, 'new'), color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200', icon: Sparkles };

    const now = Date.now();
    if (now >= prog.nextReview) return { status: 'due', text: t(nativeLang, 'due'), color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 animate-pulse', icon: Zap };

    const daysLeft = Math.ceil((prog.nextReview - now) / (1000 * 60 * 60 * 24));
    return { status: 'wait', text: t(nativeLang, 'wait', { days: daysLeft }), color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200', icon: Clock };
  };

  const getLevelInfo = (level: string) => {
    switch(level) {
      case 'Beginner': case 'Level 1': case 'Level 2':
        return { label: t(nativeLang, 'beginner'), style: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', group: 'Beginner' };
      case 'Intermediate': case 'Level 3': case 'Level 4':
        return { label: t(nativeLang, 'intermediate'), style: 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800', group: 'Intermediate' };
      case 'Advanced': case 'Level 5': case 'Level 6':
        return { label: t(nativeLang, 'advanced'), style: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800', group: 'Advanced' };
      default: 
        return { label: level, style: 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600', group: 'Beginner' };
    }
  };

  // --- Filter Logic ---
  const filteredLibrary = useMemo(() => {
    return libraryList.filter(lesson => {
      // 1. Search Term
      const matchSearch = 
        searchTerm === '' || 
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.topic.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // 2. Filter Chips
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'Conversation') return lesson.type === 'Conversation';
      if (activeFilter === 'Reading') return lesson.type === 'Reading';
      
      const lvlInfo = getLevelInfo(lesson.level);
      if (activeFilter === 'Beginner') return lvlInfo.group === 'Beginner';
      if (activeFilter === 'Intermediate') return lvlInfo.group === 'Intermediate';
      if (activeFilter === 'Advanced') return lvlInfo.group === 'Advanced';

      return true;
    });
  }, [libraryList, searchTerm, activeFilter]);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'Conversation', label: 'Hội thoại' },
    { id: 'Reading', label: 'Bài đọc' },
    { id: 'Beginner', label: 'Sơ cấp' },
    { id: 'Intermediate', label: 'Trung cấp' },
    { id: 'Advanced', label: 'Cao cấp' },
  ];

  const currentTargetLangConfig = TARGET_LANGUAGES.find(l => l.code === targetLang);

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Compact Header */}
      <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shrink-0 flex items-center justify-between z-10 shadow-sm sticky top-0 transition-colors">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
               <GraduationCap size={20} />
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight hidden md:block">
              {t(nativeLang, 'app_name')}
            </h1>
        </div>

        {/* Right: Actions Toolbar */}
        <div className="flex items-center gap-2">
            
            {/* Theme Toggle */}
            <button 
                onClick={onToggleTheme}
                className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-yellow-400 transition-colors"
            >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Compact Language Selector (Pill Style) */}
            <div className="relative bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer group">
                 <span className="text-base">{currentTargetLangConfig?.flag}</span>
                 <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{targetLang}</span>
                 <ChevronDown size={12} className="text-slate-400 dark:text-slate-300 group-hover:text-slate-600" />
                 
                 <select 
                    value={targetLang} 
                    onChange={(e) => onSetTargetLang(e.target.value as TargetLanguage)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                >
                    {TARGET_LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                </select>
            </div>

            {/* Key Config Button */}
            <button
                onClick={onConfigureKey}
                className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-600 transition-colors"
                title="API Key"
            >
                <Key size={18} />
            </button>

            {/* Create Button (Icon Only) */}
            <button
              onClick={onCreateClick}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center ml-1"
              title={t(nativeLang, 'create_lesson')}
            >
              <Plus size={20} />
            </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mx-4 mt-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-2.5 rounded-lg text-xs border border-red-100 dark:border-red-800 flex justify-between items-center">
          <span className="font-medium">{errorMsg}</span>
          <button onClick={onConfigureKey} className="font-bold underline ml-2 shrink-0">Cấu hình</button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Feature Grid (Utilities) */}
        <div>
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              {/* Stats Card */}
              <button 
                onClick={onOpenStats}
                className="flex flex-col items-center justify-center py-3 px-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group h-24"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <BarChart3 size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 text-center leading-tight">{t(nativeLang, 'stats')}</span>
              </button>

              {/* History Card */}
              <button 
                onClick={onOpenHistory}
                className="flex flex-col items-center justify-center py-3 px-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-all group h-24"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <History size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-orange-700 dark:group-hover:text-orange-300 text-center leading-tight">{t(nativeLang, 'history')}</span>
              </button>

              {/* Vocab Card */}
              <button 
                onClick={onOpenVocab}
                className="flex flex-col items-center justify-center py-3 px-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all group h-24"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <BookOpen size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 text-center leading-tight">{t(nativeLang, 'vocab')}</span>
              </button>

              {/* Backup Card */}
              <button 
                onClick={onOpenBackup}
                className="flex flex-col items-center justify-center py-3 px-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all group h-24"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Database size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white text-center leading-tight">{t(nativeLang, 'backup')}</span>
              </button>
            </div>
        </div>

        {/* Suggestions Section (SRS) */}
        {suggestionList.length > 0 && !searchTerm && activeFilter === 'ALL' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-200 px-1">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <BrainCircuit size={16} className="text-indigo-600 dark:text-indigo-400" /> {t(nativeLang, 'review_now')}
              </div>
              <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full animate-pulse">
                {suggestionList.length} bài
              </span>
            </div>
            <div className="grid gap-3">
              {suggestionList.map(lesson => {
                const progress = lessonProgress[lesson.id];
                const isReading = lesson.type === 'Reading';
                const TypeIcon = isReading ? BookOpenText : MessageCircle;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => onStartLesson(lesson)}
                    className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-all text-left group relative overflow-hidden border-y border-r border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isReading ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'}`}>
                              <TypeIcon size={16} />
                          </div>
                          <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 text-sm">{lesson.title}</h3>
                       </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1">
                          <Zap size={10} fill="currentColor" /> {t(nativeLang, 'due')}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-3">
                      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1" title={t(nativeLang, 'reviews')}><RefreshCcw size={12} /> {progress.reviewCount}</span>
                        <div className="flex flex-col gap-0.5">
                          {renderSRSLevel(progress.srsLevel)}
                        </div>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 p-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Library Section */}
        <div className="space-y-4 pb-10">
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">
                <Library size={14} /> {t(nativeLang, 'library')}
                {filteredLibrary.length !== libraryList.length && (
                  <span className="text-[10px] font-normal text-slate-300">
                    ({filteredLibrary.length}/{libraryList.length})
                  </span>
                )}
              </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="space-y-3 sticky top-0 z-20 bg-slate-50 dark:bg-slate-900 pt-2 pb-4 -mx-1 px-1 transition-colors">
             {/* Search Input */}
             <div className="relative z-20">
                <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3.5 text-slate-300 hover:text-slate-500"
                  >
                    <X size={16} />
                  </button>
                )}
             </div>

             {/* Filter Chips */}
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide z-10">
                {filters.map(f => (
                   <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        activeFilter === f.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                   >
                      {f.label}
                   </button>
                ))}
             </div>
          </div>

          {libraryList.length === 0 && suggestionList.length === 0 && (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">
              <FolderOpen size={40} className="opacity-20 mb-3" />
              <p className="text-sm">{t(nativeLang, 'library_empty')}</p>
              <button onClick={onCreateClick} className="text-indigo-600 dark:text-indigo-400 font-bold mt-2 hover:underline text-sm">{t(nativeLang, 'create_first')}</button>
            </div>
          )}

          {libraryList.length > 0 && filteredLibrary.length === 0 ? (
             <div className="text-center py-8 text-slate-400">
                <Filter size={32} className="opacity-20 mx-auto mb-2" />
                <p className="text-sm">Không tìm thấy kết quả.</p>
                <button onClick={() => {setSearchTerm(''); setActiveFilter('ALL')}} className="text-indigo-500 text-xs font-bold mt-2 hover:underline">Xóa bộ lọc</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 relative z-0">
              {filteredLibrary.map(lesson => {
                const status = getReviewStatus(lesson.id);
                const progress = lessonProgress[lesson.id];
                const StatusIcon = status.icon;
                const isReading = lesson.type === 'Reading';
                const TypeIcon = isReading ? BookOpenText : MessageCircle;
                
                const levelInfo = getLevelInfo(lesson.level);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => onStartLesson(lesson)}
                    className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all text-left group shadow-sm relative"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isReading ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'}`}>
                            <TypeIcon size={16} />
                          </div>
                          <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 text-sm truncate pr-2">{lesson.title}</h3>
                      </div>
                      {progress ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0 ${status.color}`}>
                          <StatusIcon size={10} /> {status.text}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center gap-1 shrink-0">
                          <Sparkles size={10} /> {t(nativeLang, 'new')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-3 pl-10">{lesson.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-700/50 pl-10">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${levelInfo.style}`}>
                          {levelInfo.label}
                        </span>
                        {progress && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <RefreshCcw size={10} /> {progress.reviewCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};