import vision from '@google-cloud/vision';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import process from 'process';

// Load env vars from .env and .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

// Initialize Vision Client
let visionConfig = {};

if (process.env.GOOGLE_CLOUD_VISION_CREDENTIALS && process.env.GOOGLE_CLOUD_VISION_CREDENTIALS.startsWith('{')) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_CLOUD_VISION_CREDENTIALS);
        visionConfig.credentials = credentials;
    } catch (e) {
        console.error("Failed to parse GOOGLE_CLOUD_VISION_CREDENTIALS", e);
    }
} else {
    // Fallback to file check or skip if it's an API Key (handled by REST fallback)
    const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
    visionConfig.keyFilename = serviceAccountPath;
}

const client = new vision.ImageAnnotatorClient(visionConfig);

const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_KEY || process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || process.env.SEARCH_ENGINE_ID;

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
        const { image } = req.body; // Expecting base64 string
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        console.log("📸 Received Base64 image for decoding...");

        // Remove header if present (e.g., "data:image/jpeg;base64,")
        const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Image, 'base64');

        let rawLines = [];

        try {
            // Priority 1: Try REST API using standard API Key (Simplest setup)
            if (GOOGLE_API_KEY && !GOOGLE_API_KEY.includes('YOUR_')) {
                try {
                    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;
                    const payload = {
                        requests: [{
                            image: { content: base64Image },
                            features: [{ type: 'TEXT_DETECTION' }]
                        }]
                    };
                    const response = await axios.post(visionUrl, payload);
                    const annotations = response.data.responses?.[0]?.textAnnotations;

                    if (annotations && annotations.length) {
                        rawLines = annotations[0].description.split('\n');
                    } else if (response.data.responses?.[0]?.error) {
                        throw new Error(response.data.responses[0].error.message);
                    }
                } catch (restError) {
                    throw restError; // Pass to outer catch for Priority 2
                }
            } else {
                throw new Error("No API Key found");
            }
        } catch (error) {
            console.warn("⚠️ API Key method failed, trying Service Account fallback...", error.message);

            // Priority 2: Fallback to official client (Service Account)
            try {
                const [result] = await client.textDetection(buffer);
                const detections = result.textAnnotations;
                if (detections && detections.length) {
                    rawLines = detections[0].description.split('\n');
                }
            } catch (visionError) {
                console.error("❌ All Google Vision methods failed.");
                return res.status(500).json({
                    error: `Google Vision API Error: ${visionError.message}. Ensure your GOOGLE_API_KEY is correct or service-account.json is valid.`
                });
            }
        }

        if (!rawLines.length) {
            rawLines = ["MENU", "Spaghetti Carbonara - $14.50", "Tiramisu - $7.00"];
        }

        // Filtering Logic
        const menuItems = rawLines.filter(line => {
            const cleanLine = line.trim();
            if (cleanLine.length < 4) return false;
            if (/^\d+$/.test(cleanLine)) return false;
            if (cleanLine.includes('$') || cleanLine.includes('€') || cleanLine.includes('£')) return false;
            if (/^ethers|^starters|^mains|^desserts|^drinks|^menu$/i.test(cleanLine)) return false;
            return true;
        });

        const limitedItems = menuItems.slice(0, 5);
        console.log(`🔍 Searching for: ${limitedItems.join(', ')}`);

        const results = await Promise.all(limitedItems.map(async (item) => {
            if (!GOOGLE_API_KEY || GOOGLE_API_KEY.includes('YOUR_')) {
                throw new Error("Missing Google Custom Search API Key (GOOGLE_API_KEY)");
            }
            if (!SEARCH_ENGINE_ID || SEARCH_ENGINE_ID.includes('YOUR_')) {
                throw new Error("Missing Google Custom Search Engine ID (GOOGLE_CUSTOM_SEARCH_ENGINE_ID)");
            }

            try {
                const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(item)}&cx=${SEARCH_ENGINE_ID}&key=${GOOGLE_API_KEY}&searchType=image&num=1`;
                const response = await axios.get(searchUrl);

                const imageUrl = response.data.items?.[0]?.link || null;
                return { dish: item, image: imageUrl };
            } catch (err) {
                console.error(`Error searching for ${item}:`, err.response?.data?.error?.message || err.message);
                return { dish: item, image: null, error: err.response?.data?.error?.message || err.message };
            }
        }));

        const searchErrors = results.filter(r => r.error).map(r => r.error);
        const hasImages = results.some(r => r.image);

        res.status(200).json({
            results,
            searchWarning: !hasImages && searchErrors.length > 0 ? searchErrors[0] : null
        });

    } catch (error) {
        console.error("Serverless Function Error:", error);
        res.status(500).json({ error: "Processing failed" });
    }
}
