import dotenv from 'dotenv';
import path from 'path';
import process from 'process';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY missing");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Fetching models from:", url.replace(apiKey, "HIDDEN_KEY"));

async function run() {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            console.error(await res.text());
            return;
        }
        const data = await res.json();
        const models = data.models || [];

        console.log("\nAvailable Models:");
        const contentModels = models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"));

        if (contentModels.length === 0) {
            console.log("No models found with 'generateContent' capability.");
            console.log("All models:", models.map(m => m.name));
            return;
        }

        const fs = await import('fs');
        fs.writeFileSync('available_models.json', JSON.stringify(contentModels, null, 2));
        console.log("Written to available_models.json");
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

run();
