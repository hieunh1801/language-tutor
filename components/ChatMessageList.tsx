import React, { useEffect, useRef } from 'react';
import { ChatMessage, Sender } from '../types';
import { Bot, User, Volume2 } from 'lucide-react';

interface ChatMessageListProps {
  messages: ChatMessage[];
  onPlayAudio: (text: string) => void;
  onExplain: (text: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, onPlayAudio, onExplain }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((msg) => {
        const isAI = msg.sender === Sender.AI;
        return (
          <div
            key={msg.id}
            className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex max-w-[90%] md:max-w-[75%] gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                isAI ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {isAI ? <Bot size={20} /> : <User size={20} />}
              </div>

              {/* Bubble */}
              <div className={`flex flex-col p-4 rounded-2xl shadow-sm group relative ${
                isAI 
                  ? 'bg-white dark:bg-slate-800 rounded-tl-none border border-slate-100 dark:border-slate-700' 
                  : 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-tr-none'
              }`}>
                <div className="flex items-start gap-2">
                    <p className={`text-lg font-medium leading-relaxed ${isAI ? 'text-slate-800 dark:text-slate-100' : 'text-white'}`}>
                    {msg.text}
                    </p>
                    <button 
                        onClick={() => onPlayAudio(msg.text)}
                        className={`mt-1 p-1.5 rounded-full opacity-50 hover:opacity-100 transition-opacity ${isAI ? 'text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-700' : 'text-indigo-200 hover:bg-indigo-500 dark:hover:bg-indigo-600'}`}
                        title="Nghe phát âm"
                    >
                        <Volume2 size={16} />
                    </button>
                </div>
                
                {msg.translation && (
                  <p className={`text-sm mt-1 ${isAI ? 'text-slate-500 dark:text-slate-400' : 'text-indigo-200'}`}>
                    {msg.translation}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};