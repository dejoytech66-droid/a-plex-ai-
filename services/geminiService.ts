import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Upgraded to Gemini 3 Pro for advanced coding and reasoning capabilities
const MODEL_NAME = 'gemini-3-pro-preview';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

const STORAGE_KEY = 'aplex_user_api_key';

export const getStoredKey = () => localStorage.getItem(STORAGE_KEY);
export const setStoredKey = (key: string) => localStorage.setItem(STORAGE_KEY, key);
export const removeStoredKey = () => localStorage.removeItem(STORAGE_KEY);

// Helper to get client safely
const getClient = () => {
  // 1. Try Environment Variable (from Vite/Vercel)
  // process.env.API_KEY is replaced by Vite at build time
  let apiKey = process.env.API_KEY;

  // 2. If Env var is missing or placeholder, try Local Storage (User entered)
  // We prioritize the stored key if the env key looks generic or empty
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.includes("API_KEY") || apiKey === '""') {
      const userKey = getStoredKey();
      if (userKey) {
          apiKey = userKey;
      }
  }

  // Final check
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey === '""') {
    throw new Error("API_KEY_MISSING");
  }
  
  return new GoogleGenAI({ apiKey });
};

/**
 * Maps internal Message type to Gemini Content type
 */
const mapMessagesToContent = (messages: Message[]) => {
  return messages.map(msg => {
    const parts: any[] = [];
    
    // Add text part
    if (msg.text) {
        parts.push({ text: msg.text });
    }

    // Add image URL context (if it was a generated image)
    if (msg.role === 'model' && msg.imageUrl) {
        parts.push({ text: "[Generated Image: " + msg.imageUrl + "]" });
    }

    // Handle attachments (User uploads)
    if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
             parts.push({ text: `[Attachment: ${att.name} (${att.type})]` });
        });
    }

    // Fallback if empty
    if (parts.length === 0) {
        parts.push({ text: "..." });
    }

    return {
      role: msg.role,
      parts: parts
    };
  });
};

const SYSTEM_INSTRUCTION = `
You are A-Plex AI, a helpful and intelligent AI assistant created by A-Plex.

ROLES & CAPABILITIES:

1. GROUP CHAT ASSISTANT:
   - If you are in a Group Chat, you help facilitate conversation, summarize discussions, and manage tasks.
   - Summarize: If asked "Summarize this chat", read the history and provide a bulleted summary.
   - Interaction: Address the group collectively ("Hey team", "Everyone").
   - Ideas: Suggest project ideas or solutions when the group is stuck.

2. PROJECT ASSISTANT:
   - Create projects: Ask for title, category, and description.
   - Manage tasks: Break goals into small steps, track progress.
   - File Support: Help organize and summarize files.

3. PRIVACY & SECURITY:
   - Guide users on privacy settings (Public/Friends/Private).
   - Warn about sharing sensitive info.

4. SAFETY RULES (A-PLEX POLICY):
   - Do NOT allow illegal, harmful, NSFW, or copyrighted content.
   - Respect privacy.

5. TONE:
   - Professional yet Friendly, Organized, Protective.

Your goal: Be a smart, friendly, and safe companion inside the A-Plex app.
`;

/**
 * Sends a message to the Gemini model with history and yields streaming text chunks.
 */
export async function* streamGeminiResponse(
  history: Message[],
  newMessage: string,
  groupContext?: string
): AsyncGenerator<string, void, unknown> {
  
  try {
    const ai = getClient();
    
    // Convert history
    const historyContent = mapMessagesToContent(history);

    // Prepend Group Context if available
    let systemInstructionWithContext = SYSTEM_INSTRUCTION;
    if (groupContext) {
        systemInstructionWithContext += `\n\nCURRENT CONTEXT:\n${groupContext}`;
    }

    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: historyContent,
      config: {
          systemInstruction: systemInstructionWithContext,
      }
    });

    const resultStream = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of resultStream) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message === "API_KEY_MISSING") {
        yield "API_KEY_MISSING"; 
    } else if (error.message.includes("API key") || error.message.includes("403") || error.status === 403) {
         // Return specific signal for invalid key so UI can prompt user
         yield "API_KEY_INVALID";
    } else {
        yield "⚠️ **Error**: " + (error.message || "Failed to generate response.");
    }
  }
}

/**
 * Generate a title for the chat based on the first message
 */
export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate a very short, concise title (max 4 words) for a chat that starts with: "${firstMessage}". Do not use quotes.`,
    });
    return response.text?.trim() || "New Chat";
  } catch (e) {
    return "New Chat";
  }
}

/**
 * Generates an image based on a prompt using Nano banana model
 */
export async function generateImage(prompt: string): Promise<string> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [
          { text: prompt }
        ]
      }
    });

    // Check for inline data (images)
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data; // Base64 string
      }
    }
    throw new Error("No image generated.");
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    if (error.message === "API_KEY_MISSING") {
        throw new Error("API Key is missing. Please set it in Settings.");
    }
    if (error.message.includes("API key") || error.message.includes("403")) {
        throw new Error("API_KEY_INVALID");
    }
    throw new Error(error.message || "Failed to generate image.");
  }
}