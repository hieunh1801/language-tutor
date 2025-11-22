
import React, { useState, useEffect } from 'react';
import { PuzzleData } from '../types';
import { Check, ArrowRight, X, Wand2, RotateCcw } from 'lucide-react';

interface WordPuzzleProps {
  data: PuzzleData;
  onComplete: (sentence: string) => void;
  isLastTurn: boolean;
  prompt?: string; 
}

interface WordItem {
  id: string;
  text: string;
}

export const WordPuzzle: React.FC<WordPuzzleProps> = ({ data, onComplete, isLastTurn, prompt }) => {
  const [availableWords, setAvailableWords] = useState<WordItem[]>([]);
  const [selectedWords, setSelectedWords] = useState<WordItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  useEffect(() => {
    const words = data.words.map((w, i) => ({ id: `word-${i}-${Date.now()}`, text: w }));
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setStatus('idle');
  }, [data]);

  const handleSelectWord = (word: WordItem) => {
    if (status === 'correct') return;
    setAvailableWords(prev => prev.filter(w => w.id !== word.id));
    setSelectedWords(prev => [...prev, word]);
    setStatus('idle');
  };

  const handleDeselectWord = (word: WordItem) => {
    if (status === 'correct') return;
    setSelectedWords(prev => prev.filter(w => w.id !== word.id));
    setAvailableWords(prev => [...prev, word]);
    setStatus('idle');
  };

  const getCorrectArrangement = () => {
    const allItems = [...selectedWords, ...availableWords];
    const orderedItems: WordItem[] = [];
    const pool = [...allItems];

    data.words.forEach(targetWord => {
      const index = pool.findIndex(item => item.text === targetWord);
      if (index !== -1) {
        orderedItems.push(pool[index]);
        pool.splice(index, 1);
      }
    });
    
    return { orderedItems, remaining: pool };
  };

  const handleAutoArrange = () => {
    if (status === 'correct') return;
    const { orderedItems, remaining } = getCorrectArrangement();
    setSelectedWords(orderedItems);
    setAvailableWords(remaining);
    setStatus('idle');
  };

  const handleReset = () => {
      if (status === 'correct') return;
      const all = [...selectedWords, ...availableWords];
      setSelectedWords([]);
      setAvailableWords(all.sort(() => Math.random() - 0.5));
      setStatus('idle');
  };

  const checkAnswer = () => {
    const formedSentence = selectedWords.map(w => w.text).join(' '); 
    const normalize = (str: string) => str.replace(/[.,?!;:\s]/g, '');
    const cleanFormed = normalize(formedSentence);
    const cleanTarget = normalize(data.targetAnswer);

    if (cleanFormed === cleanTarget) {
      setStatus('correct');
    } else {
      setStatus('incorrect');
    }
  };

  const handleSubmit = () => {
    if (status === 'correct') {
      onComplete(data.targetAnswer);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-full justify-center">
      
      {/* Prompt Area (Only shows if provided explicitly, usually Reading mode) */}
      {prompt && (
        <div className="mb-3 px-4 py-2 bg-slate-50 border-l-4 border-indigo-500 rounded-r-lg">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yêu cầu</div>
          <div className="text-sm font-medium text-slate-800 line-clamp-2">{prompt}</div>
        </div>
      )}

      {/* --- Answer Input Area --- */}
      <div className="mb-4">
        <div 
          className={`min-h-[56px] w-full p-2 rounded-xl border flex flex-wrap gap-2 items-center transition-colors relative bg-white ${
          status === 'correct' ? 'border-green-500 ring-1 ring-green-500 bg-green-50/30' : 
          status === 'incorrect' ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 
          'border-slate-200 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500'
        }`}>
          
          {/* Placeholder Text */}
          {selectedWords.length === 0 && (
            <span className="text-slate-400 text-sm absolute left-3 pointer-events-none select-none">
              Chọn từ bên dưới để ghép câu...
            </span>
          )}

          {/* Selected Word Chips */}
          {selectedWords.map((word) => (
            <button
              key={word.id}
              onClick={() => handleDeselectWord(word)}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium rounded-lg text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors animate-in zoom-in duration-200"
            >
              {word.text}
            </button>
          ))}

          {/* Quick Actions inside the box (Right side) */}
          <div className="ml-auto flex items-center gap-1 pl-2">
             {selectedWords.length > 0 && status !== 'correct' && (
                <button 
                    onClick={handleReset}
                    className="p-1.5 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100 transition-colors"
                    title="Xóa hết"
                >
                    <RotateCcw size={14} />
                </button>
             )}
          </div>
        </div>
        
        {/* Feedback / Hints Line */}
        <div className="flex justify-between items-center min-h-[24px] px-1 mt-1">
            <div className="text-sm font-medium">
                {status === 'incorrect' && (
                <span className="flex items-center gap-1 text-red-500 animate-in slide-in-from-left-2">
                    <X size={14} /> Chưa chính xác
                </span>
                )}
                {status === 'correct' && (
                <span className="flex items-center gap-1 text-green-600 animate-in slide-in-from-left-2">
                    <Check size={14} /> Chính xác!
                </span>
                )}
            </div>

            {status !== 'correct' && (
                <button 
                onClick={handleAutoArrange}
                className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-600 transition-colors font-medium"
                >
                <Wand2 size={12} /> Gợi ý
                </button>
            )}
        </div>
      </div>

      {/* --- Word Bank --- */}
      <div className="flex-1 content-start">
        <div className="flex flex-wrap gap-2 justify-center">
          {availableWords.map((word) => (
            <button
              key={word.id}
              onClick={() => handleSelectWord(word)}
              className="px-3 py-2 bg-slate-100 border border-transparent text-slate-600 font-medium rounded-lg text-sm hover:bg-white hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm active:scale-95 transition-all duration-150"
            >
              {word.text}
            </button>
          ))}
        </div>
      </div>

      {/* --- Bottom Actions --- */}
      <div className="flex justify-end gap-3 pt-4 mt-auto">
        {status !== 'correct' ? (
          <>
            <button
              onClick={checkAnswer}
              disabled={selectedWords.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all w-full justify-center"
            >
              Kiểm tra
            </button>
          </>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all animate-bounce ml-auto"
          >
            {isLastTurn ? 'Hoàn thành' : 'Tiếp tục'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
