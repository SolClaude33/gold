import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
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
let initPromise: Promise<void> | null = null;

async function initializeApp() {
  if (routesInitialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      // Dynamically import routes module
      // Vercel should include server/ files via vercel.json includeFiles
      if (!registerRoutes) {
        try {
          // Try without extension first (most common in Vercel)
          const routesModule = await import('../server/routes');
          registerRoutes = routesModule.registerRoutes;
          console.log('[Vercel] Successfully loaded routes module');
        } catch (e1: any) {
          try {
            // Fallback to .js extension
            const routesModule = await import('../server/routes.js');
            registerRoutes = routesModule.registerRoutes;
            console.log('[Vercel] Successfully loaded routes module (.js)');
          } catch (e2: any) {
            try {
              // Fallback to .ts extension
              const routesModule = await import('../server/routes.ts');
              registerRoutes = routesModule.registerRoutes;
              console.log('[Vercel] Successfully loaded routes module (.ts)');
            } catch (e3: any) {
              console.error('[Vercel] Failed to import routes:', {
                e1: e1?.message,
                e2: e2?.message,
                e3: e3?.message,
                cwd: process.cwd()
              });
              throw new Error(`Cannot load routes module: ${e3?.message || String(e3)}`);
            }
          }
        }
      }
      
      httpServer = createServer(app);
      await registerRoutes(httpServer, app);
      
      // Error handler
      app.use((err: any, _req: any, res: any, _next: any) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || 'Internal Server Error';
        if (!res.headersSent) {
          res.status(status).json({ message });
        }
      });
      
      routesInitialized = true;
    } catch (error) {
      console.error('Failed to initialize app:', error);
      throw error;
    }
  })();
  
  return initPromise;
}

// Vercel serverless function handler
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    await initializeApp();
    
    // Use Express app to handle the request
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(504).json({ error: 'Request timeout' });
        }
        resolve();
      }, 10000); // 10 second timeout
      
      app(req as any, res as any, (err: any) => {
        clearTimeout(timeout);
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
