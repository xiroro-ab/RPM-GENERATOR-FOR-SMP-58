import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import generateHandler from './api/generate';
import pdfHandler from './api/pdf';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Wrap the Vercel serverless functions for Express
  app.post('/api/generate', async (req, res) => {
    try {
      const protocol = req.protocol || 'http';
      const host = req.headers.host || 'localhost:3000';
      const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);
      
      const fetchReq = new Request(url.href, {
        method: req.method,
        headers: new Headers(req.headers as any),
        body: JSON.stringify(req.body)
      });
      
      const fetchRes = await generateHandler(fetchReq);
      res.status(fetchRes.status);
      fetchRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      if (fetchRes.body) {
        // Stream the response back to Express!
        const reader = fetchRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      } else {
        const text = await fetchRes.text();
        res.send(text);
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/pdf', async (req, res) => {
    await pdfHandler(req, res);
  });
  
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
