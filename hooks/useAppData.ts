

import { useState, useEffect, useCallback } from 'react';
import { SavedSession, VocabularyItem, Lesson, LessonProgress, TargetLanguage } from '../types';

const STORAGE_KEY = 'korean_app_history_v1';
const VOCAB_KEY = 'korean_app_vocab_v1';
const CUSTOM_LESSONS_KEY = 'korean_app_custom_lessons_v1';
const PROGRESS_KEY = 'korean_app_progress_v1';
const SRS_INTERVALS = [0, 1, 3, 7, 14, 30];

export const useAppData = () => {
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});

  // Load Data
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEY);
      if (storedHistory) setSavedSessions(JSON.parse(storedHistory));

      const storedVocab = localStorage.getItem(VOCAB_KEY);
      if (storedVocab) setVocabList(JSON.parse(storedVocab));

      const storedCustomLessons = localStorage.getItem(CUSTOM_LESSONS_KEY);
      if (storedCustomLessons) setCustomLessons(JSON.parse(storedCustomLessons));

      const storedProgress = localStorage.getItem(PROGRESS_KEY);
      if (storedProgress) setLessonProgress(JSON.parse(storedProgress));
    } catch (e) {
      console.error("Failed to load storage", e);
    }
  }, []);

  // --- Actions ---

  const addSession = useCallback((session: SavedSession) => {
    setSavedSessions(prev => {
      const updated = [session, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSavedSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateVocabulary = useCallback((newWords: string[], lang: TargetLanguage) => {
    setVocabList(prev => {
      const currentVocab = [...prev];
      newWords.forEach(word => {
        const cleanWord = word.replace(/[.,?!;:"'(){}[\]]/g, "").trim();
        if (!cleanWord) return;
        const existingIndex = currentVocab.findIndex(v => v.text === cleanWord && v.language === lang);
        if (existingIndex !== -1) {
          currentVocab[existingIndex].count += 1;
          currentVocab[existingIndex].lastSeen = Date.now();
        } else {
          currentVocab.push({ text: cleanWord, count: 1, lastSeen: Date.now(), language: lang });
        }
      });
      currentVocab.sort((a, b) => b.count - a.count);
      localStorage.setItem(VOCAB_KEY, JSON.stringify(currentVocab));
      return currentVocab;
    });
  }, []);

  const updateSRS = useCallback((lessonId: string) => {
    setLessonProgress(prev => {
      const current = prev[lessonId] || { 
        lessonId, 
        srsLevel: 0, 
        lastStudied: 0, 
        nextReview: 0, 
        reviewCount: 0 
      };

      const newLevel = Math.min(current.srsLevel + 1, SRS_INTERVALS.length - 1);
      const intervalDays = SRS_INTERVALS[newLevel];
      const nextReviewDate = Date.now() + (intervalDays * 24 * 60 * 60 * 1000);

      const updatedProgress = {
        ...prev,
        [lessonId]: {
          lessonId,
          srsLevel: newLevel,
          lastStudied: Date.now(),
          nextReview: nextReviewDate,
          reviewCount: current.reviewCount + 1
        }
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(updatedProgress));
      return updatedProgress;
    });
  }, []);

  const addCustomLesson = useCallback((lesson: Lesson) => {
    setCustomLessons(prev => {
      const existingIndex = prev.findIndex(l => l.id === lesson.id);
      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = lesson;
      } else {
        updated = [lesson, ...prev];
      }
      localStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateCustomLesson = useCallback((id: string, updates: Partial<Lesson>) => {
    setCustomLessons(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, ...updates } : l);
      localStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteCustomLesson = useCallback((id: string) => {
    setCustomLessons(prev => {
      const updated = prev.filter(l => l.id !== id);
      localStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(updated));
      return updated;
    });
    // Also cleanup progress
    setLessonProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[id];
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
      return newProgress;
    });
  }, []);

  const collectBackupData = useCallback(() => ({
    timestamp: Date.now(),
    history: savedSessions,
    vocab: vocabList,
    customLessons: customLessons,
    progress: lessonProgress
  }), [savedSessions, vocabList, customLessons, lessonProgress]);

  const restoreBackupData = useCallback((data: any) => {
    if (data.history && data.vocab && data.customLessons && data.progress) {
      
      // 1. Merge History (Unique by ID)
      setSavedSessions(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newSessions = (data.history as SavedSession[]).filter(s => !existingIds.has(s.id));
        const merged = [...newSessions, ...prev].sort((a, b) => b.timestamp - a.timestamp);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });

      // 2. Merge Vocabulary (Smart Merge: Max count, Max timestamp)
      setVocabList(prev => {
        const vocabMap = new Map<string, VocabularyItem>();
        prev.forEach(v => vocabMap.set(`${v.text}-${v.language}`, v));
        
        (data.vocab as VocabularyItem[]).forEach(v => {
            const key = `${v.text}-${v.language}`;
            const existing = vocabMap.get(key);
            if (existing) {
                vocabMap.set(key, {
                    ...existing,
                    count: Math.max(existing.count, v.count),
                    lastSeen: Math.max(existing.lastSeen, v.lastSeen)
                });
            } else {
                vocabMap.set(key, v);
            }
        });

        const merged = Array.from(vocabMap.values()).sort((a, b) => b.count - a.count);
        localStorage.setItem(VOCAB_KEY, JSON.stringify(merged));
        return merged;
      });

      // 3. Merge Custom Lessons (Imported updates overwrite local if ID matches)
      setCustomLessons(prev => {
          const lessonMap = new Map<string, Lesson>();
          prev.forEach(l => lessonMap.set(l.id, l));
          
          (data.customLessons as Lesson[]).forEach(l => lessonMap.set(l.id, l));
          
          const merged = Array.from(lessonMap.values());
          localStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(merged));
          return merged;
      });

      // 4. Merge Progress (Smart Merge: Latest Study Time wins)
      setLessonProgress(prev => {
          const merged = { ...prev };
          const importedProgress = data.progress as Record<string, LessonProgress>;
          
          Object.values(importedProgress).forEach(p => {
              const existing = merged[p.lessonId];
              if (!existing) {
                  merged[p.lessonId] = p;
              } else {
                  // Keep the record with the most recent study time
                  if (p.lastStudied > existing.lastStudied) {
                      merged[p.lessonId] = p;
                  }
              }
          });
          localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));
          return merged;
      });

      return true;
    }
    return false;
  }, []);

  return {
    savedSessions,
    vocabList,
    customLessons,
    lessonProgress,
    addSession,
    deleteSession,
    updateVocabulary,
    updateSRS,
    addCustomLesson,
    updateCustomLesson,
    deleteCustomLesson,
    collectBackupData,
    restoreBackupData
  };
};
