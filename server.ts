import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import process from 'process';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/api/config', (req, res) => {
    // Priority: 1. USER_GEMINI_KEY (manual override), 2. GEMINI_API_KEY (system/secrets)
    const envKey = process.env.USER_GEMINI_KEY || process.env.GEMINI_API_KEY;
    const key = (envKey && envKey !== "MY_GEMINI_API_KEY" && envKey !== "undefined" && envKey.trim() !== "") 
      ? envKey 
      : null;
    
    res.json({
      GEMINI_API_KEY: key
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
