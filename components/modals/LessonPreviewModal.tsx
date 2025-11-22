import React from 'react';
import { X, Gamepad2, Headphones, MessageCircle, BookOpenText } from 'lucide-react';
import { Lesson } from '../../types';
import { NativeLanguage, t } from '../../data/languages';

interface LessonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  onPractice: () => void;
  onRead: () => void;
  nativeLang: NativeLanguage;
}

export const LessonPreviewModal: React.FC<LessonPreviewModalProps> = ({
  isOpen, onClose, lesson, onPractice, onRead, nativeLang
}) => {
  if (!isOpen || !lesson) return null;

  const isReading = lesson.type === 'Reading';
  const TypeIcon = isReading ? BookOpenText : MessageCircle;

  return (
    <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-700/50">
           <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${isReading ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'}`}>
                <TypeIcon size={24} />
             </div>
             <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight line-clamp-1">{lesson.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{lesson.topic}</p>
             </div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={20} />
           </button>
        </div>

        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center mb-4 px-2">
                {lesson.description}
            </p>

            <div className="grid gap-3">
                {/* Interactive Mode */}
                <button 
                    onClick={onPractice}
                    className="group relative flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left shadow-sm hover:shadow-md dark:shadow-none"
                >
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <Gamepad2 size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{t(nativeLang, 'mode_practice')}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t(nativeLang, 'mode_practice_desc')}</div>
                    </div>
                </button>

                {/* Read/Passive Mode */}
                <button 
                    onClick={onRead}
                    className="group relative flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-pink-500 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all text-left shadow-sm hover:shadow-md dark:shadow-none"
                >
                    <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <Headphones size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-pink-700 dark:group-hover:text-pink-400">{t(nativeLang, 'mode_read')}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t(nativeLang, 'mode_read_desc')}</div>
                    </div>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};