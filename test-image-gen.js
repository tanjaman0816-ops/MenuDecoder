import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function testGen() {
    try {
        console.log("Using model: gemini-2.5-flash-image");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
        const prompt = "A delicious bowl of spicy Ramen with eggs and pork, gourmet food photography, high resolution, soft lighting";

        console.log("Generating image...");
        const result = await model.generateContent(prompt);
        const response = await result.response;

        console.log("Response received.");
        if (response.candidates && response.candidates[0].content.parts) {
            response.candidates[0].content.parts.forEach((part, i) => {
                if (part.inlineData) {
                    console.log(`Part ${i} is image data! Mime: ${part.inlineData.mimeType}`);
                    fs.writeFileSync(`test-output-${i}.png`, Buffer.from(part.inlineData.data, 'base64'));
                    console.log(`Saved to test-output-${i}.png`);
                } else if (part.text) {
                    console.log(`Part ${i} is text: ${part.text}`);
                }
            });
        } else {
            console.log("No parts found in response.");
            console.log(JSON.stringify(response, null, 2));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testGen();
