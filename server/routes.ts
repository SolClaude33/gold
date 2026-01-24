import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";
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
  
  const runHourlyDistribution = async () => {
    try {
      const config = await storage.getProtocolConfig();
      if (!config?.tokenMint) {
        console.log("[Scheduler] Distribution skipped - Token mint not configured");
        return;
      }
      
      const initResult = await solanaService.initialize();
      if (!initResult.ready) {
        console.log("[Scheduler] Distribution skipped -", initResult.error);
        return;
      }
      
      console.log("[Scheduler] Starting hourly distribution...");
      const result = await solanaService.executeDistribution({
        majorHoldersPercentage: parseFloat(config.majorHoldersPercentage || "70"),
        mediumHoldersPercentage: parseFloat(config.mediumHoldersPercentage || "20"),
        buybackPercentage: parseFloat(config.buybackPercentage || "10"),
        majorMinPercentage: parseFloat(config.minimumHolderPercentage || "0.5"),
        mediumMinPercentage: parseFloat(config.mediumHolderMinPercentage || "0.1"),
      });
      
      if (result.success) {
        const majorPct = parseFloat(config.majorHoldersPercentage || "70") / 100;
        const mediumPct = parseFloat(config.mediumHoldersPercentage || "20") / 100;
        const buybackPct = parseFloat(config.buybackPercentage || "10") / 100;
        
        const majorPortion = result.totalFeesClaimed * majorPct;
        const mediumPortion = result.totalFeesClaimed * mediumPct;
        const buybackPortion = result.totalFeesClaimed * buybackPct;
        
        const distribution = await storage.createDistribution({
          totalFeesCollected: result.totalFeesClaimed.toString(),
          feesForGold: majorPortion.toString(),
          feesForMediumHolders: mediumPortion.toString(),
          feesForBuyback: buybackPortion.toString(),
          feesForBurn: "0",
          goldPurchased: result.goldDistributed.toString(),
          goldForMediumHolders: result.goldForMediumHolders.toString(),
          tokenBuyback: result.tokenBuyback.toString(),
          holdersCount: result.majorHolders,
          mediumHoldersCount: result.mediumHolders,
          status: "completed",
          txSignature: result.txSignatures[0] || null,
        });
        
        const { majorHolders, mediumHolders } = await solanaService.getHoldersByTier(0.5, 0.1);
        
        const majorTotalPct = majorHolders.reduce((sum, h) => sum + h.percentage, 0);
        for (const holder of majorHolders) {
          const normalizedShare = majorTotalPct > 0 ? (holder.percentage / majorTotalPct) * result.goldDistributed : 0;
          await storage.createHolderSnapshot({
            distributionId: distribution.id,
            walletAddress: holder.address,
            tokenBalance: holder.balance.toString(),
            percentageOfSupply: holder.percentage.toString(),
            goldReceived: normalizedShare.toString(),
          });
        }
        
        const mediumTotalPct = mediumHolders.reduce((sum, h) => sum + h.percentage, 0);
        for (const holder of mediumHolders) {
          const normalizedShare = mediumTotalPct > 0 ? (holder.percentage / mediumTotalPct) * result.goldForMediumHolders : 0;
          await storage.createHolderSnapshot({
            distributionId: distribution.id,
            walletAddress: holder.address,
            tokenBalance: holder.balance.toString(),
            percentageOfSupply: holder.percentage.toString(),
            goldReceived: normalizedShare.toString(),
          });
        }
        
        console.log("[Scheduler] Distribution completed successfully");
      } else {
        console.log("[Scheduler] Distribution failed:", result.error);
      }
    } catch (error) {
      console.error("[Scheduler] Distribution error:", error);
    }
  };
  
  // Blockchain scheduler disabled
  // setInterval(runHourlyDistribution, 15 * 60 * 1000);
  // console.log("[Scheduler] Hourly distribution scheduler initialized");
  
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
    try {
      const config = await storage.getProtocolConfig();
      if (!config?.tokenMint) {
        return res.status(400).json({ error: "Token mint not configured" });
      }

      const initResult = await solanaService.initialize();
      if (!initResult.ready) {
        return res.status(500).json({ error: initResult.error });
      }

      console.log("[Admin] Manual distribution requested");
      const result = await solanaService.executeDistribution({
        majorHoldersPercentage: parseFloat(config.majorHoldersPercentage || "70"),
        mediumHoldersPercentage: parseFloat(config.mediumHoldersPercentage || "20"),
        buybackPercentage: parseFloat(config.buybackPercentage || "10"),
        majorMinPercentage: parseFloat(config.minimumHolderPercentage || "0.5"),
        mediumMinPercentage: parseFloat(config.mediumHolderMinPercentage || "0.1"),
      });

      if (result.success) {
        // Record in database
        const majorPct = parseFloat(config.majorHoldersPercentage || "70") / 100;
        const mediumPct = parseFloat(config.mediumHoldersPercentage || "20") / 100;
        const buybackPct = parseFloat(config.buybackPercentage || "10") / 100;
        
        const majorPortion = result.totalFeesClaimed * majorPct;
        const mediumPortion = result.totalFeesClaimed * mediumPct;
        const buybackPortion = result.totalFeesClaimed * buybackPct;
        
        const distribution = await storage.createDistribution({
          totalFeesCollected: result.totalFeesClaimed.toString(),
          feesForGold: majorPortion.toString(),
          feesForMediumHolders: mediumPortion.toString(),
          feesForBuyback: buybackPortion.toString(),
          feesForBurn: "0",
          goldPurchased: result.goldDistributed.toString(),
          goldForMediumHolders: result.goldForMediumHolders.toString(),
          tokenBuyback: result.tokenBuyback.toString(),
          holdersCount: result.majorHolders,
          mediumHoldersCount: result.mediumHolders,
          status: "completed",
          txSignature: result.txSignatures[0] || null,
        });
        
        // Take snapshots
        const { majorHolders, mediumHolders } = await solanaService.getHoldersByTier(0.5, 0.1);
        
        const majorTotalPct = majorHolders.reduce((sum, h) => sum + h.percentage, 0);
        for (const holder of majorHolders) {
          const normalizedShare = majorTotalPct > 0 ? (holder.percentage / majorTotalPct) * result.goldDistributed : 0;
          await storage.createHolderSnapshot({
            distributionId: distribution.id,
            walletAddress: holder.address,
            tokenBalance: holder.balance.toString(),
            percentageOfSupply: holder.percentage.toString(),
            goldReceived: normalizedShare.toString(),
          });
        }
        
        const mediumTotalPct = mediumHolders.reduce((sum, h) => sum + h.percentage, 0);
        for (const holder of mediumHolders) {
          const normalizedShare = mediumTotalPct > 0 ? (holder.percentage / mediumTotalPct) * result.goldForMediumHolders : 0;
          await storage.createHolderSnapshot({
            distributionId: distribution.id,
            walletAddress: holder.address,
            tokenBalance: holder.balance.toString(),
            percentageOfSupply: holder.percentage.toString(),
            goldReceived: normalizedShare.toString(),
          });
        }

        res.json({ success: true, result });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error: any) {
      console.error("Manual distribution error:", error);
      res.status(500).json({ error: error.message });
    }
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
    try {
      let config = await storage.getProtocolConfig();
      if (!config) {
        config = await storage.updateProtocolConfig({
          goldMint: "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A",
          minimumHolderPercentage: "0.5",
          majorHoldersPercentage: "70",
          mediumHoldersPercentage: "20",
          buybackPercentage: "10",
        });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching config:", error);
      res.status(500).json({ error: "Failed to fetch config" });
    }
  });

  app.patch("/api/admin/config", adminAuth, async (req, res) => {
    try {
      const config = await storage.updateProtocolConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error updating config:", error);
      res.status(500).json({ error: "Failed to update config" });
    }
  });

  app.get("/api/admin/distributions", adminAuth, async (req, res) => {
    try {
      const distributions = await storage.getDistributions();
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching distributions:", error);
      res.status(500).json({ error: "Failed to fetch distributions" });
    }
  });

  app.get("/api/admin/distributions/:id", adminAuth, async (req, res) => {
    try {
      const distribution = await storage.getDistribution(req.params.id);
      if (!distribution) {
        return res.status(404).json({ error: "Distribution not found" });
      }
      const snapshots = await storage.getHolderSnapshots(req.params.id);
      res.json({ distribution, snapshots });
    } catch (error) {
      console.error("Error fetching distribution:", error);
      res.status(500).json({ error: "Failed to fetch distribution" });
    }
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
    try {
      const config = await storage.getProtocolConfig();
      if (!config?.tokenMint) {
        return res.status(400).json({ 
          error: "Token mint not configured. Please set the token contract address first." 
        });
      }

      const result = await solanaService.executeDistribution({
        majorHoldersPercentage: parseFloat(config.majorHoldersPercentage || "70"),
        mediumHoldersPercentage: parseFloat(config.mediumHoldersPercentage || "20"),
        buybackPercentage: parseFloat(config.buybackPercentage || "10"),
        majorMinPercentage: parseFloat(config.minimumHolderPercentage || "0.5"),
        mediumMinPercentage: parseFloat(config.mediumHolderMinPercentage || "0.1"),
      });

      if (!result.success) {
        const distribution = await storage.createDistribution({
          totalFeesCollected: "0",
          feesForGold: "0",
          feesForMediumHolders: "0",
          feesForBuyback: "0",
          feesForBurn: "0",
          goldPurchased: "0",
          goldForMediumHolders: "0",
          tokenBuyback: "0",
          holdersCount: 0,
          mediumHoldersCount: 0,
          status: "failed",
          txSignature: null,
        });
        
        return res.json({ 
          success: false, 
          distribution,
          error: result.error,
          note: "To enable full functionality: Add CREATOR_WALLET_PRIVATE_KEY and TOKEN_CONTRACT_ADDRESS secrets."
        });
      }

      const majorPct = parseFloat(config.majorHoldersPercentage || "70") / 100;
      const mediumPct = parseFloat(config.mediumHoldersPercentage || "20") / 100;
      const buybackPct = parseFloat(config.buybackPercentage || "10") / 100;

      const majorPortion = result.totalFeesClaimed * majorPct;
      const mediumPortion = result.totalFeesClaimed * mediumPct;
      const buybackPortion = result.totalFeesClaimed * buybackPct;

      const distribution = await storage.createDistribution({
        totalFeesCollected: result.totalFeesClaimed.toString(),
        feesForGold: majorPortion.toString(),
        feesForMediumHolders: mediumPortion.toString(),
        feesForBuyback: buybackPortion.toString(),
        feesForBurn: "0",
        goldPurchased: result.goldDistributed.toString(),
        goldForMediumHolders: result.goldForMediumHolders.toString(),
        tokenBuyback: result.tokenBuyback.toString(),
        holdersCount: result.majorHolders,
        mediumHoldersCount: result.mediumHolders,
        status: "completed",
        txSignature: result.txSignatures[0] || null,
      });

      const majorMinPct = parseFloat(config.minimumHolderPercentage || "0.5");
      const mediumMinPct = parseFloat(config.mediumHolderMinPercentage || "0.1");
      const { majorHolders, mediumHolders } = await solanaService.getHoldersByTier(majorMinPct, mediumMinPct);

      const majorTotalPct = majorHolders.reduce((sum, h) => sum + h.percentage, 0);
      for (const holder of majorHolders) {
        const normalizedShare = majorTotalPct > 0 ? (holder.percentage / majorTotalPct) * result.goldDistributed : 0;
        await storage.createHolderSnapshot({
          distributionId: distribution.id,
          walletAddress: holder.address,
          tokenBalance: holder.balance.toString(),
          percentageOfSupply: holder.percentage.toString(),
          goldReceived: normalizedShare.toString(),
        });
      }
      
      const mediumTotalPct = mediumHolders.reduce((sum, h) => sum + h.percentage, 0);
      for (const holder of mediumHolders) {
        const normalizedShare = mediumTotalPct > 0 ? (holder.percentage / mediumTotalPct) * result.goldForMediumHolders : 0;
        await storage.createHolderSnapshot({
          distributionId: distribution.id,
          walletAddress: holder.address,
          tokenBalance: holder.balance.toString(),
          percentageOfSupply: holder.percentage.toString(),
          goldReceived: normalizedShare.toString(),
        });
      }

      res.json({ 
        success: true, 
        distribution,
        result,
      });
    } catch (error) {
      console.error("Error executing distribution:", error);
      res.status(500).json({ error: "Failed to execute distribution" });
    }
  });

  // Test endpoints for debugging (admin only)
  app.get("/api/admin/test/holders", adminAuth, async (req, res) => {
    try {
      const config = await storage.getProtocolConfig();
      const tokenMint = config?.tokenMint || process.env.TOKEN_CONTRACT_ADDRESS;
      
      const initResult = await solanaService.initialize(tokenMint);
      if (!initResult.ready) {
        return res.json({ 
          success: false, 
          error: initResult.error,
          note: "Make sure TOKEN_CONTRACT_ADDRESS is set in database or environment"
        });
      }
      
      const majorMinPct = parseFloat(config?.minimumHolderPercentage || "0.5");
      const mediumMinPct = parseFloat(config?.mediumHolderMinPercentage || "0.1");
      
      const { majorHolders, mediumHolders } = await solanaService.getHoldersByTier(majorMinPct, mediumMinPct);
      
      res.json({
        success: true,
        tokenMint: process.env.TOKEN_CONTRACT_ADDRESS,
        majorHoldersThreshold: `>=${majorMinPct}%`,
        mediumHoldersThreshold: `${mediumMinPct}% - ${majorMinPct}%`,
        majorHolders,
        mediumHolders,
        totalMajorHolders: majorHolders.length,
        totalMediumHolders: mediumHolders.length,
      });
    } catch (error: any) {
      console.error("Error testing holders:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/test/buy-gold", adminAuth, async (req, res) => {
    try {
      const { solAmount } = req.body;
      
      if (!solAmount || solAmount <= 0) {
        return res.status(400).json({ error: "Invalid SOL amount. Provide a positive number." });
      }
      
      const config = await storage.getProtocolConfig();
      const tokenMint = config?.tokenMint || process.env.TOKEN_CONTRACT_ADDRESS;
      
      const initResult = await solanaService.initialize(tokenMint);
      if (!initResult.ready) {
        return res.json({ 
          success: false, 
          error: initResult.error,
          note: "Make sure CREATOR_WALLET_PRIVATE_KEY is configured and tokenMint is set"
        });
      }
      
      const solBalance = await solanaService.getSOLBalance();
      if (solBalance < solAmount + 0.01) {
        return res.json({ 
          success: false, 
          error: `Insufficient SOL balance. Have: ${solBalance.toFixed(4)}, Need: ${(solAmount + 0.01).toFixed(4)} (including gas)` 
        });
      }
      
      console.log(`[Test] Executing test swap: ${solAmount} SOL -> $GOLD`);
      const swapResult = await solanaService.swapSOLForGold(solAmount);
      
      res.json({
        success: swapResult.success,
        solAmount,
        goldAmount: swapResult.goldAmount,
        txSignature: swapResult.txSignature,
        // solscanUrl: swapResult.txSignature ? `https://solscan.io/tx/${swapResult.txSignature}` : null,
        error: swapResult.error,
      });
    } catch (error: any) {
      console.error("Error testing gold swap:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/public/stats", async (req, res) => {
    try {
      const distributions = await storage.getDistributions(100);
      const config = await storage.getProtocolConfig();
      
      const totalGoldMajorHolders = distributions.reduce((sum, d) => 
        sum + parseFloat(d.goldPurchased || "0"), 0
      );
      
      const totalGoldMediumHolders = distributions.reduce((sum, d) => 
        sum + parseFloat(d.goldForMediumHolders || "0"), 0
      );
      
      const totalGoldDistributed = totalGoldMajorHolders + totalGoldMediumHolders;
      
      const totalTokenBuyback = distributions.reduce((sum, d) => 
        sum + parseFloat(d.tokenBuyback || "0"), 0
      );
      
      const totalFeesClaimed = distributions.reduce((sum, d) => 
        sum + parseFloat(d.totalFeesCollected || "0"), 0
      );
      
      const totalBurned = distributions.reduce((sum, d) => 
        sum + parseFloat(d.feesForBurn || "0"), 0
      );
      
      res.json({
        totalDistributions: distributions.filter(d => d.status === "completed").length,
        totalGoldDistributed,
        totalGoldMajorHolders,
        totalGoldMediumHolders,
        totalTokenBuyback,
        totalFeesClaimed,
        totalBurned,
        goldMint: config?.goldMint || "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A",
        tokenMint: config?.tokenMint || null,
        lastDistribution: distributions[0]?.timestamp || null,
        minimumHolderPercentage: config?.minimumHolderPercentage || "0.5",
        mediumHolderMinPercentage: config?.mediumHolderMinPercentage || "0.1",
        majorHoldersPercentage: config?.majorHoldersPercentage || "70",
        mediumHoldersPercentage: config?.mediumHoldersPercentage || "20",
        buybackPercentage: config?.buybackPercentage || "10",
        goldDistributionPercentage: config?.goldDistributionPercentage || "70",
        burnPercentage: config?.burnPercentage || "30",
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  
  app.get("/api/public/distributions", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const distributions = await storage.getDistributions(limit);
      res.json(distributions.filter(d => d.status === "completed" || d.status === "pending"));
    } catch (error) {
      console.error("Error fetching distributions:", error);
      res.status(500).json({ error: "Failed to fetch distributions" });
    }
  });
  
  app.get("/api/public/distributions/:id", async (req, res) => {
    try {
      const distribution = await storage.getDistribution(req.params.id);
      if (!distribution) {
        return res.status(404).json({ error: "Distribution not found" });
      }
      const holders = await storage.getHolderSnapshots(req.params.id);
      res.json({ distribution, holders });
    } catch (error) {
      console.error("Error fetching distribution:", error);
      res.status(500).json({ error: "Failed to fetch distribution" });
    }
  });

  return httpServer;
}
