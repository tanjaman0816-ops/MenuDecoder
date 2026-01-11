import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

let genAI = null;

/**
 * Netlify Functions v2 Handler
 * Also supports Express via the 'res' argument in our local bridge
 */
export default async function handler(req, resOrContext) {
    // 1. Unified Request Handling
    const method = req.method || 'POST';

    // 2. Parse Body (Netlify v2 provides .json(), Express provides .body)
    let body;
    try {
        body = req.json ? await req.json() : (req.body || {});
    } catch (e) {
        console.error("Failed to parse request body:", e);
        body = {};
    }

    // 3. Environment Variable Initialization (Lazy)
    // Netlify suggests initializing inside the handler for better reliability
    if (!genAI) {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (apiKey) {
            genAI = new GoogleGenerativeAI(apiKey);
        } else {
            console.error("❌ GOOGLE_API_KEY is missing from environment variables.");
        }
    }

    // 4. Helper to send response (CORS included)
    const send = async (data, status = 200) => {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };

        // Express / Local Bridge
        if (resOrContext && typeof resOrContext.status === 'function') {
            return resOrContext.status(status).json(data);
        }

        // Netlify / Standard Response
        return new Response(JSON.stringify(data), { status, headers });
    };

    // 5. CORS / OPTIONS handling
    if (method === 'OPTIONS') {
        if (resOrContext && typeof resOrContext.status === 'function') return resOrContext.status(200).end();
        return new Response(null, {
            status: 200, headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    if (method !== 'POST') {
        return send({ error: 'Method Not Allowed' }, 405);
    }

    try {
        if (!genAI) {
            throw new Error("Gemini API Key not configured in environment.");
        }

        const { image, language = "English" } = body;
        if (!image) {
            return send({ error: 'No image provided' }, 400);
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

                if (!imageUrl) {
                    const blockReason = imageResponse.promptFeedback?.blockReason;
                    const finishReason = imageResponse.candidates?.[0]?.finishReason;
                    console.warn(`⚠️ No image for: ${item.dish} | Block: ${blockReason || 'N/A'} | Finish: ${finishReason || 'N/A'}`);

                    return {
                        ...item,
                        image: null,
                        error: blockReason ? "Content blocked" : "Generation unavailable"
                    };
                }

                return { ...item, image: imageUrl };
            } catch (imageError) {
                console.error(`❌ Global error generating image for ${item.dish}:`, imageError);
                return { ...item, image: null, error: "Generation failed" };
            }
        });

        const results = await Promise.all(itemPromises);
        const hasImages = results.some(r => r.image);

        return send({
            results,
            searchWarning: !hasImages ? "Some images couldn't be generated at this time." : null
        });

    } catch (error) {
        console.error("❌ API handler error:", error);
        return send({ error: error.message || 'Internal Server Error' }, 500);
    }
}
