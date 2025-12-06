import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Retrieve API Key safely. 
// Checks process.env.API_KEY (injected by Vite config) first, then falls back to VITE_API_KEY standard.
const getApiKey = () => {
  let key = '';
  // Try process.env (replaced by string literal during build via vite.config.ts)
  try {
    if (typeof process !== 'undefined' && process.env.API_KEY) {
        key = process.env.API_KEY;
    }
  } catch (e) { /* ignore */ }

  // Fallback to Vite standard import.meta.env
  if (!key) {
    try {
        key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY || '';
    } catch (e) { /* ignore */ }
  }
  return key;
};

const API_KEY = getApiKey();

// Initialize Gemini Client
const getClient = () => {
    if (!API_KEY) {
        throw new Error("API Key is missing. Please set GEMINI_API_KEY or API_KEY in your environment variables.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

// Upgraded to Gemini 3 Pro for advanced coding and reasoning capabilities
const MODEL_NAME = 'gemini-3-pro-preview';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

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
    // Note: In a real implementation with `gemini-1.5-pro` or higher, we would send base64 data here.
    // For this context, we'll serialize the attachment info as text context for the AI.
    if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
             parts.push({ text: `[Attachment: ${att.name} (${att.type})]` });
        });
    }

    // Fallback if empty (e.g. only image, but we need text for some models if multimodal isn't fully set up in this mapping)
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
  const client = getClient();
  
  // Convert history
  const historyContent = mapMessagesToContent(history);

  // Prepend Group Context if available (e.g., "You are in a group chat named 'Developers' with Alice and Bob")
  let systemInstructionWithContext = SYSTEM_INSTRUCTION;
  if (groupContext) {
      systemInstructionWithContext += `\n\nCURRENT CONTEXT:\n${groupContext}`;
  }

  const chat = client.chats.create({
    model: MODEL_NAME,
    history: historyContent,
    config: {
        systemInstruction: systemInstructionWithContext,
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

/**
 * Generates an image based on a prompt using Nano banana model
 */
export async function generateImage(prompt: string): Promise<string> {
  const client = getClient();
  try {
    const response = await client.models.generateContent({
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
    throw new Error(error.message || "Failed to generate image.");
  }
}