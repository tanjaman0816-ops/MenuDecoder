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

if (process.env.GOOGLE_CLOUD_VISION_CREDENTIALS) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_CLOUD_VISION_CREDENTIALS);
        visionConfig.credentials = credentials;
    } catch (e) {
        console.error("Failed to parse GOOGLE_CLOUD_VISION_CREDENTIALS", e);
    }
} else {
    // Fallback to file check
    visionConfig.keyFilename = path.resolve(process.cwd(), 'service-account.json');
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
            // Send Buffer directly to Vision API
            const [result] = await client.textDetection(buffer);
            const detections = result.textAnnotations;
            if (detections && detections.length) {
                rawLines = detections[0].description.split('\n');
            }
        } catch (visionError) {
            console.warn("⚠️ Vision API failed/mocking mode.", visionError.message);
            // Mock data fallback
            rawLines = ["MENU", "Spaghetti Carbonara - $14.50", "Tiramisu - $7.00", "Green Salad - $8.50"];
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
            try {
                if (GOOGLE_API_KEY && GOOGLE_API_KEY.includes('YOUR_')) {
                    // Mock Search
                    return {
                        dish: item,
                        image: `https://placehold.co/400x300/orange/white?text=${encodeURIComponent(item)}`
                    };
                }

                const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(item)}&cx=${SEARCH_ENGINE_ID}&key=${GOOGLE_API_KEY}&searchType=image&num=1`;
                const response = await axios.get(searchUrl);

                const imageUrl = response.data.items?.[0]?.link || null;
                return { dish: item, image: imageUrl };
            } catch (err) {
                console.error(`Error searching for ${item}:`, err.message);
                return { dish: item, image: null };
            }
        }));

        res.status(200).json({ results });

    } catch (error) {
        console.error("Serverless Function Error:", error);
        res.status(500).json({ error: "Processing failed" });
    }
}
