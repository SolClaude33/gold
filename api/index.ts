import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { createServer, type Server } from 'http';
import crypto from 'crypto';
import type { Express, Request, Response, NextFunction } from "express";
import { createPublicClient, http, formatEther, type PublicClient } from "viem";
import { bsc } from "viem/chains";

// ===== CONTRACT CONFIGURATION =====
const TOKEN_ADDRESS = process.env.TOKEN_CONTRACT_ADDRESS;
const TAX_PROCESSOR_ADDRESS = process.env.TAX_PROCESSOR_ADDRESS || null; // Will be read from token contract if not provided

// Token Contract ABI - to read taxProcessor address
const TOKEN_ABI = [
  {
    "type": "function",
    "name": "taxProcessor",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  }
] as const;

// Tax Processor ABI - functions to read accumulated totals
const TAX_PROCESSOR_ABI = [
  {
    "type": "function",
    "name": "totalQuoteAddedToLiquidity",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalTokensAddedToLiquidity",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalQuoteSentToMarketing",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalQuoteSentToFundsRecipient",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lpQuoteBalance",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "marketQuoteBalance",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  }
] as const;

async function getContractData() {
  try {
    // Validate required environment variable
    if (!TOKEN_ADDRESS) {
      throw new Error("TOKEN_CONTRACT_ADDRESS environment variable is required");
    }

    const rpcUrl = process.env.EVM_RPC_URL || "https://bsc-dataseed1.binance.org";
    console.log("[Contract] Initializing viem client for BSC...");
    console.log("[Contract] RPC URL:", rpcUrl);
    console.log("[Contract] Token Address:", TOKEN_ADDRESS);
    
    const publicClient: PublicClient = createPublicClient({
      chain: bsc,
      transport: http(rpcUrl),
    });

    // Step 1: Get taxProcessor address from token contract (or use env var if provided)
    let taxProcessorAddress = TAX_PROCESSOR_ADDRESS;
    
    if (!taxProcessorAddress) {
      console.log("[Contract] Reading taxProcessor from token contract...");
      try {
        taxProcessorAddress = await publicClient.readContract({
          address: TOKEN_ADDRESS as `0x${string}`,
          abi: TOKEN_ABI,
          functionName: "taxProcessor",
        }) as string;
        console.log("[Contract] TaxProcessor address from token:", taxProcessorAddress);
      } catch (error: any) {
        console.error("[Contract] Error reading taxProcessor from token:", error?.message || String(error));
        throw new Error(`Failed to get taxProcessor address: ${error?.message || String(error)}`);
      }
    } else {
      console.log("[Contract] Using TaxProcessor address from env var:", taxProcessorAddress);
    }

    if (!taxProcessorAddress) {
      throw new Error("TaxProcessor address not found");
    }

    // Step 2: Read from tax processor contract
    console.log("[Contract] Reading from TaxProcessor:", taxProcessorAddress);

    // Read liquidity (BNB and tokens) and treasury/funds
    const [
      liquidityBNB,
      liquidityTokens,
      treasuryBNB,
      totalLiquidityBNB,
      totalLiquidityTokens,
      totalTreasuryBNB
    ] = await Promise.all([
      // Try current balances first
      publicClient.readContract({
        address: taxProcessorAddress as `0x${string}`,
        abi: TAX_PROCESSOR_ABI,
        functionName: "lpQuoteBalance",
      }).catch((error: any) => {
        console.log("[Contract] lpQuoteBalance not available, will use totals...");
        return null;
      }),
      // Try to read tokens added to liquidity
      publicClient.readContract({
        address: taxProcessorAddress as `0x${string}`,
        abi: TAX_PROCESSOR_ABI,
        functionName: "totalTokensAddedToLiquidity",
      }).catch((error: any) => {
        console.log("[Contract] totalTokensAddedToLiquidity not available:", error?.message || String(error));
        return 0n;
      }),
      // Try current treasury balance
      publicClient.readContract({
        address: taxProcessorAddress as `0x${string}`,
        abi: TAX_PROCESSOR_ABI,
        functionName: "marketQuoteBalance",
      }).catch((error: any) => {
        console.log("[Contract] marketQuoteBalance not available, will use totals...");
        return null;
      }),
      // Read total BNB added to liquidity
      publicClient.readContract({
        address: taxProcessorAddress as `0x${string}`,
        abi: TAX_PROCESSOR_ABI,
        functionName: "totalQuoteAddedToLiquidity",
      }).catch((error: any) => {
        console.error("[Contract] Error reading totalQuoteAddedToLiquidity:", error?.message || String(error));
        return 0n;
      }),
      // Read total tokens added to liquidity (already read above, but keep for clarity)
      publicClient.readContract({
        address: taxProcessorAddress as `0x${string}`,
        abi: TAX_PROCESSOR_ABI,
        functionName: "totalTokensAddedToLiquidity",
      }).catch((error: any) => {
        console.log("[Contract] totalTokensAddedToLiquidity not available:", error?.message || String(error));
        return 0n;
      }),
      // Read total funds/treasury - try both functions
      Promise.race([
        publicClient.readContract({
          address: taxProcessorAddress as `0x${string}`,
          abi: TAX_PROCESSOR_ABI,
          functionName: "totalQuoteSentToFundsRecipient",
        }).catch(() => null),
        publicClient.readContract({
          address: taxProcessorAddress as `0x${string}`,
          abi: TAX_PROCESSOR_ABI,
          functionName: "totalQuoteSentToMarketing",
        }).catch(() => null),
      ]).then((result) => result || 0n).catch((error: any) => {
        console.error("[Contract] Error reading treasury/funds:", error?.message || String(error));
        return 0n;
      })
    ]);

    // Use current balances if available, otherwise use accumulated totals
    const liquidityBNBValue = liquidityBNB !== null ? liquidityBNB : totalLiquidityBNB;
    const treasuryBNBValue = treasuryBNB !== null ? treasuryBNB : totalTreasuryBNB;
    const liquidityTokensValue = totalLiquidityTokens;

    console.log("[Contract] Raw values:");
    console.log("  - Liquidity BNB:", liquidityBNBValue.toString());
    console.log("  - Liquidity Tokens:", liquidityTokensValue.toString());
    console.log("  - Treasury/Funds BNB:", treasuryBNBValue.toString());

    const liquidityBNBFormatted = formatEther(liquidityBNBValue);
    const treasuryBNBFormatted = formatEther(treasuryBNBValue);
    // Tokens are already in token units (not wei), so format accordingly
    // Assuming 18 decimals for tokens (adjust if different)
    const liquidityTokensFormatted = formatEther(liquidityTokensValue);

    console.log("[Contract] Successfully read contract data:", {
      liquidityBNB: liquidityBNBFormatted,
      liquidityTokens: liquidityTokensFormatted,
      treasuryBNB: treasuryBNBFormatted,
      liquidityBNBRaw: liquidityBNBValue.toString(),
      liquidityTokensRaw: liquidityTokensValue.toString(),
      treasuryBNBRaw: treasuryBNBValue.toString(),
    });

    return {
      fundsBalance: treasuryBNBFormatted, // Treasury = funds recipient
      liquidityBalance: liquidityBNBFormatted, // Liquidity BNB
      liquidityTokens: liquidityTokensFormatted, // Liquidity Tokens
      tokenAddress: TOKEN_ADDRESS,
      taxProcessorAddress: taxProcessorAddress,
    };
  } catch (error: any) {
    console.error("[Contract] Error reading contract data:", error?.message || String(error));
    console.error("[Contract] Error stack:", error?.stack);
    return {
      fundsBalance: "0",
      liquidityBalance: "0",
      tokenAddress: TOKEN_ADDRESS || "not configured",
      taxProcessorAddress: TAX_PROCESSOR_ADDRESS || "unknown",
    };
  }
}

// ===== ADMIN AUTH =====
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const activeSessions = new Map<string, { createdAt: number }>();
const SESSION_DURATION = 24 * 60 * 60 * 1000;

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function cleanExpiredSessions() {
  const now = Date.now();
  Array.from(activeSessions.entries()).forEach(([token, session]) => {
    if (now - session.createdAt > SESSION_DURATION) {
      activeSessions.delete(token);
    }
  });
}

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const token = authHeader.split(" ")[1];
  const session = activeSessions.get(token);
  
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  
  if (Date.now() - session.createdAt > SESSION_DURATION) {
    activeSessions.delete(token);
    return res.status(401).json({ error: "Session expired" });
  }
  
  next();
}

// Mock solanaService
const solanaService = {
  initialize: async () => ({ ready: false, error: "Blockchain features disabled" }),
  executeDistribution: async () => ({ success: false, error: "Blockchain features disabled" }),
  getHoldersByTier: async () => ({ majorHolders: [], mediumHolders: [] }),
  getWalletAddress: () => null,
  getSOLBalance: async () => 0,
  claimPumpfunFees: async () => ({ success: false, amount: 0, error: "Blockchain features disabled" }),
  testBuyback: async (_amount: number) => ({ success: false, tokenAmount: 0, txSignature: null, error: "Blockchain features disabled" }),
  sellToken: async (_amount: number) => ({ success: false, solAmount: 0, txSignature: null, error: "Blockchain features disabled" }),
  getTokenBalance: async () => 0,
  swapSOLForGold: async () => ({ success: false, goldAmount: 0, error: "Blockchain features disabled" }),
};

// ===== EXPRESS APP SETUP =====
const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// ===== ROUTES =====
let httpServer: any;
let routesInitialized = false;
let initPromise: Promise<void> | null = null;

async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setInterval(cleanExpiredSessions, 60 * 60 * 1000);
  
  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    
    if (!ADMIN_PASSWORD) {
      return res.status(500).json({ error: "Admin password not configured" });
    }
    
    if (password === ADMIN_PASSWORD) {
      const sessionToken = generateSessionToken();
      activeSessions.set(sessionToken, { createdAt: Date.now() });
      res.json({ success: true, token: sessionToken });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });
  
  app.post("/api/admin/distribute", adminAuth, async (req, res) => {
    res.status(503).json({ error: "Distribution feature disabled - database removed" });
  });

  app.post("/api/admin/logout", adminAuth, async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      activeSessions.delete(token);
    }
    res.json({ success: true });
  });

  app.get("/api/admin/config", adminAuth, async (req, res) => {
    res.json({
      id: "config",
      goldMint: "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A",
      tokenMint: "0xdCCf9Ac19362C6d60e69A196fC6351C4A0887777",
      minimumHolderPercentage: "0.5",
      majorHoldersPercentage: "75",
      mediumHoldersPercentage: "0",
      buybackPercentage: "15",
      treasuryPercentage: "10",
    });
  });

  app.patch("/api/admin/config", adminAuth, async (req, res) => {
    res.json({ message: "Config updates disabled - database removed" });
  });

  app.get("/api/admin/distributions", adminAuth, async (req, res) => {
    res.json([]);
  });

  app.get("/api/admin/distributions/:id", adminAuth, async (req, res) => {
    res.status(404).json({ error: "Distribution not found - database removed" });
  });

  app.get("/api/admin/status", adminAuth, async (req, res) => {
    try {
      const initResult = await solanaService.initialize();
      const walletAddress = solanaService.getWalletAddress();
      let solBalance = 0;
      
      if (initResult.ready) {
        solBalance = await solanaService.getSOLBalance();
      }
      
      res.json({
        walletConfigured: !!process.env.CREATOR_WALLET_PRIVATE_KEY,
        tokenConfigured: !!process.env.TOKEN_CONTRACT_ADDRESS,
        systemReady: initResult.ready,
        walletAddress,
        solBalance,
        error: initResult.error,
      });
    } catch (error) {
      console.error("Error fetching status:", error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  app.post("/api/admin/distributions/claim-fees", adminAuth, async (req, res) => {
    try {
      const initResult = await solanaService.initialize();
      if (!initResult.ready) {
        return res.json({ 
          success: false, 
          message: initResult.error,
          note: "To enable: Add CREATOR_WALLET_PRIVATE_KEY and TOKEN_CONTRACT_ADDRESS secrets."
        });
      }
      
      const claimResult = await solanaService.claimPumpfunFees();
      res.json({ 
        success: claimResult.success, 
        amount: claimResult.amount,
        message: claimResult.error || "Fees claimed successfully",
      });
    } catch (error) {
      console.error("Error claiming fees:", error);
      res.status(500).json({ error: "Failed to claim fees" });
    }
  });

  app.post("/api/admin/test/buyback", adminAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount. Provide a positive SOL amount." });
      }

      console.log(`[Admin] Test buyback requested: ${amount} SOL`);
      const result = await solanaService.testBuyback(amount);
      
      res.json({
        success: result.success,
        solSpent: amount,
        tokensReceived: result.tokenAmount,
        txSignature: result.txSignature,
        error: result.error,
      });
    } catch (error: any) {
      console.error("Test buyback error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/test/sell", adminAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount. Provide a positive token amount." });
      }

      console.log(`[Admin] Test sell requested: ${amount} tokens`);
      const result = await solanaService.sellToken(amount);
      
      res.json({
        success: result.success,
        tokensSold: amount,
        solReceived: result.solAmount,
        txSignature: result.txSignature,
        error: result.error,
      });
    } catch (error: any) {
      console.error("Test sell error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/test/token-balance", adminAuth, async (req, res) => {
    try {
      const initResult = await solanaService.initialize();
      if (!initResult.ready) {
        return res.json({ balance: 0, error: initResult.error });
      }

      const balance = await solanaService.getTokenBalance();
      res.json({ balance });
    } catch (error: any) {
      console.error("Token balance error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/distributions/execute", adminAuth, async (req, res) => {
    res.status(503).json({ error: "Distribution feature disabled - database removed" });
  });

  app.get("/api/admin/test/holders", adminAuth, async (req, res) => {
    res.status(503).json({ error: "Test endpoints disabled - database removed" });
  });

  app.post("/api/admin/test/buy-gold", adminAuth, async (req, res) => {
    res.status(503).json({ error: "Test endpoints disabled - database removed" });
  });

  app.get("/api/public/stats", async (req, res) => {
    try {
      let contractData: any = {
        fundsBalance: "0",
        liquidityBalance: "0",
        tokenAddress: TOKEN_ADDRESS,
        taxProcessorAddress: TAX_PROCESSOR_ADDRESS,
      };

      try {
        console.log("[Stats] Calling getContractData...");
        contractData = await getContractData();
        console.log("[Stats] Contract data received:", contractData);
      } catch (contractError: any) {
        console.log("[Stats] Contract data not available, using defaults:", contractError?.message || String(contractError));
      }
      
      let liquidityBNB = 0;
      let liquidityTokens = 0;
      let fundsBNB = 0;
      
      try {
        liquidityBNB = contractData?.liquidityBalance ? parseFloat(String(contractData.liquidityBalance)) || 0 : 0;
        liquidityTokens = contractData?.liquidityTokens ? parseFloat(String(contractData.liquidityTokens)) || 0 : 0;
        fundsBNB = contractData?.fundsBalance ? parseFloat(String(contractData.fundsBalance)) || 0 : 0;
        console.log("[Stats] Parsed values - liquidityBNB:", liquidityBNB, "liquidityTokens:", liquidityTokens, "fundsBNB:", fundsBNB);
      } catch (parseError) {
        console.error("[Stats] Error parsing contract values:", parseError);
      }
      
      const response = {
        totalDistributions: 0,
        totalGoldDistributed: 0,
        totalGoldMajorHolders: 0,
        totalGoldMediumHolders: 0,
        totalTokenBuyback: liquidityBNB.toString(),
        totalTreasury: fundsBNB.toString(), // Treasury = funds from contract
        totalFeesClaimed: 0,
        totalBurned: 0,
        goldMint: "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A",
        tokenMint: contractData?.tokenAddress || TOKEN_ADDRESS,
        lastDistribution: null,
        minimumHolderPercentage: "0.5",
        mediumHolderMinPercentage: "0.1",
        majorHoldersPercentage: "75",
        mediumHoldersPercentage: "0",
        buybackPercentage: "15",
        treasuryPercentage: "10",
        goldDistributionPercentage: "75",
        burnPercentage: "0",
        fundsBalance: fundsBNB.toString(), // Treasury/Funds balance
        liquidityBalance: liquidityBNB.toString(), // Liquidity BNB balance
        liquidityTokens: liquidityTokens.toString(), // Liquidity Tokens balance
      };

      console.log("[Stats] Sending response:", JSON.stringify(response, null, 2));
      res.status(200).json(response);
    } catch (error: any) {
      console.error("[Stats] Unexpected error:", error?.message || String(error));
      res.status(200).json({
        totalDistributions: 0,
        totalGoldDistributed: 0,
        totalGoldMajorHolders: 0,
        totalGoldMediumHolders: 0,
        totalTokenBuyback: "0",
        totalTreasury: "0",
        totalFeesClaimed: 0,
        totalBurned: 0,
        goldMint: "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A",
        tokenMint: TOKEN_ADDRESS,
        lastDistribution: null,
        minimumHolderPercentage: "0.5",
        mediumHolderMinPercentage: "0.1",
        majorHoldersPercentage: "75",
        mediumHoldersPercentage: "0",
        buybackPercentage: "15",
        treasuryPercentage: "10",
        goldDistributionPercentage: "75",
        burnPercentage: "0",
        fundsBalance: "0",
        liquidityBalance: "0",
        liquidityTokens: "0",
      });
    }
  });
  
  app.get("/api/public/distributions", async (req, res) => {
    try {
      res.status(200).json([]);
    } catch (error: any) {
      console.error("[Distributions] Error:", error?.message || String(error));
      res.status(200).json([]);
    }
  });
  
  app.get("/api/public/distributions/:id", async (req, res) => {
    res.status(404).json({ error: "Distribution not found - database removed" });
  });

  return httpServer;
}

// ===== INITIALIZATION =====
async function initializeApp() {
  if (routesInitialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      httpServer = createServer(app);
      await registerRoutes(httpServer, app);
      
      app.use((err: any, _req: any, res: any, _next: any) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || 'Internal Server Error';
        if (!res.headersSent) {
          res.status(status).json({ message });
        }
      });
      
      routesInitialized = true;
      console.log('[Vercel] Routes initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      throw error;
    }
  })();
  
  return initPromise;
}

// ===== VERCEL HANDLER =====
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    await initializeApp();
    
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(504).json({ error: 'Request timeout' });
        }
        resolve();
      }, 10000);
      
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
