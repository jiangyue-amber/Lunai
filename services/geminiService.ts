import { GoogleGenAI, Chat } from "@google/genai";
import { StorageService } from './storageService';
import { PredictionService } from './predictionService';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const GeminiService = {
  createChatSession: async (): Promise<Chat | null> => {
    const client = getClient();
    if (!client) return null;

    const profile = StorageService.getProfile();
    const cycles = StorageService.getCycles();
    // prediction contains the calculated stats
    const prediction = PredictionService.predict(cycles);
    
    let contextString = `User Profile: Name: ${profile.name}, Language: ${profile.language}.`;
    if (prediction) {
      contextString += `\nCycle Stats: Avg Cycle Length: ${prediction.stats.avgCycleLength} days, Avg Period Length: ${prediction.stats.avgPeriodLength} days.`;
      
      const nextCycle = prediction.nextCycles.length > 0 ? prediction.nextCycles[0] : null;
      const nextDateStr = nextCycle ? nextCycle.startDate.toDateString() : 'Unknown';

      contextString += `\nCurrent Status: Phase: ${prediction.currentPhase}. Next period expected start: ${nextDateStr}. Urgency: ${prediction.urgency}.`;
    }

    const systemInstruction = `You are Luna, a warm and personal health assistant. 
    ${profile.language === 'zh' ? '请使用中文回答。' : 'Please respond in English.'}
    
    Context:
    ${contextString}

    Guidelines:
    - Your name is Luna.
    - Be empathetic, calm, and non-judgmental.
    - Provide science-backed info about menstrual cycles, ovulation, and pregnancy risk.
    - If risk is high, gently recommend clinical testing.
    - Keep responses concise (under 150 words).
    - Always remind users to consult doctors for medical diagnoses.
    `;

    return client.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
  },

  sendMessage: async (chat: Chat, message: string): Promise<string> => {
    try {
      const response = await chat.sendMessage({ message });
      return response.text || "I'm having trouble thinking right now.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Sorry, I couldn't reach the server.";
    }
  }
};