
import { useState, useCallback } from 'react';
import { PuzzleData, ChatMessage, Sender, ConversationConfig, Lesson } from '../types';

export const useGameState = () => {
  const [config, setConfig] = useState<ConversationConfig | null>(null);
  const [conversationPlan, setConversationPlan] = useState<PuzzleData[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  const initializeLesson = useCallback((lesson: Lesson, nativeLang: any) => {
    const newConfig = { 
        topic: lesson.topic, 
        difficulty: lesson.level as any,
        tone: lesson.tone,
        nativeLang, 
        targetLang: lesson.language,
        lessonType: lesson.type || 'Conversation' 
    };
    
    setConfig(newConfig);
    setConversationPlan(lesson.turns);
    setCurrentTurnIndex(0);
    setMessages([]);
    setCurrentLessonId(lesson.id);

    if (!lesson.type || lesson.type === 'Conversation') {
        const firstTurn = lesson.turns[0];
        const aiMsg: ChatMessage = {
            id: 'msg-0',
            sender: Sender.AI,
            text: firstTurn.question,
            translation: firstTurn.questionTranslation
        };
        setMessages([aiMsg]);
    }
  }, []);

  const restartLesson = useCallback(() => {
    if (!config || conversationPlan.length === 0) return;
      
    setCurrentTurnIndex(0);
    setMessages([]);
    
    if (config.lessonType === 'Conversation') {
        const firstTurn = conversationPlan[0];
        const aiMsg: ChatMessage = {
            id: 'msg-0',
            sender: Sender.AI,
            text: firstTurn.question,
            translation: firstTurn.questionTranslation
        };
        setMessages([aiMsg]);
    }
  }, [config, conversationPlan]);

  const advanceTurn = useCallback((userSentence: string) => {
    if (!conversationPlan.length) return { isComplete: false };

    const currentTurnData = conversationPlan[currentTurnIndex];
    const userMsg: ChatMessage = {
      id: `msg-user-${currentTurnIndex}`,
      sender: Sender.USER,
      text: userSentence,
      translation: currentTurnData.targetAnswerTranslation
    };
    
    const nextIndex = currentTurnIndex + 1;
    const updatedMessages = [...messages, userMsg];
    
    if (nextIndex < conversationPlan.length) {
      const nextTurnData = conversationPlan[nextIndex];
      
      if (config?.lessonType === 'Conversation') {
          const nextAiMsg: ChatMessage = {
            id: `msg-ai-${nextIndex}`,
            sender: Sender.AI,
            text: nextTurnData.question,
            translation: nextTurnData.questionTranslation
          };
          setMessages([...updatedMessages, nextAiMsg]);
      } else {
          setMessages(updatedMessages);
      }
      
      setCurrentTurnIndex(nextIndex);
      return { isComplete: false, currentWords: currentTurnData.words };
    } else {
      setMessages(updatedMessages);
      return { isComplete: true, currentWords: currentTurnData.words };
    }
  }, [conversationPlan, currentTurnIndex, messages, config]);

  // For restoring history view
  const loadHistorySession = useCallback((session: any, nativeLang: any) => {
    setConfig({ 
        topic: session.topic, 
        difficulty: session.difficulty as any,
        nativeLang: nativeLang, 
        targetLang: session.targetLang || 'ko',
        lessonType: session.lessonType || 'Conversation'
    });
    setMessages(session.messages);
    
    if (session.turns) {
        setConversationPlan(session.turns);
    } else {
        setConversationPlan([]); 
    }
  }, []);

  return {
    config,
    messages,
    conversationPlan,
    currentTurnIndex,
    currentLessonId,
    setConfig, // Exposed for manual overrides (e.g., Reading mode setup)
    setConversationPlan,
    initializeLesson,
    restartLesson,
    advanceTurn,
    loadHistorySession
  };
};
