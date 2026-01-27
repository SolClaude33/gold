import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import fedPrinter from "@assets/generated_images/fed_money_printer_glitch_art.png";
import newsOverlay from "@assets/generated_images/gold_bull_market_tv_news.png";
import vaultImg from "@assets/generated_images/cyberpunk_gold_vault.png";

export function NewsSection() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "THE GOLD TIMES",
      vol: "VOL. 69",
      edition: "EDITION: END GAME",
      breakingNews: "Breaking News",
      breakingNewsTitle: "THOUSANDS WAKING UP TO THE REALITY: FIAT IS WORTH ZERO",
      breakingNewsDesc: "In a moment of awakening that could redefine global finance, millions are realizing that green paper is just paper. JinVault represents the paradigm shift back to hard assets.",
      fedPrinter: "Fed Printer Glitch",
      mustRead: "Must Read",
      mustRead1: "THE SECRET TO LIFE IS GOLD",
      mustRead2: "5 REASONS TO DUMP USD",
      mustRead3: "EXPLAINER: THE BURN",
      watchLive: "WATCH LIVE",
      nowPlaying: "NOW PLAYING:",
      documentary: "\"WE ARE SO BACK\" - THE JINVAULT DOCUMENTARY",
      goldTV: "GOLD TV",
      liveCoverage: "Live Coverage",
      onAir: "On Air",
      video1Status: "On Air",
      video1Label: "Live",
      video1Title: "THE CRASH IS HERE",
      video1Source: "WSJ EXPLAINS • 1.2M VIEWS",
      video2Status: "Breaking",
      video2Title: "GOLD TO THE MOON?",
      video2Source: "BLOOMBERG • 850K VIEWS",
      video3Status: "Alert",
      video3Title: "ALL TIME HIGHS",
      video3Source: "CNBC • 2.5M VIEWS",
      quote: "\"We are literally giving you GOLD. Hold the token, get paid in real assets. Inflation is theft, JinVault is the vault.\""
    },
    zh: {
      title: "黄金时报",
      vol: "第 69 期",
      edition: "特刊：终局",
      breakingNews: "突发新闻",
      breakingNewsTitle: "成千上万人正在醒悟：法币终将归零",
      breakingNewsDesc: '一场可能重塑全球金融的集体觉醒正在发生——越来越多人发现，所谓"绿纸"终究只是纸。JinVault 代表的是回归硬资产的范式转移。',
      fedPrinter: "美联储印钞机故障",
      mustRead: "必读",
      mustRead1: "人生的秘密：黄金",
      mustRead2: "抛售美元的 5 个理由",
      mustRead3: "科普：销毁机制",
      watchLive: "观看直播",
      nowPlaying: "正在播放：",
      documentary: "《我们强势回归》— JinVault 纪录片",
      goldTV: "GOLD TV",
      liveCoverage: "实时报道",
      onAir: "直播中",
      video1Status: "直播中",
      video1Label: "现场",
      video1Title: "崩盘来了",
      video1Source: "WSJ EXPLAINS • 120万次观看",
      video2Status: "快讯",
      video2Title: "黄金要上天？",
      video2Source: "BLOOMBERG • 85万次观看",
      video3Status: "警报",
      video3Title: "历史新高",
      video3Source: "CNBC • 250万次观看",
      quote: '"我们是在把黄金直接送到你手上。拿住代币，就能拿到真实资产收益。通胀就是偷窃，JinVault 就是金库。"'
    }
  };

  const t = content[language];

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
                {language === "en" ? (
                  <>THE GOLD<br/>TIMES</>
                ) : (
                  t.title
                )}
              </span>
            </h2>
          </div>
          <div className="text-right font-mono font-bold mt-4 md:mt-0 text-amber-400">
             <p className="text-lg">{t.vol}</p>
             <p className="bg-gradient-to-r from-amber-500 to-amber-600 text-black inline-block px-4 py-2 border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]">{t.edition}</p>
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
                {t.breakingNews}
              </div>
              <h3 className="text-4xl md:text-5xl font-bold leading-tight mb-4 hover:text-amber-400 transition-colors cursor-pointer">
                <a href="https://www.bloomberg.com/news/articles/2025-12-25/silver-rises-to-record-gold-near-all-time-high-as-risks-persist" target="_blank" rel="noopener noreferrer">
                  {t.breakingNewsTitle}
                </a>
              </h3>
              <p className="text-xl md:text-2xl text-amber-200/80 leading-relaxed mb-6">
                {t.breakingNewsDesc}
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
               <h4 className="font-black text-2xl mb-2 uppercase">{t.mustRead}</h4>
               <ul className="space-y-4 font-bold font-mono text-sm">
                 <li className="flex items-center gap-2 hover:underline cursor-pointer">
                   <ArrowRight className="w-4 h-4" /> 
                   <a href="https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-full-year-2024/central-banks" target="_blank" rel="noopener noreferrer">{t.mustRead1}</a>
                 </li>
                 <li className="flex items-center gap-2 hover:underline cursor-pointer">
                   <ArrowRight className="w-4 h-4" /> 
                   <a href="https://www.morganstanley.com/insights/articles/us-dollar-declines" target="_blank" rel="noopener noreferrer">{t.mustRead2}</a>
                 </li>
                 <li className="flex items-center gap-2 hover:underline cursor-pointer">
                   <ArrowRight className="w-4 h-4" /> 
                   <a href="https://www.investopedia.com/tech/cryptocurrency-burning-can-it-manage-inflation/" target="_blank" rel="noopener noreferrer">{t.mustRead3}</a>
                 </li>
               </ul>
            </div>

            <div className="bg-zinc-900 p-6 border-4 border-amber-500/50 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
               <h4 className="text-amber-400 font-bold text-xl mb-4 flex items-center gap-2">
                 <PlayCircle /> {t.watchLive}
               </h4>
               <div className="aspect-square bg-black mb-4 relative overflow-hidden group cursor-pointer border-2 border-amber-500/30">
                 <img src={newsOverlay} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                     <PlayCircle className="w-8 h-8 text-white fill-current" />
                   </div>
                 </div>
               </div>
               <p className="font-mono text-sm text-amber-600 mb-2">{t.nowPlaying}</p>
               <p className="font-bold text-lg leading-tight text-amber-300">{t.documentary}</p>
            </div>

          </div>
        </div>

        {/* Full Width Metal TV Section */}
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-amber-600/50 pb-2">
             <div>
               <h4 className="font-bold text-3xl uppercase text-amber-400">{t.goldTV}</h4>
               <p className="font-mono text-sm text-amber-700 uppercase tracking-widest">{t.liveCoverage}</p>
             </div>
             <div className="flex items-center gap-2">
               <span className="animate-pulse w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"></span>
               <span className="font-bold text-red-500 uppercase">{t.onAir}</span>
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
                    {t.video1Label}
                  </div>
                </div>
                <h5 className="font-bold text-lg leading-tight group-hover:text-amber-400 transition-colors text-amber-100">{t.video1Title}</h5>
                <p className="text-xs font-mono text-amber-700 mt-1">{t.video1Source}</p>
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
                    {t.video2Status}
                  </div>
                </div>
                <h5 className="font-bold text-lg leading-tight group-hover:text-amber-400 transition-colors text-amber-100">{t.video2Title}</h5>
                <p className="text-xs font-mono text-amber-700 mt-1">{t.video2Source}</p>
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
                    {t.video3Status}
                  </div>
                </div>
                <h5 className="font-bold text-lg leading-tight group-hover:text-amber-400 transition-colors text-amber-100">{t.video3Title}</h5>
                <p className="text-xs font-mono text-amber-700 mt-1">{t.video3Source}</p>
              </div>
           </div>

           <div className="bg-amber-950/30 border-l-4 border-amber-500 p-6 mt-8 backdrop-blur-sm">
             <p className="font-bold text-xl uppercase italic text-amber-300">
               {t.quote}
             </p>
           </div>
        </div>

      </div>
    </section>
  );
}
