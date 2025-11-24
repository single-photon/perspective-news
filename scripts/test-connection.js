import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (process.env.GEMINI_API_KEY) console.log("Found GEMINI_API_KEY");
if (process.env.API_KEY) console.log("Found API_KEY");

if (!apiKey) {
    console.error("❌ API_KEY not found!");
    process.exit(1);
}

console.log(`✅ Using key starting with: ${apiKey.substring(0, 4)}...`);

const ai = new GoogleGenAI({ apiKey });

async function test() {
    try {
        console.log("Testing basic generation...");
        const model = 'gemini-2.5-flash-preview-09-2025';
        const response = await ai.models.generateContent({
            model,
            contents: "Say hello world",
        });
        console.log("✅ Success! Response:", response.text);
    } catch (error) {
        console.error("❌ Failed:", error);
        if (error.response) {
            console.error("Response details:", JSON.stringify(error.response, null, 2));
        }
    }
}

test();
