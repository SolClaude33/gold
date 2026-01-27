import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, Wifi, Shield, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import clsx from "clsx";

interface Stats {
  totalDistributions: number;
  totalGoldDistributed: number;
  totalGoldMajorHolders: number;
  totalTokenBuyback: number;
  totalTreasury: number;
  totalFeesClaimed: number;
  totalBurned: number;
  goldMint: string;
  tokenMint: string | null;
  lastDistribution: string | null;
  minimumHolderPercentage: string;
  majorHoldersPercentage: string;
  buybackPercentage: string;
  treasuryPercentage: string;
  goldDistributionPercentage: string;
  burnPercentage: string;
  fundsBalance?: string;
  feesConvertedToGold?: string;
  liquidityBalance?: string;
  liquidityTokens?: string;
}

interface Distribution {
  id: string;
  timestamp: string;
  totalFeesCollected: string;
  feesForGold: string;
  feesForBurn: string;
  goldPurchased: string;
  holdersCount: number;
  status: string;
  txSignature: string | null;
}

interface LogEntry {
  id: string;
  type: "BUY GOLD" | "BUYBACK" | "DIVIDEND";
  amount: string;
  hash: string;
  time: string;
  txSignature: string | null;
}

export function LiveDashboard() {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [countdown, setCountdown] = useState<string>("");

  const content = {
    en: {
      monitor: "JINVAULT_MONITOR_V2.1",
      monitorSub: "",
      followOnX: "Follow on X",
      totalProtocolTrades: "Total Protocol Trades",
      active: "ACTIVE",
      goldPercent: "75% → $GOLD",
      feesConverted: "Fees Converted to Gold",
      liquidity: "Liquidity (15%)",
      treasury: "Treasury (10%)",
      treasuryReserve: "Treasury Reserve",
      tokenCA: "TOKEN_CA",
      allLogs: "All Logs",
      whalesOnly: "Whales Only",
      systemLogs: "_ SYSTEM_LOGS",
      noDistributions: "No distributions yet. Logs will appear here when the token is live."
    },
    zh: {
      monitor: "JINVAULT_MONITOR_V2.1",
      monitorSub: "金库监控系统",
      followOnX: "关注 X",
      totalProtocolTrades: "协议总交易数",
      active: "运行中",
      goldPercent: "75% → $GOLD",
      feesConverted: "已兑换为黄金的手续费",
      liquidity: "流动性（15%）",
      treasury: "金库（10%）",
      treasuryReserve: "金库储备",
      tokenCA: "TOKEN_CA",
      allLogs: "全部日志",
      whalesOnly: "鲸鱼专属",
      systemLogs: "_ SYSTEM_LOGS",
      noDistributions: "尚未开始分配。代币上线后，日志将显示在此处。"
    }
  };

  const t = content[language];

  const { data: stats, error: statsError, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["public-stats"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/public/stats");
        if (!res.ok) {
          console.error("[Dashboard] Stats fetch failed:", res.status, res.statusText);
          throw new Error(`Failed to fetch stats: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log("[Dashboard] Stats data received:", data);
        return data;
      } catch (error) {
        console.error("[Dashboard] Error fetching stats:", error);
        throw error;
      }
    },
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000,
  });

  const { data: distributions } = useQuery<Distribution[]>({
    queryKey: ["public-distributions"],
    queryFn: async () => {
      const res = await fetch("/api/public/distributions?limit=20");
      if (!res.ok) throw new Error("Failed to fetch distributions");
      return res.json();
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (distributions && distributions.length > 0) {
      const newLogs: LogEntry[] = [];
      
      distributions.forEach((dist) => {
        const time = new Date(dist.timestamp).toLocaleTimeString('en-US', { hour12: false });
        const hash = dist.txSignature 
          ? `${dist.txSignature.slice(0, 8)}...${dist.txSignature.slice(-4)}`
          : "pending...";
        
        if (parseFloat(dist.goldPurchased) > 0) {
          newLogs.push({
            id: `gold-${dist.id}`,
            type: "BUY GOLD",
            amount: parseFloat(dist.goldPurchased).toFixed(4),
            hash,
            time,
            txSignature: dist.txSignature,
          });
        }
        
        if (parseFloat(dist.feesForBurn) > 0) {
          newLogs.push({
            id: `buyback-${dist.id}`,
            type: "BUYBACK",
            amount: (parseFloat(dist.feesForBurn) * 1000).toFixed(2),
            hash,
            time,
            txSignature: dist.txSignature,
          });
        }
        
        if (dist.holdersCount > 0 && parseFloat(dist.goldPurchased) > 0) {
          newLogs.push({
            id: `div-${dist.id}`,
            type: "DIVIDEND",
            amount: (parseFloat(dist.goldPurchased) / dist.holdersCount).toFixed(4),
            hash,
            time,
            txSignature: dist.txSignature,
          });
        }
      });
      
      setLogs(newLogs.slice(0, 8));
    }
  }, [distributions]);

  useEffect(() => {
    if (!stats?.tokenMint) return;

    const updateCountdown = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const minutesLeft = 59 - minutes;
      const secondsLeft = 59 - seconds;
      setCountdown(`${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [stats?.tokenMint]);

  const isLive = !!stats?.tokenMint;

  return (
    <section id="dashboard" className="py-13 md:py-18 relative font-mono text-amber-300 overflow-hidden min-h-screen flex items-center">
      {/* Marco de oro como fondo */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url(/marco_de_Gold.png)',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="container mx-auto px-16 md:px-24 lg:px-19 py-4 relative z-10 w-full max-w-13xl">
        
        <div className="bg-black/70 backdrop-blur-sm border-2 border-b-0 border-amber-400/60 rounded-t-xl p-4 flex justify-between items-center select-none shadow-[0_0_40px_rgba(251,191,36,0.3)]">
          <div className="flex items-center gap-4 text-xs">
             <div className="flex gap-1.5">
               <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
               <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
             </div>
             <span className="text-amber-300 font-bold tracking-wider">{t.monitor}</span>
             {language === "zh" && <span className="text-amber-500/80 text-[10px]">{t.monitorSub}</span>}
          </div>
          <div className="flex gap-4 text-[10px] md:text-xs text-amber-400/90 uppercase tracking-wider font-bold">
             {isLive && countdown && (
               <span className="flex items-center gap-1 text-amber-300">
                 <Clock className="w-3 h-3" /> Next: {countdown}
               </span>
             )}
             <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> CONNECTED</span>
             <span className="flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> LIVE FEED</span>
             <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SECURE</span>
          </div>
        </div>

        <div className="bg-black/70 backdrop-blur-md border-2 border-amber-400/60 rounded-b-xl p-3 md:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[370px] shadow-[0_0_80px_rgba(251,191,36,0.4)]">
          
          <div className="lg:col-span-4 flex flex-col gap-3 border-b lg:border-b-0 lg:border-r-2 border-amber-500/40 pb-3 lg:pb-0 lg:pr-3">
            
            <div className="space-y-1.5">
              <h3 className="text-amber-400 text-xs uppercase tracking-widest mb-1 font-bold">{t.totalProtocolTrades}</h3>
              <div className="text-5xl font-black text-amber-300 tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" data-testid="text-total-trades">
                {stats?.totalDistributions || 0}
              </div>
              <div className="text-xs text-amber-300 font-bold bg-amber-900/30 inline-block px-2 py-0.5 border border-amber-500/50 uppercase">
                {stats?.tokenMint ? t.active : "PENDING"} | {t.goldPercent}
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            <div className="space-y-1.5">
              <h3 className="text-amber-300 text-xs uppercase tracking-widest mb-1 font-bold">{t.feesConverted}</h3>
              <div className="text-4xl font-black text-amber-200 tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" data-testid="text-fees-gold">
                {statsLoading ? (
                  <span className="text-sm">Loading...</span>
                ) : statsError ? (
                  <span className="text-sm text-red-500">Error</span>
                ) : stats?.feesConvertedToGold ? (
                  <>
                    {parseFloat(stats.feesConvertedToGold).toFixed(4)} <span className="text-lg text-amber-400/60 font-normal">BNB</span>
                  </>
                ) : (
                  <>
                    0.0000 <span className="text-lg text-amber-400/60 font-normal">BNB</span>
                  </>
                )}
              </div>
              <div className="w-full bg-black/50 h-3 mt-2 border border-amber-500/40 overflow-hidden rounded">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_15px_rgba(251,191,36,0.6)]" style={{ width: `${stats?.goldDistributionPercentage || 75}%` }}></div>
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            <div className="space-y-1.5">
              <h3 className="text-blue-400 text-xs uppercase tracking-widest mb-1 font-bold">{t.liquidity}</h3>
              <div className="space-y-1">
                <div className="text-3xl font-black text-blue-400 tracking-tighter tabular-nums" data-testid="text-buyback">
                  {statsLoading ? (
                    <span className="text-sm">Loading...</span>
                  ) : statsError ? (
                    <span className="text-sm text-red-500">Error</span>
                  ) : stats?.liquidityBalance ? (
                    <>
                      {parseFloat(stats.liquidityBalance).toFixed(4)} <span className="text-lg text-blue-500/50 font-normal">BNB</span>
                    </>
                  ) : (
                    <>
                      0.0000 <span className="text-lg text-blue-500/50 font-normal">BNB</span>
                    </>
                  )}
                </div>
                {stats?.liquidityTokens && parseFloat(stats.liquidityTokens) > 0 && (
                  <div className="text-3xl font-black text-blue-400 tracking-tighter tabular-nums">
                    {parseFloat(stats.liquidityTokens).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-lg text-blue-500/50 font-normal">tokens</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />

            <div className="space-y-1.5">
              <h3 className="text-purple-400 text-xs uppercase tracking-widest mb-1 font-bold">{t.treasury}</h3>
              <div className="text-3xl font-black text-purple-400 tracking-tighter tabular-nums" data-testid="text-treasury">
                {statsLoading ? (
                  <span className="text-sm">Loading...</span>
                ) : statsError ? (
                  <span className="text-sm text-red-500">Error</span>
                ) : stats?.fundsBalance ? (
                  <>
                    {parseFloat(stats.fundsBalance).toFixed(4)} <span className="text-lg text-purple-500/50 font-normal">BNB</span>
                  </>
                ) : (
                  <>
                    0.0000 <span className="text-lg text-purple-500/50 font-normal">BNB</span>
                  </>
                )}
              </div>
              <div className="text-xs text-purple-400 font-bold bg-purple-950/50 inline-block px-2 py-0.5 border border-purple-600/50 uppercase">
                {t.treasuryReserve}
              </div>
            </div>

            <div className="mt-auto pt-7 space-y-2">
               <div className="flex justify-between text-xs text-amber-400 font-bold uppercase">
                  <span>{t.tokenCA}</span>
                  <span className="font-mono text-amber-300">
                    {stats?.tokenMint ? stats.tokenMint : "SOON"}
                  </span>
               </div>
            </div>
          </div>

          <div className="lg:col-span-8 relative font-mono text-sm overflow-hidden">
             <div className="absolute top-0 right-0 flex gap-2 mb-4">
                <span className="px-2 py-1 bg-amber-900/40 text-amber-300 text-[10px] rounded border border-amber-500/50 font-bold uppercase">{t.allLogs}</span>
                <span className="px-2 py-1 bg-transparent text-amber-600/50 text-[10px] rounded border border-amber-800/30 uppercase">{t.whalesOnly}</span>
             </div>

             <h3 className="text-amber-400 text-xs uppercase tracking-widest mb-4 mt-1 font-bold">&gt; {t.systemLogs}</h3>

             <div className="flex flex-col gap-2">
               {logs.length === 0 ? (
                 <div className="text-center py-8 text-amber-500/70">
                   {t.noDistributions}
                 </div>
               ) : (
                 logs.map((tx) => (
                   <motion.div 
                     key={tx.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className={clsx(
                       "flex items-center justify-between p-3 rounded-lg border uppercase",
                       "bg-black/60 backdrop-blur-sm hover:bg-black/70 transition-colors cursor-default",
                       tx.type === "BUY GOLD" ? "border-amber-400/60 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]" : 
                       tx.type === "BUYBACK" ? "border-blue-400/60 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]" : 
                       "border-purple-400/60 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                     )}
                     data-testid={`log-${tx.id}`}
                   >
                     <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                       <span className="text-xs text-amber-500/70 tabular-nums font-bold">[{tx.time}]</span>
                       <span className={clsx("font-black tracking-wide", 
                          tx.type === "BUY GOLD" ? "text-amber-300" : 
                          tx.type === "BUYBACK" ? "text-blue-400" : 
                          "text-purple-400"
                       )}>{tx.type}</span>
                     </div>
                     <div className="flex items-center gap-4">
                       <span className="font-bold tabular-nums text-amber-200">
                         {tx.type === "BUY GOLD" || tx.type === "DIVIDEND" ? `${tx.amount} OZ` : `${tx.amount} JinVault`}
                       </span>
                       <span className="text-xs text-amber-600/40 hidden md:block font-mono">{tx.hash}</span>
                       <span className="text-[10px] px-1.5 py-0.5 bg-amber-900/40 rounded border border-amber-500/50 text-amber-400 font-bold">LIVE</span>
                     </div>
                   </motion.div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
