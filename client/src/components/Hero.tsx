import { motion } from "framer-motion";
import { Twitter, Globe, Send } from "lucide-react";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";

export function Hero() {
  const { language, toggleLanguage } = useLanguage();

  const { data: stats } = useQuery<{ tokenMint: string | null }>({
    queryKey: ["hero-stats"],
    queryFn: async () => {
      const res = await fetch("/api/public/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const content = {
    en: {
      title: "JinVault",
      subtitle: "GOLD VAULT",
      tagline: "THE ULTIMATE DIGITAL GOLD RESERVE",
      description: "Secure your wealth in the digital age. Gold-backed, vault-secured, blockchain-verified.",
      cta1: "ENTER VAULT",
      cta2: "PROTOCOL DASHBOARD",
      ca: "CA: SOON"
    },
    zh: {
      title: "金之金库",
      subtitle: "GOLD VAULT",
      tagline: "终极数字黄金储备",
      description: "在数字时代守护你的财富：黄金背书、金库级安全、链上可验证。",
      cta1: "进入金库",
      cta2: "协议仪表板",
      ca: "CA：即将公布"
    }
  };

  const t = content[language];

  // Floating gold particles
  const goldParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15
  }));

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-amber-950/20 text-white border-b-4 border-amber-600/50">
      {/* Hero Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ 
          backgroundImage: 'url(/hero_website.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0
        }}
      />
      
      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-1" />

      {/* Floating Gold Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {goldParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: '-10px',
              boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, Math.sin(particle.id) * 50, 0],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      {/* Navbar/Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <div className="relative z-50 transform -rotate-1 border-2 border-amber-500 bg-black/90 backdrop-blur-sm px-6 py-2 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
           <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider">
              <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                {language === "en" ? "JinVault" : "金之金库"}
              </span>
           </h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleLanguage}
            className="px-3 py-2 border-2 border-amber-500 bg-black/90 backdrop-blur-sm hover:bg-amber-500/20 transition-colors rounded-lg cursor-pointer font-mono text-amber-300"
            title="Toggle Language"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold">{language === "en" ? "中文" : "EN"}</span>
            </div>
          </button>
          <a 
            href="https://x.com/JinVault" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 border-2 border-amber-500 bg-black/90 backdrop-blur-sm hover:bg-amber-500/20 transition-colors rounded-full cursor-pointer"
            data-testid="link-twitter-hero"
          >
            <Twitter className="w-5 h-5 text-amber-300" />
          </a>
          <a 
            href="https://t.me/JinVault" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 border-2 border-amber-500 bg-black/90 backdrop-blur-sm hover:bg-amber-500/20 transition-colors rounded-full cursor-pointer"
            data-testid="link-telegram-hero"
          >
            <Send className="w-5 h-5 text-amber-300" />
          </a>
        </div>
      </div>

      {/* CA Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-24 md:top-28 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="bg-black/90 backdrop-blur-sm border-2 border-amber-500 px-6 py-3 font-mono text-sm md:text-base shadow-[0_0_30px_rgba(251,191,36,0.4)]">
          <span className="text-amber-400 font-bold">{language === "en" ? "CA:" : "CA："}</span>
          <span className="text-amber-100 ml-2 tracking-wider" data-testid="ca-address">
            {stats?.tokenMint ? stats.tokenMint : (language === "en" ? "SOON" : "即将公布")}
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-30 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-block"
        >
          <motion.h1 
            className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-2"
            style={{
              textShadow: '0 0 40px rgba(251, 191, 36, 0.5), 0 0 80px rgba(251, 191, 36, 0.3)'
            }}
          >
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              {t.title}
            </span>
          </motion.h1>
          
          {language === "zh" && (
            <motion.p 
              className="text-2xl md:text-3xl font-bold text-amber-300/80 mb-4 tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t.subtitle}
            </motion.p>
          )}
          
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black font-mono font-bold text-lg md:text-2xl px-8 py-3 inline-block transform -rotate-1 border-4 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.4)] mb-8 mt-4">
            {t.tagline}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <p className="text-xl md:text-2xl text-amber-100/90 font-medium leading-relaxed backdrop-blur-sm bg-black/30 p-6 rounded-lg border border-amber-500/30">
            {t.description}
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <motion.button 
              className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black font-black text-lg uppercase tracking-widest hover:from-amber-500 hover:to-amber-500 transition-all duration-300 shadow-[0_0_30px_rgba(251,191,36,0.4)] border-4 border-amber-400 cursor-pointer relative overflow-hidden group" 
              data-testid="button-buy"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">{t.cta1}</span>
              <motion.div 
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
            <a href="#dashboard">
              <motion.button 
                className="w-full md:w-auto px-10 py-4 bg-transparent border-4 border-amber-500 text-amber-300 font-black text-lg uppercase tracking-widest hover:bg-amber-500/20 transition-all duration-300 backdrop-blur-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] cursor-pointer" 
                data-testid="button-dashboard"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t.cta2}
              </motion.button>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Vault Door Bottom Border Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50 z-40" />
    </div>
  );
}
