import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, GenerateContentResponse } from "@google/genai";
import { NewsItem, NewsStyle } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper: Wait function
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Retry wrapper
const retryWithBackoff = async <T>(
  fn: () => Promise<T>, 
  retries = 2, 
  delay = 4000 // Increased to 4 seconds to clear 429 blocks
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    console.warn(`API Attempt Failed: ${error.status || error.code} - ${error.message}`);
    
    const isServerOverload = error?.status === 503 || error?.code === 503;
    // 429 = Quota Exceeded. We wait longer for this.
    const isQuota = error?.status === 429 || error?.code === 429 || error?.message?.includes('429');

    if ((isServerOverload || isQuota) && retries > 0) {
      console.log(`Quota/Server limit hit. Retrying in ${delay}ms...`);
      await wait(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

// Safety Settings
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Helper to clean markdown code blocks from string
const cleanJsonString = (text: string): string => {
  if (!text) return '[]';
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) return match[1].trim();
  
  // Fallback: find first [ and last ]
  const startIndex = text.indexOf('[');
  const endIndex = text.lastIndexOf(']');
  if (startIndex !== -1 && endIndex !== -1) return text.substring(startIndex, endIndex + 1);
  
  return text.trim();
};

export const fetchTopStories = async (): Promise<NewsItem[]> => {
  console.log("Fetching live news (6 Stories)...");
  const model = 'gemini-2.5-flash';
  
  // OPTIMIZATION: Single call to Search AND Format.
  const prompt = `
    Task: Find 6 major trending US news headlines from the last 24 hours using Google Search.
    
    CRITICAL OUTPUT INSTRUCTIONS:
    1. Use the Google Search tool to find the stories.
    2. Output the results STRICTLY as a valid JSON array.
    3. Do NOT output any conversational text, markdown, or explanations. JUST the JSON array.
    
    JSON Structure:
    [
      {
        "headline": "Story Headline",
        "summary": "Brief summary (40-50 words)",
        "originalSource": "News Source Name",
        "publishedTime": "e.g. '2 hours ago'"
      }
    ]
  `;

  const response: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      safetySettings: SAFETY_SETTINGS,
      maxOutputTokens: 5000, // Increased limit to ensure 6 stories fit
    }
  }));

  const resultText = response.text;
  
  if (!resultText) {
    console.error("Empty response candidates:", JSON.stringify(response.candidates));
    throw new Error("API returned empty response. Usage limit may be reached.");
  }

  let data;
  try {
    data = JSON.parse(cleanJsonString(resultText));
  } catch (e) {
    console.error("JSON Parse Failed. Raw:", resultText);
    throw new Error("Failed to parse news data. The API might be returning unstructured text.");
  }
  
  if (!Array.isArray(data) || data.length === 0) throw new Error("No stories found in response.");

  // Slice to 6 items
  return data.map((item: any, index: number) => ({
    id: `story-${Date.now()}-${index}`,
    headline: item.headline || "News Alert",
    content: item.summary || item.content || "Summary unavailable.",
    originalSource: item.originalSource || 'News Wire',
    publishedTime: item.publishedTime || 'Today',
  })).slice(0, 6);
};

export const rewriteStories = async (stories: NewsItem[], style: NewsStyle): Promise<NewsItem[]> => {
  if (style === NewsStyle.NEUTRAL) return stories;

  const model = 'gemini-2.5-flash';
  const prompt = `
    Rewrite these news stories in the style of: "${style}".
    Style Guide: "${getStyleDescription(style)}".
    Input: ${JSON.stringify(stories.map(s => ({ headline: s.headline, summary: s.content })))}
  `;

  const response: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["headline", "content"]
        }
      },
      safetySettings: SAFETY_SETTINGS,
      maxOutputTokens: 5000, // Increased limit
    }
  }));

  const newData = JSON.parse(response.text || '[]');
  return stories.map((original, index) => {
      const rewritten = newData[index];
      return {
          ...original,
          headline: rewritten?.headline || original.headline,
          content: rewritten?.content || original.content,
          originalSource: original.originalSource
      };
  });
};

const getStyleDescription = (style: NewsStyle) => {
    switch(style) {
        case NewsStyle.LEFT: return "Progressive perspective, focus on systemic issues";
        case NewsStyle.RIGHT: return "Conservative perspective, focus on tradition/liberty";
        case NewsStyle.SATIRE: return "Exaggerated, ironic, funny (The Onion style)";
        case NewsStyle.FICTION: return "100-word flash fiction story";
        case NewsStyle.ELI12: return "Simple language for a 12-year-old";
        default: return "Objective facts";
    }
};