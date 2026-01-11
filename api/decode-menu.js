import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

let genAI = null;

export default async function handler(req, res) {
    // Initialize Gemini lazily
    if (!genAI) {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (apiKey) {
            genAI = new GoogleGenerativeAI(apiKey);
        } else {
            console.error("❌ GOOGLE_API_KEY is missing from environment variables.");
        }
    }

    // 1. Unified Request Handling (Standard Request vs Express)
    const method = req.method || 'POST';
    const body = req.json ? await req.json() : req.body;

    // helper to send response
    const send = async (data, status = 200) => {
        if (res && res.status) {
            return res.status(status).json(data);
        }
        return new Response(JSON.stringify(data), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    };

    // CORS & Options
    if (res && res.setHeader) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (method === 'OPTIONS') {
        if (res && res.status) return res.status(200).end();
        return new Response(null, { status: 200 });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        if (!genAI) {
            throw new Error("Gemini API Key not configured in environment.");
        }

        const { image, language = "English" } = req.body; // Default to English
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        console.log(`📸 Image received. Language: ${language}`);

        const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

        const schema = {
            description: "List of menu items",
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    dish: { type: SchemaType.STRING, description: "Name of the dish", nullable: false },
                    price: { type: SchemaType.STRING, description: "Price including currency", nullable: false },
                    description: { type: SchemaType.STRING, description: "Brief tasty description", nullable: false },
                },
                required: ["dish", "price", "description"],
            },
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json", responseSchema: schema },
        });

        const prompt = `Decode this menu image into a JSON list. Translate descriptions into ${language}.`;
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
        ]);

        const menuItems = JSON.parse(result.response.text());
        console.log(`✅ Decoded ${menuItems.length} items.`);

        // Image Generation Model
        const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

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

                return { ...item, image: imageUrl };
            } catch (imageError) {
                console.error(`Failed to generate image for ${item.dish}:`, imageError);
                return { ...item, image: null, error: imageError.message };
            }
        });

        const results = await Promise.all(itemPromises);

        const searchErrors = results.filter(r => r.error).map(r => r.error);
        const hasImages = results.some(r => r.image);

        res.status(200).json({
            results,
            searchWarning: !hasImages && searchErrors.length > 0 ? searchErrors[0] : null
        });

    } catch (error) {
        console.error("Serverless Function Error:", error);
        res.status(500).json({ error: "Processing failed: " + error.message });
    }
}
