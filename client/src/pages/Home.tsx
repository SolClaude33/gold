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
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-metal-gold selection:text-black">
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
      <footer className="bg-black py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">GoldenBao</h2>
            <div className="flex justify-center gap-8 mb-8">
                <a href="https://x.com/goldenbao" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-metal-gold transition-colors">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-metal-gold transition-colors">DexScreener</a>
                <a href="#" className="text-gray-400 hover:text-metal-gold transition-colors">Four.meme</a>
            </div>
            <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                DISCLAIMER: This is a memecoin. The "Gold" mentioned are tokenized assets. 
                We are not financial advisors. We are just a bull made of metal on the internet. 
                Price may go up, price may go down. Don't risk money you can't afford to lose to a robot bull.
            </p>
            <p className="text-gray-700 text-xs mt-8">
                © 2025 GoldenBao CORP. ALL RIGHTS RESERVED.
            </p>
        </div>
      </footer>
    </div>
  );
}
