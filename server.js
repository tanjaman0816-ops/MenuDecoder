import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './api/decode-menu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

const app = express();
const port = 3000;

// Increase payload size for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Mock Vercel handler behavior
app.post('/api/decode-menu', async (req, res) => {
    // Vercel handlers usually take (req, res) directly
    // This handler already sets its own headers and handles the response
    await handler(req, res);
});

app.listen(port, () => {
    console.log(`🚀 Local bridge (API) running at http://localhost:${port}`);
    console.log(`📡 Bridging Frontend -> API`);
});
