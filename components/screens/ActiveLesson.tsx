import React, { useState, useEffect } from 'react';
import { X, BookOpenText, MessageCircle, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { ChatMessage, ConversationConfig, PuzzleData, Sender } from '../../types';
import { ChatMessageList } from '../ChatMessageList';
import { WordPuzzle } from '../WordPuzzle';

interface ActiveLessonProps {
  config: ConversationConfig;
  messages: ChatMessage[];
  currentPuzzle?: PuzzleData;
  currentTurnIndex: number;
  totalTurns: number;
  onExit: () => void;
  onPlayAudio: (text: string) => void;
  onExplain: (text: string) => void;
  onPuzzleComplete: (sentence: string) => void;
}

export const ActiveLesson: React.FC<ActiveLessonProps> = ({
  config,
  messages,
  currentPuzzle,
  currentTurnIndex,
  totalTurns,
  onExit,
  onPlayAudio,
  onExplain,
  onPuzzleComplete
}) => {
  const isReadingMode = config.lessonType === 'Reading';
  const [showReadingContext, setShowReadingContext] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);

  // Auto-play audio when the turn changes (for Conversation questions)
  useEffect(() => {
    if (config.lessonType === 'Conversation' && currentPuzzle?.question) {
        const timer = setTimeout(() => {
            onPlayAudio(currentPuzzle.question);
        }, 600); // Slight delay to allow UI transition
        return () => clearTimeout(timer);
    }
  }, [currentTurnIndex, currentPuzzle, config.lessonType]); // Intentionally omitted onPlayAudio to avoid loops

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between sticky top-0 z-10 shrink-0 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={24} />
          </button>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${isReadingMode ? 'bg-pink-600' : 'bg-indigo-600'}`}>
             {isReadingMode ? <BookOpenText size={20} /> : <MessageCircle size={20} />}
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-slate-900 dark:text-white text-sm md:text-base max-w-[150px] truncate">{config.topic}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {config.difficulty === 'Beginner' ? 'Sơ cấp' : config.difficulty === 'Intermediate' ? 'Trung cấp' : 'Cao cấp'}
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-500"></span>
              {isReadingMode ? 'Bài đọc' : 'Hội thoại'}
            </p>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
          {currentTurnIndex + 1} / {totalTurns}
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {isReadingMode ? (
          // READING MODE: Split Screen Layout
          <div className="flex flex-col h-full">
            
            {/* Optional: Collapsible Context (History) */}
            <div className={`bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out overflow-hidden ${showReadingContext ? 'max-h-40' : 'max-h-0'}`}>
               <div className="p-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {messages.length > 0 ? messages.filter(m => m.sender === Sender.USER).map((m, i) => (
                     <span key={i} className="mr-1">{m.text}</span>
                  )) : (
                     <span className="italic text-slate-400">Chưa có nội dung...</span>
                  )}
               </div>
            </div>
            <button 
               onClick={() => setShowReadingContext(!showReadingContext)}
               className="w-full flex items-center justify-center py-1 bg-white dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600 text-[10px] font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 uppercase tracking-wider transition-colors"
            >
               {showReadingContext ? <><ChevronUp size={12} /> Ẩn văn bản đã học</> : <><ChevronDown size={12} /> Xem văn bản đã học</>}
            </button>

            {/* TOP HALF: Target Translation (The Prompt) */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 text-center relative overflow-y-auto transition-colors">
               <button 
                   onClick={() => setShowTranslation(!showTranslation)}
                   className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 dark:hover:text-indigo-400 rounded-full transition-all z-10"
                   title={showTranslation ? "Ẩn bản dịch" : "Hiện bản dịch"}
               >
                   {showTranslation ? <Eye size={20} /> : <EyeOff size={20} />}
               </button>

               <div className="text-xs font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-widest mb-3 shrink-0">Dịch câu sau sang tiếng {config.targetLang === 'ko' ? 'Hàn' : config.targetLang === 'en' ? 'Anh' : 'Nhật'}</div>
               {currentPuzzle ? (
                 <div className={`transition-all duration-300 w-full max-w-2xl ${showTranslation ? 'opacity-100 blur-0' : 'opacity-30 blur-md select-none'}`}>
                    <h2 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed animate-in zoom-in duration-300 px-2">
                        "{currentPuzzle.targetAnswerTranslation}"
                    </h2>
                 </div>
               ) : (
                 <div className="animate-pulse h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
               )}
            </div>
            
          </div>
        ) : (
          // CONVERSATION MODE: Chat History
          <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
            <ChatMessageList
              messages={messages}
              onPlayAudio={onPlayAudio}
              onExplain={onExplain}
            />
          </div>
        )}
      </div>

      {/* BOTTOM HALF: Interaction Area (Puzzle) */}
      <div className={`${isReadingMode ? 'h-1/2 border-t-4 border-indigo-100 dark:border-indigo-900/30' : 'h-auto border-t border-slate-100 dark:border-slate-700'} bg-white dark:bg-slate-800 p-4 shrink-0 z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col justify-center transition-colors`}>
        {currentPuzzle ? (
          <WordPuzzle
            key={`puzzle-${currentTurnIndex}`}
            data={currentPuzzle}
            onComplete={onPuzzleComplete}
            isLastTurn={currentTurnIndex >= totalTurns - 1}
            prompt={isReadingMode ? undefined : undefined} 
            onPlayAudio={onPlayAudio}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            Đang tải câu hỏi...
          </div>
        )}
      </div>
    </div>
  );
};