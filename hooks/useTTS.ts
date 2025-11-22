
import { useEffect, useCallback } from 'react';
import { TARGET_LANGUAGES, TargetLanguage } from '../data/languages';

export const useTTS = () => {
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const playAudio = useCallback((text: string, targetLang: TargetLanguage) => {
    window.speechSynthesis.cancel();

    const targetLangConfig = TARGET_LANGUAGES.find(l => l.code === targetLang);
    const langCode = targetLangConfig?.voice || 'en-US';
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoices = voices.filter(v => 
        v.lang === langCode || 
        v.lang.replace('_', '-') === langCode || 
        v.lang.startsWith(langCode.split('-')[0])
    );
    
    // Priority logic for better voices
    const priorityKeywords = ['Google', 'Premium', 'Enhanced', 'Natural', 'Microsoft'];
    let selectedVoice = matchingVoices.find(v => 
        priorityKeywords.some(keyword => v.name.includes(keyword))
    );
    
    if (!selectedVoice && matchingVoices.length > 0) {
        selectedVoice = matchingVoices[0];
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  return { playAudio };
};
