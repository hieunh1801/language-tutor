
import { Lesson } from "../types";

export const sampleLessons: Lesson[] = [
  // KOREAN SAMPLES
  {
    id: "kr-sample-1",
    language: "ko",
    type: "Conversation",
    title: "Chào hỏi cơ bản",
    description: "Học cách chào hỏi và giới thiệu tên lần đầu gặp mặt.",
    level: "Beginner",
    topic: "Chào hỏi",
    turns: [
      {
        question: "안녕하세요? 이름이 뭐예요?",
        questionTranslation: "Xin chào? Tên bạn là gì?",
        targetAnswer: "안녕하세요. 저는 투안입니다.",
        targetAnswerTranslation: "Xin chào. Tôi là Tuấn.",
        words: ["안녕하세요.", "저는", "투안", "입니다."]
      },
      {
        question: "투안 씨는 어느 나라 사람이에요?",
        questionTranslation: "Tuấn là người nước nào?",
        targetAnswer: "저는 베트남 사람입니다.",
        targetAnswerTranslation: "Tôi là người Việt Nam.",
        words: ["저는", "베트남", "사람", "입니다."]
      }
    ]
  },
  {
    id: "kr-sample-2",
    language: "ko",
    type: "Conversation",
    title: "Mua sắm tại chợ",
    description: "Hỏi giá cả và mặc cả đơn giản.",
    level: "Beginner",
    topic: "Mua sắm",
    turns: [
      {
        question: "어서 오세요. 무엇을 드릴까요?",
        questionTranslation: "Xin mời vào. Tôi có thể giúp gì cho bạn?",
        targetAnswer: "이 사과 얼마예요?",
        targetAnswerTranslation: "Quả táo này bao nhiêu tiền?",
        words: ["이", "사과", "얼마예요?"]
      },
      {
        question: "한 개에 2,000원이에요.",
        questionTranslation: "Một quả 2,000 won.",
        targetAnswer: "너무 비싸요. 깎아 주세요.",
        targetAnswerTranslation: "Đắt quá. Giảm giá cho tôi đi.",
        words: ["너무", "비싸요.", "깎아", "주세요."]
      }
    ]
  },

  // ENGLISH SAMPLES
  {
    id: "en-sample-1",
    language: "en",
    type: "Conversation",
    title: "Basic Greeting",
    description: "Introduction and basic small talk.",
    level: "Beginner",
    topic: "Introduction",
    turns: [
      {
        question: "Hello! What is your name?",
        questionTranslation: "Xin chào! Tên bạn là gì?",
        targetAnswer: "Hi. My name is John.",
        targetAnswerTranslation: "Chào. Tên tôi là John.",
        words: ["Hi.", "My", "name", "is", "John."]
      },
      {
        question: "Nice to meet you. Where are you from?",
        questionTranslation: "Rất vui được gặp bạn. Bạn đến từ đâu?",
        targetAnswer: "I am from Vietnam.",
        targetAnswerTranslation: "Tôi đến từ Việt Nam.",
        words: ["I", "am", "from", "Vietnam."]
      }
    ]
  },

  // JAPANESE SAMPLES
  {
    id: "jp-sample-1",
    language: "ja",
    type: "Conversation",
    title: "Tự giới thiệu",
    description: "Giới thiệu bản thân bằng tiếng Nhật.",
    level: "Beginner",
    topic: "Jikoshoukai",
    turns: [
      {
        question: "はじめまして。お名前はなんですか？",
        questionTranslation: "Rất vui được gặp. Tên bạn là gì?",
        targetAnswer: "はじめまして。私はミンです。",
        targetAnswerTranslation: "Chào bạn. Tôi là Minh.",
        words: ["はじめまして。", "私は", "ミン", "です。"]
      },
      {
        question: "ご出身はどちらですか？",
        questionTranslation: "Bạn đến từ đâu?",
        targetAnswer: "ベトナムから来ました。",
        targetAnswerTranslation: "Tôi đến từ Việt Nam.",
        words: ["ベトナム", "から", "来ました。"]
      }
    ]
  },

  // CHINESE SAMPLES
  {
    id: "zh-sample-1",
    language: "zh",
    type: "Conversation",
    title: "Làm quen",
    description: "Chào hỏi và hỏi tên bằng tiếng Trung.",
    level: "Beginner",
    topic: "Introduction",
    turns: [
      {
        question: "你好！你叫什么名字？",
        questionTranslation: "Xin chào! Tên bạn là gì?",
        targetAnswer: "你好。我叫明。",
        targetAnswerTranslation: "Chào bạn. Tôi tên là Minh.",
        words: ["你好。", "我", "叫", "明。"]
      },
      {
        question: "很高兴认识你。",
        questionTranslation: "Rất vui được làm quen.",
        targetAnswer: "我也是。",
        targetAnswerTranslation: "Tôi cũng vậy.",
        words: ["我也", "是。"]
      }
    ]
  }
];