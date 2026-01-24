import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
let registerRoutes: any = null;

async function initializeApp() {
  if (routesInitialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      // Dynamically import routes module
      // Vercel should include server/ files via vercel.json includeFiles
      if (!registerRoutes) {
        // Try multiple import strategies
        const importStrategies = [
          // Strategy 1: Relative paths from api/
          () => import('../server/routes'),
          () => import('../server/routes.js'),
          // Strategy 2: Absolute path from process.cwd()
          () => {
            const routesPath = path.resolve(process.cwd(), 'server', 'routes');
            return import(routesPath);
          },
          // Strategy 3: Absolute path from __dirname
          () => {
            const routesPath = path.resolve(__dirname, '..', 'server', 'routes');
            return import(routesPath);
          },
          // Strategy 4: Try from api/server (if files were copied there)
          () => import('./server/routes'),
          () => import('./server/routes.js'),
        ];
        
        let lastError: any = null;
        for (let i = 0; i < importStrategies.length; i++) {
          try {
            const routesModule = await importStrategies[i]();
            if (routesModule && routesModule.registerRoutes) {
              registerRoutes = routesModule.registerRoutes;
              console.log(`[Vercel] Successfully loaded routes using strategy ${i + 1}`);
              break;
            }
          } catch (e: any) {
            lastError = e;
            console.log(`[Vercel] Strategy ${i + 1} failed:`, e?.message || String(e));
          }
        }
        
        if (!registerRoutes) {
          console.error('[Vercel] All import strategies failed. Last error:', lastError);
          console.error('[Vercel] Debug info:', {
            cwd: process.cwd(),
            __dirname,
            __filename
          });
          throw new Error(`Cannot load routes module. Last error: ${lastError?.message || String(lastError)}`);
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
