import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

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
        // Try multiple import strategies with file existence checks
        const possiblePaths = [
          path.resolve(__dirname, '..', 'server', 'routes.ts'),
          path.resolve(__dirname, '..', 'server', 'routes.js'),
          path.resolve(process.cwd(), 'server', 'routes.ts'),
          path.resolve(process.cwd(), 'server', 'routes.js'),
          path.resolve(__dirname, 'server', 'routes.ts'),
          path.resolve(__dirname, 'server', 'routes.js'),
        ];
        
        console.log('[Vercel] Checking for routes file...');
        console.log('[Vercel] Debug paths:', {
          cwd: process.cwd(),
          __dirname,
          possiblePaths: possiblePaths.map(p => ({ path: p, exists: existsSync(p) }))
        });
        
        // First try relative imports (most reliable)
        const relativeImports = [
          '../server/routes',
          '../server/routes.js',
          './server/routes',
          './server/routes.js',
        ];
        
        let lastError: any = null;
        for (const importPath of relativeImports) {
          try {
            const routesModule = await import(importPath);
            if (routesModule && routesModule.registerRoutes) {
              registerRoutes = routesModule.registerRoutes;
              console.log(`[Vercel] Successfully loaded routes from: ${importPath}`);
              break;
            }
          } catch (e: any) {
            lastError = e;
            console.log(`[Vercel] Failed to import from ${importPath}:`, e?.message || String(e));
          }
        }
        
        // If relative imports failed, try absolute paths with file:// protocol
        if (!registerRoutes) {
          for (const filePath of possiblePaths) {
            if (existsSync(filePath)) {
              try {
                const fileUrl = `file://${filePath}`;
                const routesModule = await import(fileUrl);
                if (routesModule && routesModule.registerRoutes) {
                  registerRoutes = routesModule.registerRoutes;
                  console.log(`[Vercel] Successfully loaded routes from absolute path: ${filePath}`);
                  break;
                }
              } catch (e: any) {
                lastError = e;
                console.log(`[Vercel] Failed to import from ${filePath}:`, e?.message || String(e));
              }
            }
          }
        }
        
        if (!registerRoutes) {
          console.error('[Vercel] All import attempts failed. Last error:', lastError);
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
