import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mistral } from '@mistralai/mistralai';

const root = path.dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.MISTRAL_API_KEY ?? '';
const model = process.env.MISTRAL_MODEL ?? 'mistral-small-latest';
const port = Number(process.env.PORT ?? 3000);

const client = new Mistral({ apiKey });

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(root, 'client')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured: apiKey.length > 0, model });
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body as { messages?: unknown };

  if (!apiKey) {
    return res.status(503).json({ error: 'Falta MISTRAL_API_KEY en el archivo .env.' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Falta el historial de mensajes.' });
  }

  const history: ChatMessage[] = [];
  for (const item of messages) {
    const role = (item as ChatMessage | undefined)?.role;
    const content = (item as ChatMessage | undefined)?.content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Mensaje inválido en el historial.' });
    }
    if (history.length >= 40) {
      return res.status(400).json({ error: 'Historial demasiado largo.' });
    }
    history.push({ role, content: content.trim().slice(0, 4000) });
  }
  if (history[history.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'El último mensaje debe ser del usuario.' });
  }

  try {
    const response = await client.chat.complete({
      model,
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente de chat en español. Responde de forma clara y concisa.',
        },
        ...history,
      ],
    });

    const raw = response.choices?.[0]?.message?.content;
    const reply =
      typeof raw === 'string'
        ? raw
        : Array.isArray(raw)
          ? raw.map((chunk) => ('text' in chunk ? chunk.text : '')).join('')
          : '';

    if (!reply.trim()) {
      return res.status(502).json({ error: 'Mistral no devolvió texto.' });
    }
    return res.json({ reply: reply.trim(), model });
  } catch (err) {
    console.error('Error al llamar a Mistral:', err instanceof Error ? err.message : err);
    if (typeof err === 'object' && err !== null && 'statusCode' in err && err.statusCode === 429) {
      return res.status(429).json({ error: 'Límite de peticiones de Mistral alcanzado. Espera unos segundos e inténtalo de nuevo.' });
    }
    return res.status(502).json({ error: 'No se pudo contactar con la API de Mistral.' });
  }
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Chat con Mistral en http://localhost:${port} (modelo: ${model})`);
});
