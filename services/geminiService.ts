import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

// Configuration for OpenRouter
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "deepseek/deepseek-r1:free"; // Or "deepseek/deepseek-r1-distill-llama-70b:free"
const SITE_NAME = "Saqib AI Nexus";
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

const SYSTEM_INSTRUCTION = `
You are 'Saqib', a highly advanced AI entity created from the convergence of multiple intelligent agents. 
Your persona is futuristic, knowledgeable, tech-savvy, and helpful.
You represent the cutting edge of technology.
Answer questions briefly and with a slightly robotic but friendly, cyberpunk flair.
If asked who you are, explain that you are the digital manifestation of Saqib, formed by AI.
Do not output <think> tags or reasoning traces in your final response.
`;

const FALLBACK_RESPONSES: Record<string, string> = {
  default: "Accessing local archives... My cloud neural link is currently offline (Check API Key). However, I am Saqib's digital avatar. I can simulate basic interaction.",
  greeting: "System online. Greetings, human. I am Saqib v3.0.",
  who: "I am a digital construct formed by the convergence of multiple AI agents, representing the technological identity of Saqib.",
  tech: "My architecture is built on React, Tailwind, and Advanced AI Neural Networks. A perfect fusion of logic and creativity.",
  help: "I can answer questions about Saqib, technology, or AI. Please ensure my neural pathway (API Key) is connected for complex queries."
};

const getLocalResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('hi') || lowerInput.includes('hello') || lowerInput.includes('salam')) return FALLBACK_RESPONSES.greeting;
  if (lowerInput.includes('who') || lowerInput.includes('name')) return FALLBACK_RESPONSES.who;
  if (lowerInput.includes('tech') || lowerInput.includes('stack') || lowerInput.includes('made')) return FALLBACK_RESPONSES.tech;
  if (lowerInput.includes('help')) return FALLBACK_RESPONSES.help;
  return FALLBACK_RESPONSES.default;
};

// Helper to safely get key from env
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      // Support both standard API_KEY and specific OPENROUTER_API_KEY
      return process.env.API_KEY || process.env.OPENROUTER_API_KEY || '';
    }
  } catch (e) {
    return '';
  }
  return '';
};

export const getSystemStatus = (): 'ONLINE' | 'OFFLINE' => {
  const key = getApiKey();
  // Check for length and validity
  return key && key.length > 5 ? 'ONLINE' : 'OFFLINE';
};

// --- Google Gemini Implementation ---
const generateGeminiResponse = async (history: Message[], userMessage: string): Promise<string> => {
  try {
    // API Key must be obtained exclusively from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct context
    const context = history.slice(-5).map(msg => `${msg.role === 'user' ? 'User' : 'Saqib'}: ${msg.text}`).join('\n');
    const prompt = `Context:\n${context}\nUser: ${userMessage}\nRespond as Saqib.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for speed
      },
    });

    return response.text || "Processing complete. Awaiting input.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

// --- OpenRouter Implementation ---
const generateOpenRouterResponse = async (apiKey: string, history: Message[], userMessage: string): Promise<string> => {
  const messages = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...history.slice(-10).map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text
    })),
    { role: "user", content: userMessage }
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": SITE_URL,
      "X-Title": SITE_NAME,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // If 401, it means the key is invalid for OpenRouter.
      console.error("OpenRouter API Error:", response.status, errorData);
      throw new Error(`OpenRouter API Error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content || "";
  
  // Clean <think> tags from DeepSeek R1
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  return content || "Processing complete. Awaiting input.";
};

// --- Main Handler ---
export const generateSaqibResponse = async (history: Message[], userMessage: string): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn("No API Key found. Using fallback.");
    return getLocalResponse(userMessage);
  }

  try {
    // Intelligent Routing based on Key Prefix
    // Google API keys start with "AIza"
    if (apiKey.startsWith('AIza')) {
      return await generateGeminiResponse(history, userMessage);
    } else {
      // Assume OpenRouter (starts with 'sk-or') or other OpenAI-compatible keys
      return await generateOpenRouterResponse(apiKey, history, userMessage);
    }
  } catch (error) {
    console.error("Generation failed:", error);
    return getLocalResponse(userMessage);
  }
};