import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { LiveDashboard } from "@/components/LiveDashboard";
import { Tokenomics } from "@/components/Tokenomics";
import { Narrative } from "@/components/Narrative";
import { NewsSection } from "@/components/NewsSection";
import { MediaHub } from "@/components/MediaHub";
import { Manifesto } from "@/components/Manifesto";
import { motion, useScroll, useSpring } from "framer-motion";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

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
            <p className="text-amber-400/80 font-medium mb-8 text-lg">金之金库 · 金仓</p>
            <div className="flex justify-center gap-8 mb-8">
                <a href="https://x.com/JinVault" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">Twitter</a>
                <a href="https://flap.sh/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">Flap</a>
            </div>
            <p className="text-amber-100/60 text-sm max-w-2xl mx-auto leading-relaxed">
                DISCLAIMER: This is a digital asset. The "Gold" mentioned are tokenized assets. 
                We are not financial advisors. Don't risk money you can't afford to lose.
            </p>
            <p className="text-amber-900 text-xs mt-8 font-mono">
                © 2026 JinVault. ALL RIGHTS RESERVED.
            </p>
        </div>
      </footer>
    </div>
  );
}
