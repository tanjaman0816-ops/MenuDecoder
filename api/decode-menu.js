import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import process from 'process';

// Load env vars from .env and .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const apiKey = process.env.GOOGLE_API_KEY;

let genAI = null;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
} else {
    console.error("❌ GOOGLE_API_KEY is missing from environment variables.");
}

export default async function handler(req, res) {
    // Enable CORS for local testing/cross-origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        if (!genAI) {
            throw new Error("Gemini API Key not configured.");
        }

        const { image, language = "English" } = req.body; // Default to English
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        console.log(`📸 Received Base64 image for Gemini decoding. Language: ${language}`);

        // Remove header if present
        const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

        // Define strict response schema
        const schema = {
            description: "List of menu items",
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    dish: {
                        type: SchemaType.STRING,
                        description: "Name of the dish",
                        nullable: false,
                    },
                    price: {
                        type: SchemaType.STRING,
                        description: "Price of the dish",
                        nullable: false,
                    },
                    description: {
                        type: SchemaType.STRING,
                        description: "Short appetizing description of the dish",
                        nullable: false,
                    },
                },
                required: ["dish", "price", "description"],
            },
        };

        // Using Gemini 2.5 Flash as confirmed by model list
        const model = genAI.getGenerativeModel({
            model: "models/gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const prompt = `
        Analyze this menu image and identify the dishes listed.
        
        Important: Translate the 'dish' name and 'description' into ${language}.
        If the menu is already in ${language}, keep it as is.
        Ensure the 'price' is captured accurate to the image.
        `;

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/jpeg",
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Structured Response:", text);

        let menuItems = [];
        try {
            menuItems = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", e);
            return res.status(500).json({ error: "Failed to parse menu data from AI" });
        }

        // Add null image placeholders
        const results = menuItems.map(item => ({
            ...item,
            image: null
        }));

        res.status(200).json({ results });

    } catch (error) {
        console.error("Serverless Function Error:", error);
        res.status(500).json({ error: "Processing failed: " + error.message });
    }
}
