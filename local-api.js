import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import handler from './api/decode-menu.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Higher limit for images

// Route to the serverless function handler
app.post('/api/decode-menu', async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`🌉 Local Bridge running at http://localhost:${PORT}`);
    console.log(`📡 Endpoint ready: POST /api/decode-menu`);
});
