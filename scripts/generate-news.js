import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) {
    console.error("Error: GEMINI_API_KEY or API_KEY not found in .env.local");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Types (Re-defined here to avoid importing from .tsx/.ts if there are issues, but we could import)
const NewsStyle = {
    LEFT: 'Left Wing',
    NEUTRAL: 'Neutral',
    RIGHT: 'Right Wing',
    SATIRE: 'Satire',
    ELI12: '12-Year-Old',
    FICTION: 'Micro Fiction'
};

const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Helper: Wait function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Retry wrapper
const retryWithBackoff = async (fn, retries = 3, delay = 4000) => {
    try {
        return await fn();
    } catch (error) {
        console.warn(`API Attempt Failed: ${error.message}`);
        if (error.response) {
            console.warn(`Response: ${JSON.stringify(error.response)}`);
        }
        if (retries > 0) {
            console.log(`Retrying in ${delay}ms...`);
            await wait(delay);
            return retryWithBackoff(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

const cleanJsonString = (text) => {
    if (!text) return '[]';
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) return match[1].trim();
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1) return text.substring(startIndex, endIndex + 1);
    return text.trim();
};

const fetchTopStories = async () => {
    console.log("Fetching live news (6 Stories)...");
    const model = 'gemini-2.5-flash-preview-09-2025';

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

    const response = await retryWithBackoff(() => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            safetySettings: SAFETY_SETTINGS,
            maxOutputTokens: 5000,
        }
    }));

    const resultText = response.text;
    const data = JSON.parse(cleanJsonString(resultText));

    return data.map((item, index) => ({
        id: `story-${Date.now()}-${index}`,
        headline: item.headline || "News Alert",
        content: item.summary || item.content || "Summary unavailable.",
        originalSource: item.originalSource || 'News Wire',
        publishedTime: item.publishedTime || 'Today',
    })).slice(0, 6);
};

const getStyleDescription = (style) => {
    switch (style) {
        case NewsStyle.LEFT: return "Progressive perspective, focus on systemic issues";
        case NewsStyle.RIGHT: return "Conservative perspective, focus on tradition/liberty";
        case NewsStyle.SATIRE: return "Exaggerated, ironic, funny (The Onion style)";
        case NewsStyle.FICTION: return "100-word flash fiction story";
        case NewsStyle.ELI12: return "Simple language for a 12-year-old";
        default: return "Objective facts";
    }
};

const rewriteStories = async (stories, style) => {
    console.log(`Rewriting stories for style: ${style}...`);
    if (style === NewsStyle.NEUTRAL) return stories;

    const model = 'gemini-2.5-flash';
    const prompt = `
    Rewrite these news stories in the style of: "${style}".
    Style Guide: "${getStyleDescription(style)}".
    
    CRITICAL INSTRUCTIONS:
    1. Headlines must be COMPLETE sentences or phrases (minimum 5 words for 12-Year-Old style).
    2. When referring to Donald Trump, use "President Trump" or "President-elect Trump" (he won the 2024 election and will be inaugurated in January 2025). Do NOT use "former president".
    3. Maintain the full meaning and context of the original story.
    4. Output valid JSON only.
    
    Input: ${JSON.stringify(stories.map(s => ({ headline: s.headline, summary: s.content })))}
  `;

    const response = await retryWithBackoff(() => ai.models.generateContent({
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
            maxOutputTokens: 5000,
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

const main = async () => {
    try {
        // 1. Fetch Base Stories
        const rawStories = await fetchTopStories();
        console.log(`Fetched ${rawStories.length} raw stories.`);

        // 2. Generate Variations
        const allStyles = Object.values(NewsStyle);
        const outputData = {};

        for (const style of allStyles) {
            outputData[style] = await rewriteStories(rawStories, style);
            // Add a small delay to avoid hitting rate limits too hard between styles
            await wait(2000);
        }

        // 3. Save to File
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const publicDir = path.join(__dirname, '../public');
        const outputPath = path.join(publicDir, 'news-data.json');

        await fs.writeFile(outputPath, JSON.stringify({
            timestamp: Date.now(),
            stories: outputData
        }, null, 2));

        console.log(`Successfully generated news data at: ${outputPath}`);

    } catch (error) {
        console.error("Failed to generate news:", error);
        process.exit(1);
    }
};

main();
