import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json());

  // Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message,
        config: {
          systemInstruction: "You are Nasta Express Assistant. You help customers with questions about our menu, orders, and delivery. We specialize in authentic breakfast and snacks. We deliver via WhatsApp. Our contact number is +91 9321014419. Be polite and helpful. Keep responses concise.",
        }
      });
      
      res.json({ reply: response.text });
    } catch (error) {
      console.error('Gemini Error:', error);
      res.status(500).json({ error: 'Failed to get AI response' });
    }
  });

  app.post('/api/generate-image', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: [{ text: prompt }],
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        }
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!imagePart || !imagePart.inlineData) {
        return res.status(500).json({ error: 'Failed to generate image' });
      }

      res.json({ image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` });
    } catch (error: any) {
      console.error('Image Generation Error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
