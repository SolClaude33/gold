import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Play } from "lucide-react";
import fedPrinter from "@assets/generated_images/fed_money_printer_glitch_art.png";
import newsOverlay from "@assets/generated_images/gold_bull_market_tv_news.png";
import vaultImg from "@assets/generated_images/cyberpunk_gold_vault.png";

export function NewsSection() {
  const videos = [
    {
      title: "THE CRASH IS HERE",
      duration: "0:45",
      views: "1.2M Views"
    },
    {
      title: "WHY GOLD? WHY NOW?",
      duration: "2:20",
      views: "850K Views"
    },
    {
      title: "JINVAULT EXPLAINED",
      duration: "1:15",
      views: "2.5M Views"
    }
  ];

  return (
    <section className="py-24 relative text-amber-100 border-y-4 border-amber-600/50 overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundImage: 'url(/backgroundnazi.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity: 0.85
        }}
      />
      
      {/* Overlay oscuro para contraste */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-900/70 to-zinc-950/60" />
      
      {/* Vignette en los bordes */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />
      
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-amber-600/50 pb-6 mb-12">
          <div>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8]">
              <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[2px_2px_8px_rgba(251,191,36,0.5)]">
                THE GOLD<br/>TIMES
              </span>
            </h2>
            <p className="text-amber-400 text-lg mt-2 font-bold">黄金时报</p>
          </div>
          <div className="text-right font-mono font-bold mt-4 md:mt-0 text-amber-400">
             <p className="text-lg">VOL. 8888</p>
             <p className="bg-gradient-to-r from-amber-500 to-amber-600 text-black inline-block px-4 py-2 border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]">EDITION: END GAME</p>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          
          {/* Main Story */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="border-b-2 border-amber-600/30 pb-8"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-800 text-white inline-block px-3 py-1 font-bold text-sm mb-4 uppercase tracking-wider animate-pulse border-2 border-red-400">
                Breaking News | 突发新闻
              </div>
              <h3 className="text-4xl md:text-5xl font-bold leading-tight mb-4 hover:text-amber-400 transition-colors cursor-pointer">
                <a href="https://www.bloomberg.com/news/articles/2025-12-25/silver-rises-to-record-gold-near-all-time-high-as-risks-persist" target="_blank" rel="noopener noreferrer">
                  THOUSANDS WAKING UP TO THE REALITY: FIAT IS WORTH ZERO
                </a>
              </h3>
              <p className="text-xl md:text-2xl text-amber-200/80 leading-relaxed mb-6">
                In a moment of awakening that could redefine global finance, millions are realizing that green paper is just paper. JinVault (金之金库) represents the paradigm shift back to hard assets.
              </p>
              
              <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden group border-4 border-amber-500 shadow-[0_0_40px_rgba(251,191,36,0.3)]">
                <img 
                  src={fedPrinter} 
                  alt="Fed Printer Glitch" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            
            <div className="border-4 border-amber-500 p-6 bg-gradient-to-br from-amber-600 to-amber-800 text-black shadow-[0_0_40px_rgba(251,191,36,0.3)]">
               <h4 className="font-black text-2xl mb-2 uppercase">Must Read</h4>
               <p className="text-xs text-amber-900 mb-4">必读</p>
               <ul className="space-y-4 font-bold font-mono text-sm">
                 <li className="flex items-center gap-2 hover:underline cursor-pointer">
                   <ArrowRight className="w-4 h-4" /> 
                   <a href="https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-full-year-2024/central-banks" target="_blank" rel="noopener noreferrer">THE SECRET TO LIFE IS GOLD</a>
                 </li>
                 <li className="flex items-center gap-2 hover:underline cursor-pointer">
                   <ArrowRight className="w-4 h-4" /> 
                   <a href="https://www.morganstanley.com/insights/articles/us-dollar-declines" target="_blank" rel="noopener noreferrer">5 REASONS TO DUMP USD</a>
                 </li>
                 <li className="flex items-center gap-2 hover:underline cursor-pointer">
                   <ArrowRight className="w-4 h-4" /> 
                   <a href="https://www.investopedia.com/tech/cryptocurrency-burning-can-it-manage-inflation/" target="_blank" rel="noopener noreferrer">EXPLAINER: THE BURN</a>
                 </li>
               </ul>
            </div>

            <div className="bg-zinc-900 p-6 border-4 border-amber-500/50 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
               <h4 className="text-amber-400 font-bold text-xl mb-4 flex items-center gap-2">
                 <PlayCircle /> WATCH LIVE <span className="text-sm text-amber-600">观看直播</span>
               </h4>
               <div className="aspect-square bg-black mb-4 relative overflow-hidden group cursor-pointer border-2 border-amber-500/30">
                 <img src={newsOverlay} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                     <PlayCircle className="w-8 h-8 text-white fill-current" />
                   </div>
                 </div>
               </div>
               <p className="font-mono text-sm text-amber-600 mb-2">NOW PLAYING:</p>
               <p className="font-bold text-lg leading-tight text-amber-300">"WE ARE SO BACK" - THE JINVAULT DOCUMENTARY</p>
            </div>

          </div>
        </div>

        {/* Full Width Metal TV Section */}
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-amber-600/50 pb-2">
             <div>
               <h4 className="font-bold text-3xl uppercase text-amber-400">GOLD TV</h4>
               <p className="text-xs text-amber-600">黄金电视台</p>
               <p className="font-mono text-sm text-amber-700 uppercase tracking-widest">Live Coverage</p>
             </div>
             <div className="flex items-center gap-2">
               <span className="animate-pulse w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"></span>
               <span className="font-bold text-red-500 uppercase">On Air</span>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Video 1 */}
              <div className="group">
                <div className="relative w-full aspect-video border-4 border-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.3)] mb-3 overflow-hidden bg-black">
                   <iframe 
                    src="https://www.youtube.com/embed/OzjYNVJwqH0" 
                    title="WSJ Gold Charts" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="absolute inset-0 w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500 object-cover"
                  ></iframe>
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider z-10 pointer-events-none">
                    Live
                  </div>
                </div>
                <h5 className="font-bold text-lg leading-tight group-hover:text-amber-400 transition-colors text-amber-100">THE CRASH IS HERE</h5>
                <p className="text-xs font-mono text-amber-700 mt-1">WSJ EXPLAINS • 1.2M VIEWS</p>
              </div>

              {/* Video 2 */}
              <div className="group">
                <div className="relative w-full aspect-video border-4 border-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.3)] mb-3 overflow-hidden bg-black">
                   <iframe 
                    src="https://www.youtube.com/embed/_0pr1xnqEZI" 
                    title="Bloomberg Gold" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="absolute inset-0 w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500 object-cover"
                  ></iframe>
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider z-10 pointer-events-none">
                    Breaking
                  </div>
                </div>
                <h5 className="font-bold text-lg leading-tight group-hover:text-amber-400 transition-colors text-amber-100">GOLD TO THE MOON?</h5>
                <p className="text-xs font-mono text-amber-700 mt-1">BLOOMBERG • 850K VIEWS</p>
              </div>

              {/* Video 3 */}
              <div className="group">
                <div className="relative w-full aspect-video border-4 border-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.3)] mb-3 overflow-hidden bg-black">
                   <iframe 
                    src="https://www.youtube.com/embed/mhf2pPBL8nc" 
                    title="CNBC ATH" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="absolute inset-0 w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500 object-cover"
                  ></iframe>
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider z-10 pointer-events-none">
                    Alert
                  </div>
                </div>
                <h5 className="font-bold text-lg leading-tight group-hover:text-amber-400 transition-colors text-amber-100">ALL TIME HIGHS</h5>
                <p className="text-xs font-mono text-amber-700 mt-1">CNBC • 2.5M VIEWS</p>
              </div>
           </div>

           <div className="bg-amber-950/30 border-l-4 border-amber-500 p-6 mt-8 backdrop-blur-sm">
             <p className="font-bold text-xl uppercase italic text-amber-300">
               "We are literally giving you GOLD. Hold the token, get paid in real assets. Inflation is theft, JinVault is the vault."
             </p>
             <p className="text-sm text-amber-600 mt-2 italic">
               "我们真的在给你黄金。持有代币，获得真实资产的回报。通胀即盗窃，金之金库是您的保险库。"
             </p>
           </div>
        </div>

      </div>
    </section>
  );
}
