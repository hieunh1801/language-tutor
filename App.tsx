
import React, { useState, useEffect, useRef } from 'react';
import { AppState, ChatMessage, Sender, PuzzleData, ConversationConfig, SavedSession, VocabularyItem, Lesson, LessonProgress, LessonType, LessonLevel, LessonTone } from './types';
import { generateLessonContent, explainGrammar } from './services/geminiService';
import { GoogleDriveService } from './services/googleDriveService';
import { sampleLessons } from './data/sampleLessons';
import { Loader2 } from 'lucide-react';
import { NativeLanguage, TargetLanguage, t, TARGET_LANGUAGES } from './data/languages';

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

const STORAGE_KEY = 'korean_app_history_v1';
const VOCAB_KEY = 'korean_app_vocab_v1';
const CUSTOM_LESSONS_KEY = 'korean_app_custom_lessons_v1';
const PROGRESS_KEY = 'korean_app_progress_v1';

const SRS_INTERVALS = [0, 1, 3, 7, 14, 30];

const App: React.FC = () => {
  // Language State - Always Vietnamese for UI
  const nativeLang: NativeLanguage = 'vi';
  const [targetLang, setTargetLang] = useState<TargetLanguage>('ko');

  const [appState, setAppState] = useState<AppState>(AppState.INTRO);
  const [config, setConfig] = useState<ConversationConfig>({ 
    topic: 'Introduction', 
    difficulty: 'Level 1',
    nativeLang: 'vi',
    targetLang: 'ko',
    lessonType: 'Conversation'
  });
  
  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [isGeneratingLib, setIsGeneratingLib] = useState(false);
  
  // New: Preview Modal State
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Data State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Gameplay State
  const [conversationPlan, setConversationPlan] = useState<PuzzleData[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  // Grammar Explain State
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationText, setExplanationText] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  // Drive Service
  const driveService = useRef(new GoogleDriveService());

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

  // Initialize Voices
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleConfigureKey = async () => {
    if (window.aistudio?.openSelectKey) {
        try {
            await window.aistudio.openSelectKey();
            // Clear error message after successful selection (implying user fixed it)
            setErrorMsg(null);
        } catch (e) {
            console.error("Failed to open key selector", e);
        }
    } else {
        alert("Tính năng chọn API Key chỉ khả dụng trong môi trường AI Studio.");
    }
  };

  // --- SRS Logic ---
  const updateLessonProgress = (lessonId: string) => {
    const current = lessonProgress[lessonId] || { 
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
      ...lessonProgress,
      [lessonId]: {
        lessonId,
        srsLevel: newLevel,
        lastStudied: Date.now(),
        nextReview: nextReviewDate,
        reviewCount: current.reviewCount + 1
      }
    };

    setLessonProgress(updatedProgress);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updatedProgress));
  };

  // --- Data Persistence ---
  const saveCurrentSession = (msgs: ChatMessage[]) => {
    const newSession: SavedSession = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      topic: config.topic,
      difficulty: config.difficulty,
      targetLang: config.targetLang,
      lessonType: config.lessonType,
      messages: msgs,
      turns: conversationPlan // Save the plan so we can restart it
    };
    const updatedSessions = [newSession, ...savedSessions];
    setSavedSessions(updatedSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
  };

  const updateVocabulary = (newWords: string[]) => {
    const currentVocab = [...vocabList];
    newWords.forEach(word => {
      const cleanWord = word.replace(/[.,?!;:"'(){}[\]]/g, "").trim();
      if (!cleanWord) return;
      const existingIndex = currentVocab.findIndex(v => v.text === cleanWord && v.language === targetLang);
      if (existingIndex !== -1) {
        currentVocab[existingIndex].count += 1;
        currentVocab[existingIndex].lastSeen = Date.now();
      } else {
        currentVocab.push({ text: cleanWord, count: 1, lastSeen: Date.now(), language: targetLang });
      }
    });
    currentVocab.sort((a, b) => b.count - a.count);
    setVocabList(currentVocab);
    localStorage.setItem(VOCAB_KEY, JSON.stringify(currentVocab));
  };

  const collectBackupData = () => ({
      timestamp: Date.now(),
      history: savedSessions,
      vocab: vocabList,
      customLessons: customLessons,
      progress: lessonProgress
  });

  const restoreBackupData = (data: any) => {
      if (data.history && data.vocab && data.customLessons && data.progress) {
          setSavedSessions(data.history);
          setVocabList(data.vocab);
          setCustomLessons(data.customLessons);
          setLessonProgress(data.progress);

          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.history));
          localStorage.setItem(VOCAB_KEY, JSON.stringify(data.vocab));
          localStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(data.customLessons));
          localStorage.setItem(PROGRESS_KEY, JSON.stringify(data.progress));
          return true;
      }
      return false;
  };

  // --- Backup Handlers ---
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

  const handleDriveUpload = async (clientId: string) => {
      driveService.current.init(clientId);
      const data = collectBackupData();
      await driveService.current.uploadBackup(data);
  };

  const handleDriveDownload = async (clientId: string) => {
      driveService.current.init(clientId);
      const data = await driveService.current.downloadBackup();
      if (restoreBackupData(data)) {
          alert(t(nativeLang, 'success_import'));
          setShowBackup(false);
      } else {
           throw new Error("Dữ liệu từ Drive không hợp lệ");
      }
  };

  // --- Lesson Selection Handlers ---

  // New: Handles clicking a lesson card -> Opens Preview Modal
  const handleSelectLesson = (lesson: Lesson) => {
      setSelectedLesson(lesson);
  };

  // New: Triggered from Preview Modal -> Starts Interactive Mode
  const handleStartPractice = () => {
    if (!selectedLesson) return;
    initializeLesson(selectedLesson);
    setSelectedLesson(null); // Close modal
  };

  // New: Triggered from Preview Modal -> Starts Read/Passive Mode
  const handleStartReading = () => {
      if (!selectedLesson) return;
      // Setup Read Mode
      setCurrentLessonId(selectedLesson.id);
      // Update config for safe keeping, though ReadMode will use the lesson object
      setConfig({ 
        topic: selectedLesson.topic, 
        difficulty: selectedLesson.level as any,
        tone: selectedLesson.tone,
        nativeLang, 
        targetLang: selectedLesson.language,
        lessonType: selectedLesson.type || 'Conversation' 
      });
      
      setConversationPlan(selectedLesson.turns);
      setAppState(AppState.READING);
      setSelectedLesson(null); // Close modal
  };

  const initializeLesson = (lesson: Lesson) => {
    setConfig({ 
        topic: lesson.topic, 
        difficulty: lesson.level,
        tone: lesson.tone,
        nativeLang, 
        targetLang: lesson.language,
        lessonType: lesson.type || 'Conversation' 
    });
    setConversationPlan(lesson.turns);
    setCurrentTurnIndex(0);
    setMessages([]);
    setErrorMsg(null);
    setCurrentLessonId(lesson.id);

    // Initial Message Logic
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
    
    setAppState(AppState.ACTIVE);
  };

  const handleRestartLesson = () => {
      if (!conversationPlan || conversationPlan.length === 0) return;
      
      setCurrentTurnIndex(0);
      setMessages([]);
      setErrorMsg(null);
      
      // Re-initialize logic
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
      
      setAppState(AppState.ACTIVE);
  };

  const handlePuzzleComplete = (userSentence: string) => {
    const currentTurnData = conversationPlan[currentTurnIndex];
    updateVocabulary(currentTurnData.words);

    const userMsg: ChatMessage = {
      id: `msg-user-${currentTurnIndex}`,
      sender: Sender.USER,
      text: userSentence,
      translation: currentTurnData.targetAnswerTranslation
    };
    
    const updatedMessages = [...messages, userMsg];
    const nextIndex = currentTurnIndex + 1;
    
    if (nextIndex < conversationPlan.length) {
      const nextTurnData = conversationPlan[nextIndex];
      
      if (config.lessonType === 'Conversation') {
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
    } else {
      setMessages(updatedMessages);
      saveCurrentSession(updatedMessages);
      if (currentLessonId) {
        updateLessonProgress(currentLessonId);
      }
      setAppState(AppState.COMPLETED);
    }
  };

  // --- Handlers ---

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleDeleteLesson = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isCustom = customLessons.some(l => l.id === id);
    if (!isCustom) return;

    if (window.confirm(t(nativeLang, 'delete_confirm'))) {
      const updated = customLessons.filter(l => l.id !== id);
      setCustomLessons(updated);
      localStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(updated));
      
      const newProgress = { ...lessonProgress };
      delete newProgress[id];
      setLessonProgress(newProgress);
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
    }
  };

  const handleGenerateLesson = async (
    topic: string, 
    level: LessonLevel, 
    lengthDescription: string, 
    type: LessonType, 
    tone: LessonTone
  ) => {
    // Check API Key first
    if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey && window.aistudio.openSelectKey) {
            await window.aistudio.openSelectKey();
            // Wait a tick for env to update
        }
    }

    setIsGeneratingLib(true);
    setErrorMsg(null);
    try {
      // Pass current languages, type, and tone
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
      const updatedCustomLessons = [newLesson, ...customLessons];
      setCustomLessons(updatedCustomLessons);
      localStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(updatedCustomLessons));
      setShowCreateModal(false);
      alert(`${t(nativeLang, 'success_gen')}: "${content.title}"`);
    } catch (e) {
      console.error(e);
      setErrorMsg(t(nativeLang, 'error_gen') + " (Hãy kiểm tra API Key)");
    } finally {
      setIsGeneratingLib(false);
    }
  };

  // Reusable function to process lesson data (from File or String)
  const processImportedLessonData = (importedData: any) => {
     // Validation: Check if object and has turns array
     if (importedData && typeof importedData === 'object' && Array.isArray(importedData.turns)) {
        
        // AUTO-DETECT TYPE logic if 'type' field is missing
        let detectedType: LessonType = importedData.type;
        if (!detectedType && importedData.turns.length > 0) {
            // If the first turn has an empty question, it's likely a Reading lesson
            const firstTurn = importedData.turns[0];
            if (!firstTurn.question || firstTurn.question.trim() === '') {
                detectedType = 'Reading';
            } else {
                detectedType = 'Conversation';
            }
        }

        const newLesson: Lesson = {
            id: importedData.id || crypto.randomUUID(),
            language: importedData.language || targetLang, // Fallback to current app target language
            type: detectedType || 'Conversation',
            title: importedData.title || 'Imported Lesson',
            description: importedData.description || 'No description',
            level: importedData.level || 'Level 1',
            tone: importedData.tone || 'Standard',
            // Use title as fallback if topic is missing (common in raw AI JSON)
            topic: importedData.topic || importedData.title || 'General',
            turns: importedData.turns
        };
        
        const updatedCustomLessons = [...customLessons];
        const existingIndex = updatedCustomLessons.findIndex(l => l.id === newLesson.id);
        if (existingIndex >= 0) {
          updatedCustomLessons[existingIndex] = newLesson;
        } else {
          updatedCustomLessons.push(newLesson);
        }
        setCustomLessons(updatedCustomLessons);
        localStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(updatedCustomLessons));
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

  const handlePlayAudio = (text: string) => {
    // Stop previous audio
    window.speechSynthesis.cancel();

    const targetLangConfig = TARGET_LANGUAGES.find(l => l.code === targetLang);
    const langCode = targetLangConfig?.voice || 'en-US';
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1.0;

    // Advanced Voice Selection
    const voices = window.speechSynthesis.getVoices();
    
    // 1. Filter by language
    const matchingVoices = voices.filter(v => 
        v.lang === langCode || 
        v.lang.replace('_', '-') === langCode || 
        v.lang.startsWith(langCode.split('-')[0])
    );

    // 2. Prioritize "High Quality" voices (Google, Premium, Natural, Microsoft)
    const priorityKeywords = ['Google', 'Premium', 'Enhanced', 'Natural', 'Microsoft'];
    
    let selectedVoice = matchingVoices.find(v => 
        priorityKeywords.some(keyword => v.name.includes(keyword))
    );

    // 3. Fallback to first matching voice if no premium one found
    if (!selectedVoice && matchingVoices.length > 0) {
        selectedVoice = matchingVoices[0];
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleExplain = async (text: string) => {
    // Check Key First
    if (window.aistudio?.hasSelectedApiKey) {
         const hasKey = await window.aistudio.hasSelectedApiKey();
         if (!hasKey) {
             if (window.confirm("Tính năng này cần API Key. Bạn có muốn cấu hình ngay không?")) {
                 await handleConfigureKey();
             } else {
                 return;
             }
         }
    }

    setExplanationText('');
    setIsExplaining(true);
    setShowExplanation(true);
    try {
        const explanation = await explainGrammar(text, targetLang, nativeLang);
        setExplanationText(explanation);
    } catch (e) {
        setExplanationText("Lỗi kết nối AI hoặc chưa có API Key.");
    } finally {
        setIsExplaining(false);
    }
  };

  const handleViewHistory = (session: SavedSession) => {
    setConfig({ 
        topic: session.topic, 
        difficulty: session.difficulty as any,
        nativeLang: nativeLang, 
        targetLang: session.targetLang || 'ko',
        lessonType: session.lessonType || 'Conversation'
    });
    setMessages(session.messages);
    
    // If the session has stored turns (new format), load them so we can restart
    if (session.turns) {
        setConversationPlan(session.turns);
    } else {
        setConversationPlan([]); // Cannot restart legacy sessions safely
    }

    setAppState(AppState.COMPLETED);
    setShowHistory(false);
  };

  // --- Render Helpers ---
  
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

  // Helper to get the lesson object for ReadMode even if selectedLesson is null
  const getReadingLesson = (): Lesson => {
      const found = allLessons.find(l => l.id === currentLessonId);
      if (found) return found;
      
      // Fallback for temporary or imported lessons that might not be in allLessons yet, or simply to be safe
      return {
          id: currentLessonId || 'temp-id',
          language: config.targetLang,
          type: config.lessonType,
          title: config.topic,
          description: 'Review',
          level: config.difficulty,
          tone: config.tone,
          topic: config.topic,
          turns: conversationPlan
      };
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex justify-center overflow-hidden font-sans">
      <div className="w-full max-w-md bg-white h-full flex flex-col relative shadow-2xl">
        
        {/* Modals */}
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
          onDelete={handleDeleteSession}
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
          onDriveUpload={handleDriveUpload}
          onDriveDownload={handleDriveDownload}
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

        {/* Screens */}
        {appState === AppState.LOADING && (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-800 mb-2">{t(nativeLang, 'generating')}</h2>
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
            onStartLesson={handleSelectLesson} // Updated: Opens Preview Modal
            onCreateClick={() => setShowCreateModal(true)}
            onDeleteLesson={handleDeleteLesson}
            onOpenHistory={() => setShowHistory(true)}
            onOpenVocab={() => setShowVocab(true)}
            onOpenStats={() => setShowStats(true)}
            onOpenBackup={() => setShowBackup(true)}
            onSetTargetLang={setTargetLang}
            onConfigureKey={handleConfigureKey}
          />
        )}

        {appState === AppState.ACTIVE && (
          <ActiveLesson 
            config={config}
            messages={messages}
            currentPuzzle={conversationPlan[currentTurnIndex]}
            currentTurnIndex={currentTurnIndex}
            totalTurns={conversationPlan.length}
            onExit={() => setAppState(AppState.INTRO)}
            onPlayAudio={handlePlayAudio}
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

        {appState === AppState.COMPLETED && (
          <LessonCompletion 
            topic={config.topic}
            messages={messages}
            isReviewMode={messages === savedSessions.find(s => s.messages === messages)?.messages}
            nextReviewDays={currentLessonId && lessonProgress[currentLessonId] 
              ? Math.ceil((lessonProgress[currentLessonId].nextReview - Date.now()) / (1000 * 60 * 60 * 24))
              : undefined
            }
            onPlayAudio={handlePlayAudio}
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
