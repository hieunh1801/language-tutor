
import { NativeLanguage, TargetLanguage } from './data/languages';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

export enum Sender {
  AI = 'AI',
  USER = 'USER'
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  translation?: string;
}

export interface PuzzleData {
  question: string;
  questionTranslation: string;
  targetAnswer: string; // The correct full sentence
  targetAnswerTranslation: string;
  words: string[]; // The scrambled words/particles
}

export type LessonType = 'Conversation' | 'Reading';
export type LessonLevel = 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4' | 'Level 5' | 'Level 6';
export type LessonTone = 'Standard' | 'Polite' | 'Casual' | 'Humorous' | 'Emotional';

export interface Lesson {
  id: string;
  language: TargetLanguage; // The language being learned
  type: LessonType;
  title: string;
  description: string;
  level: LessonLevel | string; // String to support old 'Beginner' data
  tone?: LessonTone;
  topic: string;
  turns: PuzzleData[];
}

export interface LessonProgress {
  lessonId: string;
  srsLevel: number; // 0 to 5
  lastStudied: number;
  nextReview: number;
  reviewCount: number;
}

export enum AppState {
  INTRO = 'INTRO',
  LOADING = 'LOADING',
  ACTIVE = 'ACTIVE',
  READING = 'READING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ConversationConfig {
  topic: string;
  difficulty: string;
  tone?: LessonTone;
  targetLang: TargetLanguage;
  nativeLang: NativeLanguage;
  lessonType: LessonType;
}

export interface SavedSession {
  id: string;
  timestamp: number;
  topic: string;
  difficulty: string;
  targetLang: TargetLanguage;
  lessonType: LessonType;
  messages: ChatMessage[];
  turns?: PuzzleData[]; // Added to allow restarting the lesson
}

export interface VocabularyItem {
  text: string;
  count: number;
  lastSeen: number;
  language: TargetLanguage;
}