import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { LiveDashboard } from "@/components/LiveDashboard";
import { Tokenomics } from "@/components/Tokenomics";
import { Narrative } from "@/components/Narrative";
import { NewsSection } from "@/components/NewsSection";
import { MediaHub } from "@/components/MediaHub";
import { Manifesto } from "@/components/Manifesto";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useScroll, useSpring } from "framer-motion";

export default function Home() {
  const { language } = useLanguage();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const content = {
    en: {
      subtitle: "金之金库 · 金仓",
      disclaimer: "DISCLAIMER: This is a digital asset. The \"Gold\" mentioned are tokenized assets. We are not financial advisors. Don't risk money you can't afford to lose.",
      copyright: "© 2026 JinVault. ALL RIGHTS RESERVED."
    },
    zh: {
      subtitle: "金之金库 · 金仓",
      disclaimer: '免责声明：本项目为数字资产。"黄金"指代币化资产。我们不是财务顾问。不要投入你无法承受损失的资金。',
      copyright: "© 2026 JinVault. 保留所有权利。"
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white selection:bg-amber-500 selection:text-black">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-metal-gold origin-left z-50"
        style={{ scaleX }}
      />
      
      {/* CRT Scanline Overlay */}
      <div className="crt-overlay pointer-events-none z-[9999]" />

      <Hero />
      <Ticker />
      <NewsSection />
      <Narrative />
      <Tokenomics />
      <LiveDashboard />
      <Manifesto />
      
      {/* Footer */}
      <footer className="bg-gradient-to-b from-zinc-950 to-black py-12 border-t-4 border-amber-600/50">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                JinVault
              </span>
            </h2>
            <p className="text-amber-400/80 font-medium mb-8 text-lg">{t.subtitle}</p>
            <div className="flex justify-center gap-8 mb-8">
                <a href="https://x.com/JinVault" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">Twitter</a>
                <a href="https://t.me/JinVault" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">Telegram</a>
                <a href="https://flap.sh/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">Flap</a>
            </div>
            <p className="text-amber-100/60 text-sm max-w-2xl mx-auto leading-relaxed">
                {t.disclaimer}
            </p>
            <p className="text-amber-900 text-xs mt-8 font-mono">
                {t.copyright}
            </p>
        </div>
      </footer>
    </div>
  );
}
