import React, { useState, useEffect, useRef } from 'react';
import { X, PlayCircle, PauseCircle, Eye, EyeOff, Volume2, BookOpenText } from 'lucide-react';
import { Lesson } from '../../types';
import { NativeLanguage, t, TARGET_LANGUAGES } from '../../data/languages';

interface ReadModeProps {
  lesson: Lesson;
  onExit: () => void;
  nativeLang: NativeLanguage;
}

export const ReadMode: React.FC<ReadModeProps> = ({ lesson, onExit, nativeLang }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false); // Track playing state for callbacks

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const getVoice = (langCode: string) => {
      const langConfig = TARGET_LANGUAGES.find(l => l.code === langCode);
      const voiceCode = langConfig?.voice || 'en-US';
      const voices = window.speechSynthesis.getVoices();
      
      // Priority Logic
      const priorityKeywords = ['Google', 'Premium', 'Enhanced', 'Natural', 'Microsoft'];
      const matchingVoices = voices.filter(v => v.lang.startsWith(voiceCode.split('-')[0]));
      
      return matchingVoices.find(v => priorityKeywords.some(k => v.name.includes(k))) || matchingVoices[0];
  };

  const playAudio = (text: string, index: number, autoContinue: boolean = false) => {
    window.speechSynthesis.cancel();
    setActiveIndex(index);
    
    const utterance = new SpeechSynthesisUtterance(text);
    const targetVoice = getVoice(lesson.language);
    if (targetVoice) utterance.voice = targetVoice;
    
    utterance.lang = TARGET_LANGUAGES.find(l => l.code === lesson.language)?.voice || 'en-US';
    utterance.rate = 0.85; // Slower for reading mode

    utterance.onend = () => {
      if (autoContinue && isPlayingRef.current && index < lesson.turns.length - 1) {
        // Small delay between sentences
        setTimeout(() => {
            if (isPlayingRef.current) playAudio(lesson.turns[index + 1].targetAnswer, index + 1, true);
        }, 700);
      } else {
        if (!autoContinue) setActiveIndex(null); // Only clear if manual play or end of list
        if (index === lesson.turns.length - 1) {
             setIsPlaying(false);
             isPlayingRef.current = false;
             setActiveIndex(null);
        }
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleAutoPlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      isPlayingRef.current = false;
      setActiveIndex(null);
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      // Start from beginning or current active
      const startIndex = activeIndex !== null ? activeIndex : 0;
      playAudio(lesson.turns[startIndex].targetAnswer, startIndex, true);
    }
  };

  const handleManualPlay = (index: number) => {
      // Stop auto play if active
      setIsPlaying(false); 
      isPlayingRef.current = false;
      playAudio(lesson.turns[index].targetAnswer, index, false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
            <button onClick={onExit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X size={24} className="text-slate-500 dark:text-slate-400" />
            </button>
            <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm md:text-base line-clamp-1">{lesson.title}</h2>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <BookOpenText size={12} /> {t(nativeLang, 'mode_read')}
                </div>
            </div>
        </div>
        
        <div className="flex gap-2">
             <button 
                onClick={() => setShowTranslation(!showTranslation)}
                className={`p-2 rounded-full border ${showTranslation ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'}`}
                title={showTranslation ? t(nativeLang, 'hide_trans') : t(nativeLang, 'show_trans')}
             >
                {showTranslation ? <Eye size={20} /> : <EyeOff size={20} />}
             </button>
        </div>
      </div>

      {/* Content - Flex 1 ensures it takes available space, pushing footer down but not behind */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/50">
          {lesson.type === 'Conversation' && (
              <div className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                  -- Hội thoại --
              </div>
          )}
          
          {lesson.turns.map((turn, idx) => (
              <div 
                key={idx} 
                className={`relative group transition-all duration-300 rounded-xl p-3 border ${
                    activeIndex === idx 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-100 dark:ring-indigo-800 border-indigo-200 dark:border-indigo-700 scale-[1.02] shadow-sm' 
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-slate-600'
                }`}
              >
                 {/* For Conversation, show Question first if exists */}
                 {lesson.type === 'Conversation' && turn.question && (
                     <div className="mb-2 pl-4 border-l-2 border-slate-300 dark:border-slate-600">
                         <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{turn.question}</p>
                         {showTranslation && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{turn.questionTranslation}</p>
                         )}
                     </div>
                 )}

                 {/* Main Sentence (Target Answer) */}
                 <div className="flex gap-3">
                    <button 
                        onClick={() => handleManualPlay(idx)}
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 transition-colors ${
                            activeIndex === idx ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`}
                    >
                        <Volume2 size={14} />
                    </button>
                    <div>
                        <p className={`text-lg md:text-xl leading-relaxed font-medium transition-colors ${
                            activeIndex === idx ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-100'
                        }`}>
                            {turn.targetAnswer}
                        </p>
                        {showTranslation && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-light">
                                {turn.targetAnswerTranslation}
                            </p>
                        )}
                    </div>
                 </div>
              </div>
          ))}
      </div>

      {/* Footer Controls - Shrink 0 ensures it doesn't compress, Static position ensures it stacks below content */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={handleToggleAutoPlay}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isPlaying 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
            }`}
          >
             {isPlaying ? (
                 <><PauseCircle size={20} /> {t(nativeLang, 'stop_play')}</>
             ) : (
                 <><PlayCircle size={20} /> {t(nativeLang, 'auto_play')}</>
             )}
          </button>
      </div>
    </div>
  );
};