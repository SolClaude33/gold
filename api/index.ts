import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/static';
import { createServer } from 'http';

// Create Express app
const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Initialize routes
let httpServer: any;
let routesInitialized = false;

async function initializeApp() {
  if (routesInitialized) return;
  
  httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  
  // Error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
  });
  
  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    serveStatic(app);
  }
  
  routesInitialized = true;
}

// Vercel serverless function handler
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  await initializeApp();
  
  // Use Express app to handle the request
  return new Promise<void>((resolve) => {
    app(req as any, res as any, () => {
      resolve();
    });
  });
}
