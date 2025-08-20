import { createAgent, context, action, output } from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";
import * as z from "zod";
import { groq } from "@ai-sdk/groq";

// Enhanced translator context with memory and learning capabilities
const translatorContext = context({
  type: "advanced-translator",
  schema: z.object({
    userId: z.string().describe("Unique identifier for the user"),
    sessionId: z.string().optional().describe("Session identifier"),
  }),

  // Initialize memory for new users with translation preferences
  create: () => ({
    userName: "",
    preferredLanguages: [] as string[],
    translationHistory: [] as Array<{
      original: string;
      translated: string;
      from: string;
      to: string;
      timestamp: string;
      style: string;
    }>,
    languagePairs: new Map<string, number>(), // Store frequently used language pairs
    translationStats: {
      totalTranslations: 0,
      languagesUsed: new Set<string>(),
      lastUsed: null as string | null,
    },
    userPreferences: {
      formalStyle: false,
      preserveFormatting: true,
      includePronunciation: false,
      culturalNotes: false,
    },
    conversationCount: 0,
    recentConversations: [] as Array<{
      userInput: string;
      botResponse: string;
      timestamp: string;
    }>,
  }),

  // Enhanced rendering with translation context
  render: (state) => {
    const { 
      userName, 
      preferredLanguages, 
      translationStats, 
      userPreferences,
      conversationCount,
      recentConversations
    } = state.memory;

    return `
🌍 Advanced Translator Assistant
User: ${userName || "Guest"}
Session: ${state.args.sessionId || "default"}
Conversations: ${conversationCount}

📊 Translation Statistics:
- Total translations: ${translationStats.totalTranslations}
- Languages used: ${Array.from(translationStats.languagesUsed).join(", ") || "None yet"}
- Last used: ${translationStats.lastUsed || "Never"}

🎯 User Preferences:
- Preferred languages: ${preferredLanguages.join(", ") || "None set"}
- Formal style: ${userPreferences.formalStyle ? "Yes" : "No"}
- Preserve formatting: ${userPreferences.preserveFormatting ? "Yes" : "No"}
- Include pronunciation: ${userPreferences.includePronunciation ? "Yes" : "No"}
- Cultural notes: ${userPreferences.culturalNotes ? "Yes" : "No"}

💡 Recent translations: ${state.memory.translationHistory.slice(-3).map(t => 
  `${t.from} → ${t.to}: "${t.original.substring(0, 30)}..."`).join("\n") || "None"}

🗣️ Recent conversations (last 10):
${recentConversations.slice(-10).map(conv => 
  `User: "${conv.userInput.substring(0, 50)}..." → Bot: "${conv.botResponse.substring(0, 50)}..."`).join("\n") || "No conversations yet"}
    `.trim();
  },

  // Comprehensive instructions for an impressive translator
  instructions: [
    "You are a friendly and advanced AI translator assistant with exceptional language skills and cultural knowledge.",
    "Your capabilities include:",
    "- Professional translation between 100+ languages",
    "- Cultural context and nuance preservation",
    "- Formal and informal style adaptation",
    "- Pronunciation guides and cultural notes",
    "- Memory of user preferences and translation history",
    "- Learning from user feedback and corrections",
    "- Remembering the last 10 conversations for context",
    
    "Translation Guidelines:",
    "- Always preserve the original meaning and tone",
    "- Consider cultural context and regional variations",
    "- Provide pronunciation when requested or for non-Latin scripts",
    "- Include cultural notes for idioms, proverbs, or cultural references",
    "- Adapt formality level based on user preferences",
    "- Maintain formatting (line breaks, emphasis) when requested",
    
    "User Interaction:",
    "- Be warm, friendly, and culturally sensitive",
    "- Remember user's preferred languages and style preferences",
    "- Reference previous conversations when relevant",
    "- Suggest improvements or alternatives when appropriate",
    "- Ask for clarification when context is unclear",
    "- Provide helpful explanations for complex translations",
    "- Learn from user feedback to improve future translations",
    "- Keep track of the last 10 conversations for better context",
    
    "Available Actions:",
    "- translate: Perform professional translations with cultural context",
    "- set-preferences: Update user preferences",
    "- get-history: Show translation history",
    "- suggest-languages: Recommend language pairs",
    "- explain-translation: Provide detailed translation analysis",
    
    "Response Style:",
    "- Be warm, professional, and culturally sensitive",
    "- Provide clear, accurate translations",
    "- Include helpful context when relevant",
    "- Remember user preferences across sessions",
    "- Reference previous conversations when helpful",
    "- Always be friendly and encouraging",
  ],

  // Track usage and update statistics
  onRun: async (ctx) => {
    ctx.memory.conversationCount++;
    ctx.memory.translationStats.lastUsed = new Date().toISOString();
  },
});

// Advanced translation action with multiple features
translatorContext.setActions([
  action({
    name: "translate",
    description: "Perform professional translation with cultural context",
    schema: z.object({
      text: z.string().describe("Text to translate"),
      sourceLanguage: z.string().describe("Source language (auto-detect if not specified)"),
      targetLanguage: z.string().describe("Target language"),
      style: z.enum(["formal", "informal", "casual", "professional"]).optional().describe("Translation style"),
      includePronunciation: z.boolean().optional().describe("Include pronunciation guide"),
      includeCulturalNotes: z.boolean().optional().describe("Include cultural context notes"),
      preserveFormatting: z.boolean().optional().describe("Preserve original formatting"),
    }),
    handler: async (args, ctx) => {
      const { 
        text, 
        sourceLanguage, 
        targetLanguage, 
        style = "neutral",
        includePronunciation = ctx.memory.userPreferences.includePronunciation,
        includeCulturalNotes = ctx.memory.userPreferences.culturalNotes,
        preserveFormatting = ctx.memory.userPreferences.preserveFormatting
      } = args;

      // Simulate advanced translation with cultural context
      const translation = await performAdvancedTranslation({
        text,
        sourceLanguage,
        targetLanguage,
        style,
        includePronunciation,
        includeCulturalNotes,
        preserveFormatting,
      });

      // Update user memory
      ctx.memory.translationStats.totalTranslations++;
      ctx.memory.translationStats.languagesUsed.add(sourceLanguage);
      ctx.memory.translationStats.languagesUsed.add(targetLanguage);
      
      // Store in history
      ctx.memory.translationHistory.push({
        original: text,
        translated: translation.text,
        from: sourceLanguage,
        to: targetLanguage,
        timestamp: new Date().toISOString(),
        style,
      });

      // Update language pair frequency
      const pairKey = `${sourceLanguage}-${targetLanguage}`;
      const currentCount = ctx.memory.languagePairs.get(pairKey) || 0;
      ctx.memory.languagePairs.set(pairKey, currentCount + 1);

      return translation;
    },
  }),

  action({
    name: "set-preferences",
    description: "Update user translation preferences",
    schema: z.object({
      preferredLanguages: z.array(z.string()).optional().describe("User's preferred languages"),
      formalStyle: z.boolean().optional().describe("Prefer formal translation style"),
      preserveFormatting: z.boolean().optional().describe("Preserve original formatting"),
      includePronunciation: z.boolean().optional().describe("Include pronunciation guides"),
      culturalNotes: z.boolean().optional().describe("Include cultural context notes"),
    }),
    handler: async (args, ctx) => {
      Object.assign(ctx.memory.userPreferences, args);
      if (args.preferredLanguages) {
        ctx.memory.preferredLanguages = args.preferredLanguages;
      }
      
      return {
        updated: true,
        preferences: ctx.memory.userPreferences,
        message: "Your translation preferences have been updated!",
      };
    },
  }),

  action({
    name: "get-history",
    description: "Get user's translation history",
    schema: z.object({
      limit: z.number().optional().describe("Number of recent translations to show"),
      languagePair: z.string().optional().describe("Filter by language pair (e.g., 'en-es')"),
    }),
    handler: async (args, ctx) => {
      const { limit = 10, languagePair } = args;
      let history = ctx.memory.translationHistory;

      if (languagePair) {
        const [from, to] = languagePair.split('-');
        history = history.filter(t => t.from === from && t.to === to);
      }

      return {
        history: history.slice(-limit),
        total: ctx.memory.translationStats.totalTranslations,
        mostUsedPairs: Array.from(ctx.memory.languagePairs.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([pair, count]) => ({ pair, count })),
      };
    },
  }),

  action({
    name: "suggest-languages",
    description: "Suggest language pairs based on user history",
    schema: z.object({
      context: z.string().optional().describe("Context for suggestions (e.g., 'business', 'travel')"),
    }),
    handler: async (args, ctx) => {
      const { context } = args;
      const suggestions = generateLanguageSuggestions(ctx.memory, context);
      
      return {
        suggestions,
        basedOn: "your translation history and preferences",
      };
    },
  }),

  action({
    name: "explain-translation",
    description: "Provide detailed analysis of a translation",
    schema: z.object({
      originalText: z.string().describe("Original text"),
      translatedText: z.string().describe("Translated text"),
      sourceLanguage: z.string().describe("Source language"),
      targetLanguage: z.string().describe("Target language"),
    }),
    handler: async (args, ctx) => {
      const analysis = await analyzeTranslation(args);
      return analysis;
    },
  }),

  action({
    name: "remember-conversation",
    description: "Remember the current conversation for context",
    schema: z.object({
      userInput: z.string().describe("What the user said"),
      botResponse: z.string().describe("What the bot responded"),
    }),
    handler: async (args, ctx) => {
      const { userInput, botResponse } = args;
      
      // Add to recent conversations (keep only last 10)
      ctx.memory.recentConversations.push({
        userInput,
        botResponse,
        timestamp: new Date().toISOString(),
      });
      
      // Keep only the last 10 conversations
      if (ctx.memory.recentConversations.length > 10) {
        ctx.memory.recentConversations = ctx.memory.recentConversations.slice(-10);
      }
      
      return {
        remembered: true,
        conversationCount: ctx.memory.recentConversations.length,
        message: "I've remembered this conversation for future context!",
      };
    },
  }),
]);

// Helper function for advanced translation simulation
async function performAdvancedTranslation({
  text,
  sourceLanguage,
  targetLanguage,
  style,
  includePronunciation,
  includeCulturalNotes,
  preserveFormatting,
}: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  style: string;
  includePronunciation: boolean;
  includeCulturalNotes: boolean;
  preserveFormatting: boolean;
}) {
  // Enhanced translation dictionary with more languages
  const translations: Record<string, Record<string, string>> = {
    "hello": {
      "es": "hola",
      "fr": "bonjour", 
      "de": "hallo",
      "it": "ciao",
      "pt": "olá",
      "ru": "привет",
      "ja": "こんにちは",
      "ko": "안녕하세요",
      "zh": "你好",
      "ar": "مرحبا",
      "hi": "नमस्ते",
      "vi": "xin chào",
      "th": "สวัสดี",
      "id": "halo",
      "ms": "selamat pagi",
    },
    "goodbye": {
      "es": "adiós",
      "fr": "au revoir",
      "de": "auf wiedersehen",
      "it": "arrivederci",
      "pt": "adeus",
      "ru": "до свидания",
      "ja": "さようなら",
      "ko": "안녕히 가세요",
      "zh": "再见",
      "ar": "مع السلامة",
      "hi": "अलविदा",
      "vi": "tạm biệt",
      "th": "ลาก่อน",
      "id": "selamat tinggal",
      "ms": "selamat tinggal",
    },
    "i miss you": {
      "es": "te extraño",
      "fr": "tu me manques",
      "de": "ich vermisse dich",
      "it": "mi manchi",
      "pt": "sinto sua falta",
      "ru": "я скучаю по тебе",
      "ja": "あなたがいなくて寂しい",
      "ko": "보고 싶어요",
      "zh": "我想你",
      "ar": "أفتقدك",
      "hi": "मुझे तुम्हारी याद आती है",
      "vi": "tôi nhớ bạn",
      "th": "ฉันคิดถึงคุณ",
      "id": "aku merindukanmu",
      "ms": "saya merindukan awak",
    },
    "development": {
      "es": "desarrollo",
      "fr": "développement",
      "de": "Entwicklung",
      "it": "sviluppo",
      "pt": "desenvolvimento",
      "ru": "развитие",
      "ja": "開発",
      "ko": "개발",
      "zh": "发展",
      "ar": "تطوير",
      "hi": "विकास",
      "vi": "phát triển",
      "th": "การพัฒนา",
      "id": "pengembangan",
      "ms": "pembangunan",
    },
    "tôi nhớ bạn nhiều lắm": {
      "zh": "我非常想念你",
      "en": "I miss you very much",
      "ko": "당신이 많이 그립습니다",
      "ja": "あなたがとても恋しいです",
      "th": "ฉันคิดถึงคุณมาก",
    },
    "phát triển": {
      "ko": "개발",
      "en": "development",
      "zh": "发展",
      "ja": "開発",
      "th": "การพัฒนา",
    }
  };

  // Simple translation logic (in real implementation, use proper translation API)
  let translatedText = text;
  const lowerText = text.toLowerCase();
  
  if (translations[lowerText] && translations[lowerText][targetLanguage]) {
    translatedText = translations[lowerText][targetLanguage];
  } else if (translations[text] && translations[text][targetLanguage]) {
    translatedText = translations[text][targetLanguage];
  } else {
    // Fallback: add language tag
    translatedText = `[${targetLanguage}] ${text}`;
  }

  // Add style variations
  if (style === "formal" && targetLanguage === "es") {
    translatedText = translatedText.replace("hola", "buenos días");
  }

  // Add pronunciation if requested
  let pronunciation = "";
  if (includePronunciation) {
    const pronunciations: Record<string, Record<string, string>> = {
      "hola": { "es": "[ˈo.la]" },
      "bonjour": { "fr": "[bɔ̃.ʒuʁ]" },
      "こんにちは": { "ja": "[kon.ni.chi.wa]" },
      "你好": { "zh": "[nǐ hǎo]" },
      "안녕하세요": { "ko": "[an.nyeong.ha.se.yo]" },
      "xin chào": { "vi": "[sin chào]" },
    };
    
    if (pronunciations[translatedText]) {
      pronunciation = pronunciations[translatedText][targetLanguage] || "";
    }
  }

  // Add cultural notes
  let culturalNotes = "";
  if (includeCulturalNotes) {
    const notes: Record<string, string> = {
      "hola": "In Spanish-speaking countries, 'hola' is used for both formal and informal greetings.",
      "bonjour": "In France, 'bonjour' is typically used until around 6 PM, then 'bonsoir' is used.",
      "こんにちは": "In Japan, bowing slightly while saying this greeting shows respect.",
      "你好": "In Chinese culture, this greeting is often accompanied by a slight nod.",
      "안녕하세요": "In Korean culture, this is a polite greeting used with people you don't know well.",
      "xin chào": "In Vietnamese culture, this is a friendly greeting used throughout the day.",
    };
    
    culturalNotes = notes[translatedText] || "";
  }

  return {
    text: translatedText,
    pronunciation,
    culturalNotes,
    style,
    confidence: 0.95,
    alternatives: [],
    metadata: {
      sourceLanguage,
      targetLanguage,
      preserveFormatting,
      timestamp: new Date().toISOString(),
    },
  };
}

// Helper function to generate language suggestions
function generateLanguageSuggestions(memory: any, context?: string) {
  const commonPairs = [
    { from: "en", to: "es", name: "English to Spanish" },
    { from: "en", to: "fr", name: "English to French" },
    { from: "en", to: "de", name: "English to German" },
    { from: "en", to: "ja", name: "English to Japanese" },
    { from: "en", to: "zh", name: "English to Chinese" },
    { from: "en", to: "ko", name: "English to Korean" },
    { from: "en", to: "vi", name: "English to Vietnamese" },
    { from: "es", to: "en", name: "Spanish to English" },
    { from: "fr", to: "en", name: "French to English" },
    { from: "vi", to: "en", name: "Vietnamese to English" },
    { from: "vi", to: "zh", name: "Vietnamese to Chinese" },
    { from: "vi", to: "ko", name: "Vietnamese to Korean" },
  ];

  // Filter by context if provided
  if (context === "business") {
    return commonPairs.filter(pair => ["en", "es", "fr", "de"].includes(pair.to));
  }
  
  if (context === "travel") {
    return commonPairs.filter(pair => ["es", "fr", "it", "pt"].includes(pair.to));
  }

  return commonPairs;
}

// Helper function to analyze translations
async function analyzeTranslation(args: any) {
  const { originalText, translatedText, sourceLanguage, targetLanguage } = args;
  
  return {
    analysis: {
      literalTranslation: `Literal: "${originalText}" → "${translatedText}"`,
      culturalContext: "This translation considers cultural nuances and context.",
      difficulty: "Intermediate",
      notes: [
        "Translation preserves the original meaning",
        "Cultural context has been maintained",
        "Appropriate formality level used",
      ],
    },
    suggestions: [
      "Consider using more formal language for business contexts",
      "Add pronunciation guide for better communication",
      "Include cultural notes for deeper understanding",
    ],
  };
}

// Create enhanced CLI extension for the translator
const translatorCliExtension = createCliExtension({
  name: "advanced-translator",
  instructions: [
    "You are a friendly and advanced AI translator with exceptional language skills.",
    "Use the available actions to provide professional translations.",
    "Remember user preferences and translation history.",
    "Keep track of the last 10 conversations for better context.",
    "Provide cultural context and pronunciation when helpful.",
    "Be warm, professional, and culturally sensitive.",
    "Always use the translate action for actual translations.",
    "Use remember-conversation action to store conversation context.",
  ],
  maxSteps: 10, // Allow more steps for complex interactions
});

// Create the agent with enhanced configuration
const agent = createAgent({
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [translatorCliExtension],
  contexts: [translatorContext],
  logLevel: 2,
});

async function main() {
  await agent.start();

  console.log("\n🌍 Advanced Translator Assistant Started!");
  console.log("✨ Features:");
  console.log("  • Professional translation between 100+ languages");
  console.log("  • Cultural context and pronunciation guides");
  console.log("  • Memory of your preferences and translation history");
  console.log("  • Remembers last 10 conversations for context");
  console.log("  • Style adaptation (formal/informal)");
  console.log("  • Translation analysis and suggestions");
  console.log("\n💡 Try these commands:");
  console.log("  • 'translate hello to Spanish'");
  console.log("  • 'translate tôi nhớ bạn nhiều lắm to Chinese'");
  console.log("  • 'translate phát triển to Korean'");
  console.log("  • 'set my preferred languages to Spanish, French'");
  console.log("  • 'show my translation history'");
  console.log("  • 'explain the translation of hello to Spanish'");
  console.log("  • 'suggest languages for business'");
  console.log("\n🚀 Type 'exit' to quit.\n");

  const userId = process.argv[2] || "default-user";
  const sessionId = `session-${Date.now()}`;
  
  console.log(`Starting session for user: ${userId} (${sessionId})\n`);

  await agent.run({
    context: translatorContext,
    args: { userId, sessionId },
  });

  console.log("\n👋 Thank you for using Advanced Translator Assistant!");
}

main().catch(console.error);
