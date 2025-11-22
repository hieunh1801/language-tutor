
import React from 'react';
import { BookOpen, X, Loader2 } from 'lucide-react';

interface GrammarModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  text: string;
}

export const GrammarModal: React.FC<GrammarModalProps> = ({ isOpen, onClose, isLoading, text }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-2 text-indigo-800 font-bold">
            <BookOpen size={18} /> Giải thích ngữ pháp
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-2 text-indigo-500" />
              <p className="text-sm">Đang phân tích câu...</p>
            </div>
          ) : (
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {text}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-slate-50 border-t border-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
