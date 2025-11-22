
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PuzzleData, LessonType, LessonLevel, LessonTone } from "../types";
import { NativeLanguage, TargetLanguage, TARGET_LANGUAGES } from "../data/languages";

// Fallback API Key if process.env.API_KEY is not set. 
// Users can manually set this if not using the environment variable injection.
const DEFAULT_API_KEY = "";

// Helper to get AI instance with the latest key
const getAI = () => {
  const apiKey = process.env.API_KEY || DEFAULT_API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing in process.env and DEFAULT_API_KEY is empty");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

// Define the schema for a single turn
const turnSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: "For Conversation: The teacher's question. For Reading: Leave EMPTY string." },
    questionTranslation: { type: Type.STRING, description: "Translation of the question in Vietnamese (or empty for Reading)." },
    targetAnswer: { type: Type.STRING, description: "The sentence the student needs to construct (Answer or Story Sentence)." },
    targetAnswerTranslation: { type: Type.STRING, description: "Translation of the targetAnswer in Vietnamese." },
    words: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "The targetAnswer split into logical distinct words/particles. Punctuation MUST be attached to the preceding word."
    }
  },
  required: ["question", "questionTranslation", "targetAnswer", "targetAnswerTranslation", "words"]
};

// Define the schema for the entire plan (Array of turns)
const planSchema: Schema = {
  type: Type.ARRAY,
  items: turnSchema,
  description: "A list of sentences/turns representing a full lesson."
};

// Schema for a full lesson including metadata
const lessonContentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["Conversation", "Reading"], description: "The type of lesson generated." },
    title: { type: Type.STRING, description: "A creative and short title for the lesson in Vietnamese." },
    description: { type: Type.STRING, description: "A short description of what will be learned (1 sentence) in Vietnamese." },
    turns: planSchema
  },
  required: ["title", "description", "turns", "type"]
};

export const JSON_FORMAT_INSTRUCTION = `
IMPORTANT: You must output PURE JSON only. Do not wrap in markdown code blocks.
The JSON structure must be:
{
  "type": "Reading" OR "Conversation",
  "title": "Vietnamese Title",
  "description": "Vietnamese Description",
  "turns": [
    {
      "question": "Target Language Question (or empty string if Reading)",
      "questionTranslation": "Vietnamese Translation (or empty string if Reading)",
      "targetAnswer": "Target Language Sentence",
      "targetAnswerTranslation": "Vietnamese Translation",
      "words": ["Word1", "Word2", "Word3..."]
    }
  ]
}
`;

const getLangName = (code: string) => {
  return TARGET_LANGUAGES.find(l => l.code === code)?.label || code;
};

const getLevelInstructions = (level: LessonLevel) => {
  switch (level) {
    case 'Level 1': return "Absolute Beginner: Use extremely simple grammar, present tense, and very basic vocabulary (survival phrases). Short sentences (3-5 words).";
    case 'Level 2': return "Beginner: Basic daily life sentences. Simple conjunctions. Sentences of 5-8 words.";
    case 'Level 3': return "Pre-Intermediate: Compound sentences, more tenses (past, future). Daily conversation topics.";
    case 'Level 4': return "Intermediate: Complex grammar structures, natural idiomatic expressions. Expressing opinions.";
    case 'Level 5': return "Advanced: Abstract topics, formal language, news/media style. High-level vocabulary.";
    case 'Level 6': return "Master/Native: Extremely natural, nuanced, cultural references, complex sentence structures mimicking native speakers perfectly.";
    default: return "Beginner level.";
  }
};

const getToneInstructions = (tone: LessonTone, lang: TargetLanguage) => {
  switch (tone) {
    case 'Standard': return "Neutral, standard textbook style.";
    case 'Polite': return `Highly formal and polite. (e.g., Korean Honorifics, 'Keigo' for Japanese, 'Nin' 您 for Chinese, Formal English).`;
    case 'Casual': return `Very casual, slang allowed, friendly. (e.g., Banmal for Korean, Casual form for Japan).`;
    case 'Humorous': return "Funny, witty, maybe a bit silly. Make the content entertaining.";
    case 'Emotional': return "Dramatic, expressive, full of adjectives and feelings.";
    default: return "Standard tone.";
  }
};

/**
 * Builds the full prompt string used to generate the lesson.
 * Exported so UI can display/copy it.
 */
export const buildLessonPrompt = (
  topic: string, 
  difficulty: LessonLevel,
  targetLang: TargetLanguage,
  nativeLang: NativeLanguage, 
  lengthDescription: string = "5-7 turns",
  lessonType: LessonType = 'Conversation',
  tone: LessonTone = 'Standard'
): string => {
  
  const targetLangName = getLangName(targetLang);
  const explanationLang = "Vietnamese"; 

  const levelInstruction = getLevelInstructions(difficulty);
  const toneInstruction = getToneInstructions(tone, targetLang);

  let specificInstructions = "";
  
  // CJK Specific Logic for Punctuation
  let punctuationInstruction = "";
  if (targetLang === 'zh' || targetLang === 'ja') {
      punctuationInstruction = `
      CRITICAL FOR ${targetLangName}: 
      - Do NOT split punctuation marks (like 。, ？, ！, ，) into separate tokens.
      - Always attach the punctuation to the preceding character or phrase.
      - Example: ["你好。", "我是", "明。"] is CORRECT.
      - Example: ["你好", "。", "我是", "明", "。"] is WRONG.
      `;
  } else {
      punctuationInstruction = `
      - Punctuation MUST be attached to the preceding word (e.g., ["Hello,", "world!"]).
      `;
  }
  
  if (lessonType === 'Conversation') {
    specificInstructions = `
      Create conversation content (turns) following these rules:
       - The lesson is a dialogue between Teacher and Student.
       - Question: In ${targetLangName}.
       - QuestionTranslation: In ${explanationLang}.
       - TargetAnswer: Natural ${targetLangName} response.
       - TargetAnswerTranslation: In ${explanationLang}.
       - Words: Split the TargetAnswer into logical words/tokens. ${punctuationInstruction}
    `;
  } else {
    // READING MODE
    specificInstructions = `
      Create a short coherent STORY, ARTICLE, or ESSAY about the topic.
      Break the story down into sequential sentences.
      For each sentence (turn):
       - Question: MUST BE AN EMPTY STRING ("").
       - QuestionTranslation: MUST BE AN EMPTY STRING ("").
       - TargetAnswer: The sentence of the story in ${targetLangName}.
       - TargetAnswerTranslation: The translation of that sentence in ${explanationLang}.
       - Words: Split the TargetAnswer into logical words/tokens. ${punctuationInstruction}
       - Ensure the flow of the story is logical from one sentence to the next.
    `;
  }

  return `
    Act as a professional ${targetLangName} language teacher. Create a new ${lessonType} lesson for a Vietnamese student.
    
    Topic: ${topic}.
    Level: ${difficulty} (${levelInstruction}).
    Tone: ${tone} (${toneInstruction}).
    Length: About ${lengthDescription}.

    Requirements:
    1. Create a creative Title in ${explanationLang}.
    2. Create a short Description in ${explanationLang}.
    3. ${specificInstructions}
    4. Ensure the vocabulary matches the requested Level 1-6 rigidly.
  `;
};

export const generateLessonContent = async (
  topic: string, 
  difficulty: LessonLevel,
  targetLang: TargetLanguage,
  nativeLang: NativeLanguage, 
  lengthDescription: string = "5-7 turns",
  lessonType: LessonType = 'Conversation',
  tone: LessonTone = 'Standard'
): Promise<{ title: string, description: string, turns: PuzzleData[], type: LessonType }> => {
  
  // Use the shared builder function
  const contextPrompt = buildLessonPrompt(topic, difficulty, targetLang, nativeLang, lengthDescription, lessonType, tone);
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonContentSchema,
        systemInstruction: `You are a language education engine. Output a Lesson object.`
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text);
    
    // Ensure type is set if missing
    if (!data.type) {
        data.type = lessonType;
    }

    return data as { title: string, description: string, turns: PuzzleData[], type: LessonType };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const explainGrammar = async (
  sentence: string, 
  targetLang: TargetLanguage, 
  nativeLang: NativeLanguage
): Promise<string> => {
  
  const targetLangName = getLangName(targetLang);
  const explanationLang = "Vietnamese";

  const prompt = `
    Act as a ${targetLangName} teacher. Explain the grammar of the following ${targetLangName} sentence to a Vietnamese student concisely (under 150 words) in ${explanationLang}:
    "${sentence}"
    
    Requirements:
    - Analyze particles, sentence endings, and key structures appropriate for ${targetLangName}.
    - Explain why it is used this way in this context.
    - Format clearly with bullet points.
    - OUTPUT MUST BE IN VIETNAMESE.
  `;

  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful grammar teacher. You must speak Vietnamese."
      }
    });

    return response.text || "Không thể giải thích câu này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lỗi kết nối AI hoặc chưa cấu hình API Key.";
  }
};
