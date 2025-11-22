import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Tag, BookOpen } from 'lucide-react';
import { Lesson, LessonLevel } from '../../types';
import { NativeLanguage, t } from '../../data/languages';

interface EditLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  onSave: (id: string, updates: Partial<Lesson>) => void;
  nativeLang: NativeLanguage;
}

const LEVELS: LessonLevel[] = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6'];

export const EditLessonModal: React.FC<EditLessonModalProps> = ({
  isOpen, onClose, lesson, onSave, nativeLang
}) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<LessonLevel | string>('Level 1');

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setTopic(lesson.topic);
      setDescription(lesson.description);
      setLevel(lesson.level);
    }
  }, [lesson]);

  if (!isOpen || !lesson) return null;

  const handleSave = () => {
    if (!title.trim() || !topic.trim()) return;
    
    onSave(lesson.id, {
      title,
      topic,
      description,
      level
    });
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t(nativeLang, 'edit_lesson')}</h3>
          <button onClick={onClose} className="p-2 bg-white dark:bg-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-500 text-slate-500 dark:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              {t(nativeLang, 'lesson_title')}
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              {t(nativeLang, 'lesson_topic')}
            </label>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Level */}
          <div>
             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              {t(nativeLang, 'level_label')}
            </label>
             <div className="relative">
              <BookOpen size={16} className="absolute left-3 top-3 text-slate-400" />
              <select 
                value={level} 
                onChange={(e) => setLevel(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
              >
                {LEVELS.map(l => {
                    const key = l === 'Level 1' ? 'lvl_1' : l === 'Level 2' ? 'lvl_2' : l === 'Level 3' ? 'lvl_3' : l === 'Level 4' ? 'lvl_4' : l === 'Level 5' ? 'lvl_5' : 'lvl_6';
                    return <option key={l} value={l}>{t(nativeLang, key)}</option>
                })}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              {t(nativeLang, 'lesson_desc')}
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
           <button 
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
           >
             {t(nativeLang, 'cancel_btn')}
           </button>
           <button 
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-lg shadow-indigo-200 dark:shadow-none"
           >
             <Save size={16} /> {t(nativeLang, 'save_changes')}
           </button>
        </div>

      </div>
    </div>
  );
};