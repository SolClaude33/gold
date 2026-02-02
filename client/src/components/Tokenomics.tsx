import { motion } from "framer-motion";
import { Coins, TrendingUp, Twitter, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";

interface Stats {
  totalFeesClaimed: number;
  tokenMint: string | null;
}

export function Tokenomics() {
  const { language } = useLanguage();
  const { data: stats } = useQuery<Stats>({
    queryKey: ["tokenomics-stats"],
    queryFn: async () => {
      const res = await fetch("/api/public/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const totalFees = stats?.totalFeesClaimed || 0;

  const content = {
    en: {
      title: "Protocol Mechanics",
      subtitle: "",
      goldDividends: "Gold Dividends",
      liquidity: "Liquidity",
      treasury: "Treasury",
      goldDividendsDesc: "Creator fees converted to tokenized gold and distributed to holders.",
      liquidityDesc: "Creator fees used to provide liquidity and support the token price.",
      treasuryDesc: "Creator fees allocated to treasury for future development and operations.",
      holders: "Holders with 0.5%+ supply",
      liquidityMech: "Liquidity mechanism",
      treasuryReserve: "Treasury reserve",
      totalFees: "Total fees distributed:",
      distributionNote: "Distributions are automatic and hourly. No staking required. No claiming required.",
      distributionNoteAlt: "Distributions will begin automatically when the token launches. No staking required.",
      followOnX: "Follow on X"
    },
    zh: {
      title: "协议机制",
      subtitle: "",
      goldDividends: "黄金分红",
      liquidity: "流动性",
      treasury: "金库",
      goldDividendsDesc: "创作者手续费自动兑换为代币化黄金，并分配给持有人。",
      liquidityDesc: "创作者手续费用于补充流动性并支撑币价。",
      treasuryDesc: "创作者手续费划入金库，用于未来开发与运营。",
      holders: "持仓达到总供给 0.5%+ 的地址",
      liquidityMech: "流动性机制",
      treasuryReserve: "金库储备",
      totalFees: "已分配总手续费：",
      distributionNote: "每小时自动分配。无需质押。无需领取。",
      distributionNoteAlt: "代币上线后将自动开始分配。无需质押。",
      followOnX: "关注 X"
    }
  };

  const t = content[language];

  return (
    <section className="py-24 px-4 text-white relative overflow-hidden border-y-4 border-amber-600/50">
      {/* Goldback3 Background - Cascadas de oro */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url(/goldback3.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/75" />
      
      {/* Vault Texture Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.2)_0%,_transparent_70%)]" />
      
      <div className="container mx-auto relative z-10">
        <h2 className="text-4xl md:text-6xl font-black text-center mb-16 uppercase tracking-tight">
          <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 bg-clip-text text-transparent">
            {t.title}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Gold Dividends Card */}
          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 border-4 border-amber-300 p-6 relative group shadow-[0_0_60px_rgba(251,191,36,0.6)] hover:shadow-[0_0_80px_rgba(251,191,36,0.8)] transition-all"
          >
            <div className="relative z-10 flex flex-col items-center text-center h-full">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-4 border-4 border-amber-300 shadow-lg">
                <Coins className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-black mb-1 uppercase">{t.goldDividends}</h3>
              <div className="text-5xl font-black text-white mb-3 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">75%</div>
              <p className="text-black font-bold text-base leading-relaxed border-y-2 border-black/30 py-3 mb-3">
                {t.goldDividendsDesc}
              </p>
              <div className="mt-auto pt-3 w-full">
                 <div className="w-full bg-amber-900 h-3 mt-2 border-2 border-black/20 overflow-hidden relative">
                   <div className="h-full bg-amber-200 w-[75%]" />
                 </div>
                 <p className="text-[10px] text-right mt-2 text-black font-mono font-bold uppercase">{t.holders}</p>
              </div>
            </div>
          </motion.div>

          {/* Liquidity Card */}
          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-gradient-to-br from-blue-600 to-blue-900 border-4 border-blue-300 p-6 relative group shadow-[0_0_60px_rgba(59,130,246,0.6)] hover:shadow-[0_0_80px_rgba(59,130,246,0.8)] transition-all"
          >
            <div className="relative z-10 flex flex-col items-center text-center h-full">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border-4 border-blue-300 shadow-lg">
                <TrendingUp className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-white mb-1 uppercase">{t.liquidity}</h3>
              <div className="text-5xl font-black text-white mb-3 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">15%</div>
              <p className="text-blue-100 font-bold text-base leading-relaxed border-y-2 border-white/30 py-3 mb-3">
                {t.liquidityDesc}
              </p>
              <div className="mt-auto pt-3 w-full">
                 <div className="w-full bg-blue-900 h-3 mt-2 border-2 border-white/20 overflow-hidden relative">
                   <div className="h-full bg-blue-300 w-[15%]" />
                 </div>
                 <p className="text-[10px] text-right mt-2 text-blue-200 font-mono font-bold uppercase">{t.liquidityMech}</p>
              </div>
            </div>
          </motion.div>

          {/* Treasury Card */}
          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-gradient-to-br from-purple-700 to-purple-950 border-4 border-purple-300 p-6 relative group shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:shadow-[0_0_80px_rgba(168,85,247,0.8)] transition-all"
          >
            <div className="relative z-10 flex flex-col items-center text-center h-full">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border-4 border-purple-300 shadow-lg">
                <Wallet className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-black text-white mb-1 uppercase">{t.treasury}</h3>
              <div className="text-5xl font-black text-white mb-3 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">10%</div>
              <p className="text-purple-100 font-bold text-base leading-relaxed border-y-2 border-white/30 py-3 mb-3">
                {t.treasuryDesc}
              </p>
              <div className="mt-auto pt-3 w-full">
                 <div className="w-full bg-purple-900 h-3 mt-2 border-2 border-white/20 overflow-hidden relative">
                   <div className="h-full bg-purple-300 w-[10%]" />
                 </div>
                 <p className="text-[10px] text-right mt-2 text-purple-200 font-mono font-bold uppercase">{t.treasuryReserve}</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="mt-16 text-center border-t-4 border-amber-600/50 pt-8 max-w-2xl mx-auto">
            <p className="text-xl font-mono mb-4 font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-black inline-block px-6 py-2 border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              {t.totalFees} {totalFees.toFixed(4)}
            </p>
            <p className="text-sm text-amber-400/70 italic mb-6">
                {stats?.tokenMint 
                  ? t.distributionNote
                  : t.distributionNoteAlt}
            </p>
            <a 
              href="https://x.com/4Vaultbnb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold uppercase tracking-wider hover:from-amber-500 hover:to-amber-600 transition-all border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
              data-testid="link-twitter"
            >
              <Twitter className="w-5 h-5" />
              {t.followOnX}
            </a>
        </div>
      </div>
    </section>
  );
}
