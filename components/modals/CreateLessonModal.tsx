
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Loader2, Upload, Lightbulb, MessageCircle, BookOpenText, Mic, Copy, FilePenLine, Settings2, ChevronDown } from 'lucide-react';
import { NativeLanguage, t, TARGET_LANGUAGES, TargetLanguage } from '../../data/languages';
import { LessonType, LessonLevel, LessonTone } from '../../types';
import { buildLessonPrompt, JSON_FORMAT_INSTRUCTION } from '../../services/geminiService';

interface CreateLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (topic: string, level: LessonLevel, lengthDescription: string, type: LessonType, tone: LessonTone) => Promise<void>;
  isGenerating: boolean;
  onImport: (file: File) => void;
  onImportJson: (jsonString: string) => void;
  nativeLang: NativeLanguage;
  targetLang: TargetLanguage;
}

type LengthOption = 'short' | 'medium' | 'long' | 'custom';

const SUGGESTED_TOPICS = [
  "Introduction", "Shopping", "Ordering Food", "Asking Directions", 
  "Hobbies", "Family", "Weather", "Travel", 
  "Hospital", "Bank", "School Life", "Job Interview", 
  "Phone Call", "Movies", "Music", "Dating", 
  "Holidays", "Traffic", "Emergency", "Daily Routine"
];

const LEVELS: LessonLevel[] = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6'];
const TONES: LessonTone[] = ['Standard', 'Polite', 'Casual', 'Humorous', 'Emotional'];

export const CreateLessonModal: React.FC<CreateLessonModalProps> = ({ 
  isOpen, onClose, onGenerate, isGenerating, onImport, onImportJson, nativeLang, targetLang
}) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<LessonLevel>('Level 1');
  const [tone, setTone] = useState<LessonTone>('Standard');
  const [type, setType] = useState<LessonType>('Conversation');
  const [lengthOption, setLengthOption] = useState<LengthOption>('short');
  const [customLength, setCustomLength] = useState<number>(10);
  
  // Manual Paste Modal State
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedJson, setPastedJson] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
      if (isOpen) {
          setTopic('');
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const getLengthString = () => {
    switch (lengthOption) {
      case 'short': return type === 'Conversation' ? "5-7 turns" : "5-7 sentences";
      case 'medium': return type === 'Conversation' ? "7-10 turns" : "7-10 sentences";
      case 'long': return type === 'Conversation' ? "10-15 turns" : "10-15 sentences";
      case 'custom': return `${customLength} ${type === 'Conversation' ? 'turns' : 'sentences'}`;
      default: return "5-7 turns";
    }
  };

  const handleCreate = () => {
    if (topic.trim()) {
      onGenerate(topic, level, getLengthString(), type, tone);
    }
  };

  const handleCopyPrompt = () => {
    if (!topic.trim()) {
        alert("Vui lòng nhập chủ đề trước khi sao chép prompt.");
        return;
    }
    const basePrompt = buildLessonPrompt(topic, level, targetLang, nativeLang, getLengthString(), type, tone);
    const fullPrompt = `${basePrompt}\n\n${JSON_FORMAT_INSTRUCTION}`;
    navigator.clipboard.writeText(fullPrompt);
    alert(t(nativeLang, 'prompt_copied'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onImport(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  const handleManualSubmit = () => {
      if (!pastedJson.trim()) return;
      onImportJson(pastedJson);
      setPastedJson('');
      setShowPasteModal(false);
  };

  const targetLangConfig = TARGET_LANGUAGES.find(l => l.code === targetLang);

  return (
    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col p-4 animate-in slide-in-from-bottom-4 duration-300">
      
      {/* Nested Modal for Manual Paste */}
      {showPasteModal && (
        <div className="absolute inset-0 z-[60] bg-white p-6 flex flex-col animate-in fade-in duration-200">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FilePenLine className="text-indigo-600" /> {t(nativeLang, 'paste_json_title')}
                </h3>
                <button onClick={() => setShowPasteModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <X size={20} className="text-slate-500" />
                </button>
            </div>
            <div className="flex-1 flex flex-col">
                <textarea 
                    className="flex-1 w-full p-4 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono bg-slate-50"
                    placeholder={t(nativeLang, 'paste_placeholder')}
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                />
                <div className="flex gap-3 mt-4">
                    <button 
                        onClick={() => setShowPasteModal(false)}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                    >
                        {t(nativeLang, 'cancel_btn')}
                    </button>
                    <button 
                        onClick={handleManualSubmit}
                        disabled={!pastedJson.trim()}
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t(nativeLang, 'import_btn')}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Main Modal Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                <Sparkles size={18} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {t(nativeLang, 'create_lesson')}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                   Đang học: <span className="font-bold text-slate-700">{targetLangConfig?.label}</span>
                </p>
            </div>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        
        {/* 1. Type Select - Segmented Control */}
        <div className="bg-slate-100 p-1 rounded-xl flex mb-4 shrink-0">
            <button 
                onClick={() => setType('Conversation')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    type === 'Conversation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <MessageCircle size={14} /> {t(nativeLang, 'type_conversation')}
            </button>
            <button 
                onClick={() => setType('Reading')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    type === 'Reading' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <BookOpenText size={14} /> {t(nativeLang, 'type_reading')}
            </button>
        </div>

        {/* 2. Topic Input - Hero Section */}
        <div className="mb-4">
           <input
            type="text"
            autoFocus
            placeholder="Nhập chủ đề (VD: Đi chợ, Du lịch...)"
            className="w-full px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-base font-medium text-slate-800 placeholder:text-slate-400"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
           />
        </div>

        {/* 3. Settings - Compact Grid of Dropdowns */}
        <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Level */}
            <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">
                    {t(nativeLang, 'level_label')}
                </label>
                <div className="relative">
                    <select 
                        value={level} 
                        onChange={(e) => setLevel(e.target.value as LessonLevel)}
                        className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                        {LEVELS.map(l => {
                             const key = l === 'Level 1' ? 'lvl_1' : l === 'Level 2' ? 'lvl_2' : l === 'Level 3' ? 'lvl_3' : l === 'Level 4' ? 'lvl_4' : l === 'Level 5' ? 'lvl_5' : 'lvl_6';
                             return <option key={l} value={l}>{t(nativeLang, key)}</option>
                        })}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Tone */}
            <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">
                    {t(nativeLang, 'tone_label')}
                </label>
                <div className="relative">
                    <select 
                        value={tone} 
                        onChange={(e) => setTone(e.target.value as LessonTone)}
                        className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                        {TONES.map(tOption => {
                             const keyMap: Record<string, any> = { 'Standard': 'tone_standard', 'Polite': 'tone_polite', 'Casual': 'tone_casual', 'Humorous': 'tone_humorous', 'Emotional': 'tone_emotional' };
                             return <option key={tOption} value={tOption}>{t(nativeLang, keyMap[tOption])}</option>
                        })}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

             {/* Length */}
             <div className="relative col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">
                    Độ dài
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                         <select 
                            value={lengthOption} 
                            onChange={(e) => setLengthOption(e.target.value as LengthOption)}
                            className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 capitalize"
                        >
                            <option value="short">Ngắn (5-7 câu)</option>
                            <option value="medium">Vừa (7-10 câu)</option>
                            <option value="long">Dài (10-15 câu)</option>
                            <option value="custom">Tùy chỉnh</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    
                    {lengthOption === 'custom' && (
                        <input 
                            type="number" 
                            min="1" 
                            max="50"
                            value={customLength}
                            onChange={(e) => setCustomLength(parseInt(e.target.value) || 0)}
                            className="w-20 pl-2 pr-1 py-2.5 rounded-xl border border-slate-200 text-center outline-none focus:ring-2 focus:ring-indigo-200 font-bold text-indigo-700 text-xs"
                            placeholder="Số câu"
                        />
                    )}
                </div>
            </div>
        </div>
        
        {/* 4. Suggestions */}
        <div className="space-y-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Lightbulb size={10} /> {t(nativeLang, 'suggestion')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TOPICS.slice(0, 12).map((item) => (
                <button
                  key={item}
                  onClick={() => setTopic(item)}
                  className="text-[10px] px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-md text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors font-medium"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

      </div>

      {/* Fixed Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-10">
          <button
            onClick={handleCreate}
            disabled={isGenerating || !topic || (lengthOption === 'custom' && customLength < 1)}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200 mb-3 text-sm"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isGenerating ? t(nativeLang, 'generating') : t(nativeLang, 'create_lesson')}
          </button>

          <div className="flex items-center justify-between gap-2">
             <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-colors"
             >
                <Upload size={14} /> JSON File
                <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
             </button>

             <button
              onClick={() => setShowPasteModal(true)}
              className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-colors"
             >
                <FilePenLine size={14} /> {t(nativeLang, 'manual_import')}
             </button>

             <button
              onClick={handleCopyPrompt}
              disabled={!topic}
              className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
              title={t(nativeLang, 'copy_prompt')}
             >
                <Copy size={16} />
             </button>
          </div>
      </div>
    </div>
  );
};
