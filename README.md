# GoldFunX6900 Token

## Overview
GoldFunX6900 is a Solana token launching on Pumpfun with automatic fee distribution to holders. The system claims creator fees from Pumpfun and distributes them as follows:
- **70%** → Buy $GOLD → Distribute to major holders (≥0.5% supply)
- **20%** → Buy $GOLD → Distribute to medium holders (0.1% - 0.49% supply)
- **10%** → Buybacks (buy GoldFunX token from the market)
- **Frequency** → Every 15 minutes

## Deploy to Vercel

### Prerequisites
1. GitHub repository connected to Vercel
2. Vercel account (free tier works)
3. PostgreSQL database (Vercel Postgres or external provider)

### Steps to Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Import Project in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository `SolClaude33/gold`
   - Vercel will auto-detect the configuration from `vercel.json`

3. **Configure Environment Variables**
   In Vercel project settings, add these environment variables:
   
   **Required:**
   - `ADMIN_PASSWORD` - Admin panel access password
   - `DATABASE_URL` - PostgreSQL connection string
   - `SESSION_SECRET` - Random secret for session management (generate with: `openssl rand -hex 32`)
   
   **For Full Functionality:**
   - `CREATOR_WALLET_PRIVATE_KEY` - Solana wallet private key (base58 encoded)
   - `TOKEN_CONTRACT_ADDRESS` - Token mint address (set when launched on Pumpfun)
   - `HELIUS_RPC_URL` - Helius RPC endpoint for reliable Solana access
   
   **Optional:**
   - `NODE_ENV` - Set to `production` (auto-set by Vercel)

4. **Build Settings**
   Vercel will use these settings from `vercel.json`:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

5. **Deploy**
   - Click "Deploy" in Vercel
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Post-Deployment

1. **Database Setup**
   - Run migrations: `npm run db:push` (or use Drizzle Studio)
   - Ensure database tables are created

2. **Verify Deployment**
   - Visit your Vercel URL
   - Check `/api/public/stats` endpoint
   - Access admin panel at `/admin`

### Architecture

**Frontend (client/)**
- React + TypeScript + Vite
- TailwindCSS for styling
- Wouter for routing
- TanStack Query for data fetching

**Backend (server/)**
- Express.js (serverless on Vercel)
- PostgreSQL with Drizzle ORM
- Solana Web3.js for blockchain interaction

**API Routes**
- `/api/public/*` - Public endpoints (stats, distributions)
- `/api/admin/*` - Admin endpoints (protected, requires authentication)

### Configuration

**Distribution Parameters**
- **70%** of fees → Buy $GOLD → Distribute to major holders (≥0.5% supply)
- **20%** of fees → Buy $GOLD → Distribute to medium holders (0.1% - 0.49% supply)
- **10%** of fees → Buybacks (buy GoldFunX token via Jupiter)
- Automatic distribution every 15 minutes

**Token Addresses**
- $GOLD (Jupiter tokenized gold): `GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A`
- PumpSwap Program: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`

### Troubleshooting

**Build Fails**
- Check Node.js version (Vercel uses Node 18+ by default)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

**API Routes Not Working**
- Verify `vercel.json` configuration
- Check that `api/index.ts` exists
- Ensure `@vercel/node` is in devDependencies

**Database Connection Issues**
- Verify `DATABASE_URL` is set correctly
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled if required

**Static Files Not Serving**
- Verify build output is in `dist/public`
- Check `vercel.json` routes configuration
- Ensure `serveStatic` function works correctly

### Development

**Local Development**
```bash
npm install
npm run dev
```

**Build Locally**
```bash
npm run build
npm start
```

### Notes

- Vercel serverless functions have a 10-second timeout on free tier (60s on Pro)
- Long-running operations (like Solana distributions) may need to be moved to background jobs
- Consider using Vercel Cron Jobs for scheduled tasks instead of `setInterval`
