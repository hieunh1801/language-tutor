
import React, { useState, useEffect, useRef } from 'react';
import { AppState, SavedSession, Lesson, LessonLevel, LessonType, LessonTone, TargetLanguage, Sender } from './types';
import { generateLessonContent, explainGrammar } from './services/geminiService';
import { ZeroService } from './services/zeroService';
import { sampleLessons } from './data/sampleLessons';
import { Loader2 } from 'lucide-react';
import { NativeLanguage, t } from './data/languages';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useTTS } from './hooks/useTTS';
import { useAppData } from './hooks/useAppData';
import { useGameState } from './hooks/useGameState';

// Component Imports
import { Dashboard } from './components/screens/Dashboard';
import { ActiveLesson } from './components/screens/ActiveLesson';
import { LessonCompletion } from './components/screens/LessonCompletion';
import { ReadMode } from './components/screens/ReadMode'; 
import { CreateLessonModal } from './components/modals/CreateLessonModal';
import { GrammarModal } from './components/modals/GrammarModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { VocabModal } from './components/modals/VocabModal';
import { StatsModal } from './components/modals/StatsModal';
import { BackupModal } from './components/modals/BackupModal';
import { LessonPreviewModal } from './components/modals/LessonPreviewModal';
import { EditLessonModal } from './components/modals/EditLessonModal';
import { ConfirmModal } from './components/modals/ConfirmModal';

const TARGET_LANG_KEY = 'korean_app_target_lang_v1';

const App: React.FC = () => {
  // --- Global State ---
  const nativeLang: NativeLanguage = 'vi';
  
  // Target Language
  const [targetLang, setTargetLang] = useState<TargetLanguage>(() => {
    try {
      return (localStorage.getItem(TARGET_LANG_KEY) as TargetLanguage) || 'ko';
    } catch {
      return 'ko';
    }
  });

  useEffect(() => {
    localStorage.setItem(TARGET_LANG_KEY, targetLang);
  }, [targetLang]);

  const [appState, setAppState] = useState<AppState>(AppState.INTRO);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGeneratingLib, setIsGeneratingLib] = useState(false);

  // --- Custom Hooks ---
  const { theme, toggleTheme } = useTheme();
  const { playAudio } = useTTS();
  
  const { 
    savedSessions, vocabList, customLessons, lessonProgress,
    addSession, deleteSession, updateVocabulary, updateSRS,
    addCustomLesson, updateCustomLesson, deleteCustomLesson,
    collectBackupData, restoreBackupData
  } = useAppData();

  const {
    config, messages, conversationPlan, currentTurnIndex, currentLessonId,
    setConfig, setConversationPlan, initializeLesson, restartLesson, advanceTurn, loadHistorySession
  } = useGameState();

  // --- UI/Modal State ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  // Grammar State
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationText, setExplanationText] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  // Cloud Service
  const cloudService = useRef(new ZeroService());

  // --- Handlers: Lesson Flow ---

  const handleStartPractice = () => {
    if (!selectedLesson) return;
    initializeLesson(selectedLesson, nativeLang);
    setSelectedLesson(null);
    setAppState(AppState.ACTIVE);
  };

  const handleStartReading = () => {
    if (!selectedLesson) return;
    // Manual config for Reading mode
    setConfig({ 
      topic: selectedLesson.topic, 
      difficulty: selectedLesson.level as any,
      tone: selectedLesson.tone,
      nativeLang, 
      targetLang: selectedLesson.language,
      lessonType: selectedLesson.type || 'Conversation' 
    });
    setConversationPlan(selectedLesson.turns);
    // Hack: set current lesson ID manually since we aren't using initializeLesson
    // Note: In a cleaner world, initializeLesson would handle this too, 
    // but we want to jump straight to READING state without setting messages.
    // We'll just piggyback on useGameState's internal state setters exposed.
    // OR better: let's just use the useGameState config which is exposed.
    
    setAppState(AppState.READING);
    setSelectedLesson(null);
  };

  const handleRestartLesson = () => {
    restartLesson();
    setAppState(AppState.ACTIVE);
  };

  const handlePuzzleComplete = (userSentence: string) => {
    const { isComplete, currentWords } = advanceTurn(userSentence);
    updateVocabulary(currentWords, config?.targetLang || 'ko');

    if (isComplete) {
      // Save Session
      addSession({
        id: Date.now().toString(),
        timestamp: Date.now(),
        topic: config!.topic,
        difficulty: config!.difficulty,
        targetLang: config!.targetLang,
        lessonType: config!.lessonType,
        messages: [...messages, { id: 'final', sender: Sender.USER, text: userSentence }], // Include final msg for history
        turns: conversationPlan
      });
      
      // Update SRS
      if (currentLessonId) {
        updateSRS(currentLessonId);
      }
      setAppState(AppState.COMPLETED);
    }
  };

  const handlePlayAudioWrapper = (text: string) => {
    playAudio(text, targetLang);
  };

  const handleExplain = async (text: string) => {
    setExplanationText('');
    setIsExplaining(true);
    setShowExplanation(true);
    try {
        const explanation = await explainGrammar(text, targetLang, nativeLang);
        setExplanationText(explanation);
    } catch (e) {
        setExplanationText("Lỗi kết nối AI hoặc lỗi hệ thống.");
    } finally {
        setIsExplaining(false);
    }
  };

  // --- Handlers: Data Management ---

  const handleGenerateLesson = async (
    topic: string, 
    level: LessonLevel, 
    lengthDescription: string, 
    type: LessonType, 
    tone: LessonTone
  ) => {
    setIsGeneratingLib(true);
    setErrorMsg(null);
    try {
      const content = await generateLessonContent(topic, level, targetLang, nativeLang, lengthDescription, type, tone);
      const newLesson: Lesson = {
        id: crypto.randomUUID(),
        language: targetLang,
        type: type,
        title: content.title,
        description: content.description,
        level: level,
        tone: tone,
        topic: topic,
        turns: content.turns
      };
      addCustomLesson(newLesson);
      setShowCreateModal(false);
      alert(`${t(nativeLang, 'success_gen')}: "${content.title}"`);
    } catch (e) {
      console.error(e);
      setErrorMsg(t(nativeLang, 'error_gen') + " (Lỗi hệ thống AI)");
    } finally {
      setIsGeneratingLib(false);
    }
  };

  const processImportedLessonData = (importedData: any) => {
     if (importedData && typeof importedData === 'object' && Array.isArray(importedData.turns)) {
        let detectedType: LessonType = importedData.type;
        if (!detectedType && importedData.turns.length > 0) {
            const firstTurn = importedData.turns[0];
            if (!firstTurn.question || firstTurn.question.trim() === '') {
                detectedType = 'Reading';
            } else {
                detectedType = 'Conversation';
            }
        }

        const newLesson: Lesson = {
            id: importedData.id || crypto.randomUUID(),
            language: importedData.language || targetLang,
            type: detectedType || 'Conversation',
            title: importedData.title || 'Imported Lesson',
            description: importedData.description || 'No description',
            level: importedData.level || 'Level 1',
            tone: importedData.tone || 'Standard',
            topic: importedData.topic || importedData.title || 'General',
            turns: importedData.turns
        };
        
        addCustomLesson(newLesson);
        setShowCreateModal(false);
        alert(`Imported: "${newLesson.title}" (${newLesson.type === 'Reading' ? 'Bài đọc' : 'Hội thoại'})`);
     } else {
        console.error("Invalid Import Data", importedData);
        throw new Error("Invalid file structure: 'turns' array is missing.");
     }
  };

  const handleImportLesson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedData = JSON.parse(text);
        processImportedLessonData(importedData);
      } catch (err) {
        console.error(err);
        setErrorMsg(t(nativeLang, 'error_import'));
      }
    };
    reader.readAsText(file);
  };

  const handleImportJson = (jsonString: string) => {
    try {
        const importedData = JSON.parse(jsonString);
        processImportedLessonData(importedData);
    } catch (err) {
        console.error(err);
        alert(t(nativeLang, 'error_import'));
    }
  };

  // --- Handlers: Backup ---

  const handleExportBackup = () => {
    const backupData = collectBackupData();
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-tutor-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const data = JSON.parse(text);
              if (restoreBackupData(data)) {
                  alert(t(nativeLang, 'success_import'));
                  setShowBackup(false);
              } else {
                  alert(t(nativeLang, 'error_import'));
              }
          } catch (err) {
              console.error(err);
              alert(t(nativeLang, 'error_import'));
          }
      };
      reader.readAsText(file);
  };

  const handleCloudUpload = async (): Promise<string> => {
      const data = collectBackupData();
      return await cloudService.current.upload(data);
  };

  const handleCloudDownload = async (url: string): Promise<void> => {
      const data = await cloudService.current.download(url);
      if (!restoreBackupData(data)) {
           throw new Error("Dữ liệu tải về không hợp lệ");
      }
  };

  // --- Handlers: Misc ---

  const handleViewHistory = (session: SavedSession) => {
    loadHistorySession(session, nativeLang);
    setAppState(AppState.COMPLETED);
    setShowHistory(false);
  };

  const confirmDelete = () => {
    if (lessonToDelete) {
        deleteCustomLesson(lessonToDelete);
        setLessonToDelete(null);
    }
  };

  const handleEditLesson = (e: React.MouseEvent, lesson: Lesson) => {
    e.stopPropagation();
    setEditingLesson(lesson);
  };

  const handleDeleteLesson = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setLessonToDelete(id);
  };

  // --- Derived Data for Dashboard ---
  const allLessons = [...customLessons, ...sampleLessons].filter(l => {
     const lLang = l.language || 'ko';
     return lLang === targetLang;
  });

  const suggestionList = allLessons
    .filter(lesson => {
      const prog = lessonProgress[lesson.id];
      if (!prog) return false; 
      return Date.now() >= prog.nextReview;
    })
    .sort((a, b) => lessonProgress[a.id].nextReview - lessonProgress[b.id].nextReview);

  const libraryList = allLessons.filter(lesson => !suggestionList.find(s => s.id === lesson.id));
  const customLessonIds = customLessons.map(l => l.id);

  const getReadingLesson = (): Lesson => {
      // Reconstruct a lesson object for ReadMode
      return {
          id: currentLessonId || 'temp-id',
          language: config?.targetLang || 'ko',
          type: config?.lessonType || 'Conversation',
          title: config?.topic || '',
          description: 'Review',
          level: config?.difficulty || 'Level 1',
          tone: config?.tone,
          topic: config?.topic || '',
          turns: conversationPlan
      };
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 flex justify-center overflow-hidden font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 h-full flex flex-col relative shadow-2xl transition-colors duration-200">
        
        {/* --- MODALS --- */}
        
        <CreateLessonModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)}
          onGenerate={handleGenerateLesson}
          isGenerating={isGeneratingLib}
          onImport={handleImportLesson}
          onImportJson={handleImportJson}
          nativeLang={nativeLang}
          targetLang={targetLang}
        />

        <HistoryModal 
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          sessions={savedSessions}
          onView={handleViewHistory}
          onDelete={(e, id) => deleteSession(id)}
        />

        <VocabModal 
          isOpen={showVocab}
          onClose={() => setShowVocab(false)}
          vocabList={vocabList.filter(v => v.language === targetLang)}
        />

        <StatsModal 
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          sessions={savedSessions}
          vocabList={vocabList}
          progress={lessonProgress}
          allLessons={allLessons}
        />

        <BackupModal
          isOpen={showBackup}
          onClose={() => setShowBackup(false)}
          onExport={handleExportBackup}
          onImport={handleImportBackup}
          onCloudUpload={handleCloudUpload}
          onCloudDownload={handleCloudDownload}
          nativeLang={nativeLang}
        />

        <GrammarModal 
          isOpen={showExplanation} 
          onClose={() => setShowExplanation(false)}
          isLoading={isExplaining}
          text={explanationText}
        />

        <LessonPreviewModal 
            isOpen={!!selectedLesson}
            onClose={() => setSelectedLesson(null)}
            lesson={selectedLesson}
            onPractice={handleStartPractice}
            onRead={handleStartReading}
            nativeLang={nativeLang}
        />

        <EditLessonModal 
            isOpen={!!editingLesson}
            onClose={() => setEditingLesson(null)}
            lesson={editingLesson}
            onSave={updateCustomLesson}
            nativeLang={nativeLang}
        />

        <ConfirmModal 
            isOpen={!!lessonToDelete}
            onClose={() => setLessonToDelete(null)}
            onConfirm={confirmDelete}
            title={t(nativeLang, 'confirm_delete_title')}
            message={t(nativeLang, 'delete_confirm')}
            cancelText={t(nativeLang, 'cancel_btn')}
            confirmText={t(nativeLang, 'delete_btn')}
        />

        {/* --- SCREENS --- */}

        {appState === AppState.LOADING && (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center dark:text-white">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t(nativeLang, 'generating')}</h2>
          </div>
        )}

        {(appState === AppState.INTRO || appState === AppState.ERROR) && (
          <Dashboard 
            suggestionList={suggestionList}
            libraryList={libraryList}
            lessonProgress={lessonProgress}
            errorMsg={errorMsg}
            historyCount={savedSessions.length}
            vocabCount={vocabList.filter(v => v.language === targetLang).length}
            nativeLang={nativeLang}
            targetLang={targetLang}
            theme={theme}
            customLessonIds={customLessonIds}
            onToggleTheme={toggleTheme}
            onStartLesson={(lesson) => setSelectedLesson(lesson)}
            onCreateClick={() => setShowCreateModal(true)}
            onDeleteLesson={handleDeleteLesson}
            onEditLesson={handleEditLesson}
            onOpenHistory={() => setShowHistory(true)}
            onOpenVocab={() => setShowVocab(true)}
            onOpenStats={() => setShowStats(true)}
            onOpenBackup={() => setShowBackup(true)}
            onSetTargetLang={setTargetLang}
          />
        )}

        {appState === AppState.ACTIVE && config && (
          <ActiveLesson 
            config={config}
            messages={messages}
            currentPuzzle={conversationPlan[currentTurnIndex]}
            currentTurnIndex={currentTurnIndex}
            totalTurns={conversationPlan.length}
            onExit={() => setAppState(AppState.INTRO)}
            onPlayAudio={handlePlayAudioWrapper}
            onExplain={handleExplain}
            onPuzzleComplete={handlePuzzleComplete}
          />
        )}
        
        {appState === AppState.READING && (
           <ReadMode 
                lesson={getReadingLesson()}
                onExit={() => setAppState(AppState.INTRO)}
                nativeLang={nativeLang}
           />
        )}

        {appState === AppState.COMPLETED && config && (
          <LessonCompletion 
            topic={config.topic}
            messages={messages}
            isReviewMode={messages === savedSessions.find(s => s.messages === messages)?.messages}
            nextReviewDays={currentLessonId && lessonProgress[currentLessonId] 
              ? Math.ceil((lessonProgress[currentLessonId].nextReview - Date.now()) / (1000 * 60 * 60 * 24))
              : undefined
            }
            onPlayAudio={handlePlayAudioWrapper}
            onHome={() => {
              setAppState(AppState.INTRO);
              setShowHistory(false);
            }}
            onReviewVocab={() => {
              setAppState(AppState.INTRO);
              setShowVocab(true);
            }}
            onRestart={conversationPlan.length > 0 ? handleRestartLesson : undefined}
            nativeLang={nativeLang}
          />
        )}

      </div>
    </div>
  );
};

export default App;