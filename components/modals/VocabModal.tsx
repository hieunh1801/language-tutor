
import React, { useState, useMemo } from 'react';
import { Library, X, BookOpen, Search, Volume2, Calendar, TrendingUp } from 'lucide-react';
import { VocabularyItem } from '../../types';
import { TARGET_LANGUAGES } from '../../data/languages';

interface VocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  vocabList: VocabularyItem[];
}

export const VocabModal: React.FC<VocabModalProps> = ({ isOpen, onClose, vocabList }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredList = useMemo(() => {
    return vocabList.filter(item => 
      item.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vocabList, searchTerm]);

  const handlePlayAudio = (text: string, langCode: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Find voice config based on langCode
      const targetLangConfig = TARGET_LANGUAGES.find(l => l.code === langCode);
      utterance.lang = targetLangConfig?.voice || 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-white flex flex-col animate-in slide-in-from-right duration-300 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 shadow-sm bg-white shrink-0">
        <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <Library size={20} className="text-indigo-600" /> Từ điển của bạn
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 pb-2 bg-slate-50 border-b border-slate-100 shrink-0">
        <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input 
                type="text" 
                placeholder="Tìm kiếm từ vựng..." 
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Content */}
      {vocabList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
          <BookOpen size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">Bạn chưa có từ vựng nào.</p>
          <p className="text-xs mt-1 opacity-70">Hoàn thành bài học để thêm từ mới.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                  Không tìm thấy từ vựng nào.
              </div>
          ) : (
              <div className="divide-y divide-slate-50">
                {filteredList.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-start gap-4">
                            {/* Rank/Index Badge for top words */}
                            <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                                idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                                #{idx + 1}
                            </div>
                            
                            <div>
                                <div className="text-base font-bold text-slate-800 mb-0.5">{item.text}</div>
                                <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                    <span className="flex items-center gap-1 text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                        <TrendingUp size={10} /> {item.count} lần
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={10} /> {new Date(item.lastSeen).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => handlePlayAudio(item.text, item.language)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all active:scale-95"
                            title="Nghe phát âm"
                        >
                            <Volume2 size={18} />
                        </button>
                    </div>
                ))}
              </div>
          )}
        </div>
      )}
      
      {/* Footer Stats */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs font-medium text-slate-500">
          Tổng cộng: <span className="text-indigo-600 font-bold">{vocabList.length}</span> từ vựng
      </div>
    </div>
  );
};
