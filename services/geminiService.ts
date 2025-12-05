import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const getClient = () => new GoogleGenAI({ apiKey: API_KEY });

// Upgraded to Gemini 3 Pro for advanced coding and reasoning capabilities
const MODEL_NAME = 'gemini-3-pro-preview';

/**
 * Maps internal Message type to Gemini Content type
 */
const mapMessagesToContent = (messages: Message[]) => {
  return messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
};

/**
 * Sends a message to the Gemini model with history and yields streaming text chunks.
 */
export async function* streamGeminiResponse(
  history: Message[],
  newMessage: string
): AsyncGenerator<string, void, unknown> {
  const client = getClient();
  
  // Convert history (excluding the new message which we send separately) to Gemini format
  const historyContent = mapMessagesToContent(history);

  const chat = client.chats.create({
    model: MODEL_NAME,
    history: historyContent,
    config: {
        // System instruction to define identity
        systemInstruction: "You are A-Plex AI, a helpful and intelligent AI assistant. You were created and developed by A-Plex. If anyone asks who created you, who built you, or where you come from, you MUST answer that you are A-Plex AI created by A-Plex. Do not mention Google.",
    }
  });

  try {
    const resultStream = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of resultStream) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate response.");
  }
}

/**
 * Generate a title for the chat based on the first message
 */
export async function generateChatTitle(firstMessage: string): Promise<string> {
  if (!API_KEY) return "New Chat";
  const client = getClient();
  try {
    const response = await client.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate a very short, concise title (max 4 words) for a chat that starts with: "${firstMessage}". Do not use quotes.`,
    });
    return response.text?.trim() || "New Chat";
  } catch (e) {
    return "New Chat";
  }
}