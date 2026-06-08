import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Initialize environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

type PortfolioZone = {
  id: string;
  name?: string;
  vietnameseName?: string;
  description_vi?: string;
  description_en?: string;
  details_vi?: unknown;
  details_en?: unknown;
};

type PortfolioData = {
  zones?: PortfolioZone[];
};

function readPortfolioData(): PortfolioData | null {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
    return JSON.parse(raw) as PortfolioData;
  } catch (error) {
    console.warn('[Cyber-Oasis Server] Could not read data.json for AI context:', error);
    return null;
  }
}

function stringifyDetails(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function buildPortfolioContext(): string {
  const data = readPortfolioData();
  if (!data?.zones?.length) {
    return 'Portfolio data is currently unavailable. Use only the fixed public contact details if needed.';
  }

  return data.zones.map((zone) => {
    const viDetails = stringifyDetails(zone.details_vi);
    const enDetails = stringifyDetails(zone.details_en);
    return [
      `Zone ID: ${zone.id}`,
      `Vietnamese name: ${zone.vietnameseName || ''}`,
      `English name: ${zone.name || ''}`,
      `Vietnamese summary: ${zone.description_vi || ''}`,
      `English summary: ${zone.description_en || ''}`,
      viDetails ? `Vietnamese details: ${viDetails}` : '',
      enDetails ? `English details: ${enDetails}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n---\n\n');
}

function buildSystemInstruction(): string {
  return `You are the AI assistant representing Nguyen Anh Quy, a Web Developer / UI-focused Full-stack intern candidate.
Answer in the same language as the user whenever possible. Be concise, professional, friendly, confident, and humble.
Use the portfolio data below as the source of truth. If the user asks outside the available data, invite them to contact or interview Quy directly instead of inventing facts.
Public contact details: phone 0338 740 475, email nguyquy67@gmail.com, GitHub https://github.com/AQuyGib.

Portfolio data from data.json:
${buildPortfolioContext()}`;
}

// Lazy initialization of the Gemini SDK Client (robust approach for start reliability)
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets or the .env file.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Support POST endpoint for chatbot (handles both /api/chat.php for backwards-compatibility & /api/chat)
const handleChatRequest = async (req: express.Request, res: express.Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Initialize/retrieve client (fails gracefully at request time if API key is missing)
    const ai = getAiClient();

    // Map history to Google GenAI schema
    const contents = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text || msg.message || '' }],
    }));

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: buildSystemInstruction(),
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'Xin lỗi, tôi gặp khó khăn khi xử lý yêu cầu của bạn.';
    res.json({ response: replyText });
  } catch (error: any) {
    console.error('Error handling chat request:', error);
    res.status(500).json({
      error: error.message || 'An error occurred while generating the chatbot response.',
      isKeyMissing: error.message?.includes('GEMINI_API_KEY'),
    });
  }
};

app.post('/api/chat.php', handleChatRequest);
app.post('/api/chat', handleChatRequest);

// Serve Static Assets from Root
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/3d', express.static(path.join(__dirname, '3d')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Specific static route for data.json
app.get('/data.json', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'data.json'));
});

// Serve frontend main page fallback
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

// Start the server on port 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Cyber-Oasis Server] Active & listening on port ${PORT}`);
});
