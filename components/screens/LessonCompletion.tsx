
import React from 'react';
import { Sparkles, Volume2, Library, RotateCcw, Home } from 'lucide-react';
import { ChatMessage, Sender } from '../../types';
import { NativeLanguage, t } from '../../data/languages';

interface LessonCompletionProps {
  topic: string;
  messages: ChatMessage[];
  isReviewMode: boolean; // If reviewing a past session vs finishing a new one
  nextReviewDays?: number;
  onPlayAudio: (text: string) => void;
  onHome: () => void;
  onReviewVocab: () => void;
  onRestart?: () => void;
  nativeLang?: NativeLanguage;
}

export const LessonCompletion: React.FC<LessonCompletionProps> = ({
  topic,
  messages,
  isReviewMode,
  nextReviewDays,
  onPlayAudio,
  onHome,
  onReviewVocab,
  onRestart,
  nativeLang = 'vi'
}) => {
  return (
    <div className="h-full bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="shrink-0">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Sparkles size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {isReviewMode ? 'Xem lại bài học' : 'Hoàn thành bài học!'}
          </h2>
          {nextReviewDays !== undefined && (
            <div className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-indigo-100">
              Đã lên lịch ôn tập: {nextReviewDays} ngày nữa
            </div>
          )}
          <p className="text-slate-500 mb-6 text-sm">
            Chủ đề: <span className="font-medium text-slate-800">"{topic}"</span>
          </p>
        </div>

        <div className="flex-1 bg-slate-50 rounded-2xl p-6 mb-6 text-left overflow-y-auto border border-slate-100 min-h-0">
          {messages.map((m) => (
            <div key={m.id} className="mb-4 last:mb-0">
              <div className="flex justify-between items-center mb-1">
                <div className={`text-xs font-bold ${m.sender === Sender.AI ? 'text-indigo-600' : 'text-slate-600'}`}>
                  {m.sender === Sender.AI ? 'Giáo viên' : 'Bạn'}:
                </div>
                <button onClick={() => onPlayAudio(m.text)} className="text-slate-300 hover:text-indigo-500"><Volume2 size={12} /></button>
              </div>
              <div className="text-sm text-slate-800 font-medium">{m.text}</div>
            </div>
          ))}
        </div>

        <div className="shrink-0 space-y-3">
          {isReviewMode && onRestart && (
            <button
              onClick={onRestart}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-indigo-200"
            >
              <RotateCcw size={18} /> {t(nativeLang, 'learn_again')}
            </button>
          )}

          <button
            onClick={onReviewVocab}
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Library size={18} /> {t(nativeLang, 'view_vocab')}
          </button>
          
          <button
            onClick={onHome}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          >
            <Home size={18} /> {t(nativeLang, 'back_home')}
          </button>
        </div>
      </div>
    </div>
  );
};
