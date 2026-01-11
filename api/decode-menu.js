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

        // Initialize models
        const menuModel = genAI.getGenerativeModel({
            model: "models/gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const imageModel = genAI.getGenerativeModel({
            model: "models/gemini-2.5-flash-image"
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

        const result = await menuModel.generateContent([prompt, imagePart]);
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

        // Generate images for each dish in parallel
        console.log(`Generating images for ${menuItems.length} items...`);
        const itemPromises = menuItems.map(async (item) => {
            try {
                const imagePrompt = `Realistic professional food photography of ${item.dish}: ${item.description}. Gourmet plating, high resolution, soft cinematic lighting, 4k, appetizing.`;
                const imageResult = await imageModel.generateContent(imagePrompt);
                const imageResponse = await imageResult.response;

                let imageUrl = null;
                if (imageResponse.candidates && imageResponse.candidates[0].content.parts) {
                    const imagePart = imageResponse.candidates[0].content.parts.find(p => p.inlineData);
                    if (imagePart) {
                        imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                    }
                }

                if (!imageUrl) {
                    const blockReason = imageResponse.promptFeedback?.blockReason;
                    const finishReason = imageResponse.candidates?.[0]?.finishReason;
                    const safetyRatings = imageResponse.candidates?.[0]?.safetyRatings;

                    console.warn(`⚠️ Image generation failed for: ${item.dish}`);
                    console.warn(`   - Block Reason: ${blockReason || 'N/A'}`);
                    console.warn(`   - Finish Reason: ${finishReason || 'N/A'}`);
                    if (safetyRatings) {
                        console.warn(`   - Safety Ratings: ${JSON.stringify(safetyRatings)}`);
                    }
                    console.warn(`   - Full Model Response: ${JSON.stringify(imageResponse)}`);

                    return {
                        ...item,
                        image: null,
                        error: blockReason ? "Content blocked by safety filters" : "Image generation unavailable"
                    };
                }

                return { ...item, image: imageUrl };
            } catch (imageError) {
                console.error(`❌ Global error generating image for ${item.dish}:`, imageError);
                return {
                    ...item,
                    image: null,
                    error: "Generation failed"
                };
            }
        });

        const results = await Promise.all(itemPromises);

        const hasImages = results.some(r => r.image);

        res.status(200).json({
            results,
            searchWarning: !hasImages ? "Some images couldn't be generated at this time." : null
        });

    } catch (error) {
        console.error("Serverless Function Error:", error);
        res.status(500).json({ error: "Processing failed: " + error.message });
    }
}
