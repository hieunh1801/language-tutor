import React from 'react';
import { History, X, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { SavedSession } from '../../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  onView: (session: SavedSession) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, sessions, onView, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-800 flex flex-col animate-in slide-in-from-right duration-300 z-50">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 shadow-sm">
        <h2 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
          <History size={20} className="text-indigo-600 dark:text-indigo-400" /> Lịch sử bài học
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
          <X size={20} className="text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      <div className="space-y-3 p-4 overflow-y-auto flex-1">
        {sessions.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <History size={48} className="opacity-20 mx-auto mb-3" />
            <p className="text-sm">Chưa có lịch sử học tập.</p>
          </div>
        )}
        {sessions.map(session => (
          <div
            key={session.id}
            onClick={() => onView(session)}
            className="group relative p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer bg-slate-50 dark:bg-slate-700/50"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 text-sm">{session.topic}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={10} /> {new Date(session.timestamp).toLocaleDateString('vi-VN')} {new Date(session.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 dark:text-slate-500" />
            </div>
            <button
              onClick={(e) => onDelete(e, session.id)}
              className="absolute top-4 right-8 p-1 text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};