import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { getContractData } from "./contract";
// Blockchain features disabled - Solana integration removed
// import { solanaService } from "./solana";

// Mock solanaService with disabled functionality
const solanaService = {
  initialize: async () => ({ ready: false, error: "Blockchain features disabled" }),
  executeDistribution: async () => ({ success: false, error: "Blockchain features disabled" }),
  getHoldersByTier: async () => ({ majorHolders: [], mediumHolders: [] }),
  getWalletAddress: () => null,
  getSOLBalance: async () => 0,
  claimPumpfunFees: async () => ({ success: false, amount: 0, error: "Blockchain features disabled" }),
  testBuyback: async () => ({ success: false, tokenAmount: 0, error: "Blockchain features disabled" }),
  sellToken: async () => ({ success: false, solAmount: 0, error: "Blockchain features disabled" }),
  getTokenBalance: async () => 0,
  swapSOLForGold: async () => ({ success: false, goldAmount: 0, error: "Blockchain features disabled" }),
};

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
    // Return default config without database
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
    // Config updates disabled - database removed
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

  // Test endpoints for debugging (admin only)
  app.get("/api/admin/test/holders", adminAuth, async (req, res) => {
    res.status(503).json({ error: "Test endpoints disabled - database removed" });
  });

  app.post("/api/admin/test/buy-gold", adminAuth, async (req, res) => {
    res.status(503).json({ error: "Test endpoints disabled - database removed" });
  });

  app.get("/api/public/stats", async (req, res) => {
    try {
      // Get contract data from EVM contract
      let contractData;
      try {
        contractData = await getContractData();
      } catch (contractError: any) {
        console.log("[Stats] Contract data not available, using defaults:", contractError?.message || contractError);
        contractData = {
          fundsBalance: "0",
          liquidityBalance: "0",
          tokenAddress: "0xdCCf9Ac19362C6d60e69A196fC6351C4A0887777",
          taxProcessorAddress: "0xF7e36953aEDF448cbB9cE5fA123742e3543A82D8",
        };
      }
      
      // Convert wei to BNB (18 decimals)
      const liquidityBNB = contractData?.liquidityBalance ? parseFloat(contractData.liquidityBalance) : 0;
      const fundsBNB = contractData?.fundsBalance ? parseFloat(contractData.fundsBalance) : 0;
      
      res.status(200).json({
        totalDistributions: 0,
        totalGoldDistributed: 0,
        totalGoldMajorHolders: 0,
        totalGoldMediumHolders: 0,
        totalTokenBuyback: liquidityBNB.toString(),
        totalTreasury: fundsBNB.toString(),
        totalFeesClaimed: 0,
        totalBurned: 0,
        goldMint: "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A",
        tokenMint: contractData?.tokenAddress || "0xdCCf9Ac19362C6d60e69A196fC6351C4A0887777",
        lastDistribution: null,
        minimumHolderPercentage: "0.5",
        mediumHolderMinPercentage: "0.1",
        majorHoldersPercentage: "75",
        mediumHoldersPercentage: "0",
        buybackPercentage: "15",
        treasuryPercentage: "10",
        goldDistributionPercentage: "75",
        burnPercentage: "0",
        fundsBalance: fundsBNB.toString(),
        liquidityBalance: liquidityBNB.toString(),
      });
    } catch (error: any) {
      console.error("[Stats] Error fetching stats:", error?.message || error);
      // Return default values instead of error
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
        tokenMint: "0xdCCf9Ac19362C6d60e69A196fC6351C4A0887777",
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
      });
    }
  });
  
  app.get("/api/public/distributions", async (req, res) => {
    // Database removed - return empty array
    res.json([]);
  });
  
  app.get("/api/public/distributions/:id", async (req, res) => {
    res.status(404).json({ error: "Distribution not found - database removed" });
  });

  return httpServer;
}
