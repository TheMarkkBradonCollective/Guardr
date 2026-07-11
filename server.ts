import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createApiApp } from './server/createApp';

dotenv.config();

const app = createApiApp();
const PORT = Number(process.env.PORT) || 3000;

async function configureServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Serve static marketing/download pages (public/download, public/marketing)
    // before Vite's SPA fallback, so directory requests like `/download/`
    // resolve to their own index.html instead of the app shell — matching
    // how Vercel serves these in production.
    app.use(express.static(path.join(process.cwd(), 'public')));
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Guardr server listening at http://0.0.0.0:${PORT}`);
  });
}

configureServer();
