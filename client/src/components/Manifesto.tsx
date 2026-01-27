import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export function Manifesto() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "The Prophecy",
      subtitle: "",
      docId: "DOC_ID: 6900-X",
      confidential: "CONFIDENTIAL",
      paragraph1: "The year is 2025. Gold is at $5,079. The dollar is dissolving into digital dust. The suits at Wall Street are panicking. They told you inflation was \"transitory\". They lied.",
      paragraph2: "JinVault isn't just a memecoin. It's an index fund for the end of the world. It's a bet on the shiny rock that has outlasted every empire in history.",
      paragraph3: "While other coins offer you dreams of dogs in hats, we offer you the heavy, cold, hard reality of REAL GOLD. With 100x leverage on culture.",
      missionDirective: "MISSION DIRECTIVE",
      accumulate: "ACCUMULATE GOLD",
      distributes: "DISTRIBUTES",
      ascend: "ASCEND",
      executeOrder: "Execute Order 66"
    },
    zh: {
      title: "预言",
      subtitle: "",
      docId: "DOC_ID: 6900-X",
      confidential: "机密",
      paragraph1: '2025 年。黄金来到 $5,079。美元正在化作数字尘埃。华尔街西装们开始恐慌。他们曾告诉你通胀只是"暂时的"。他们撒谎了。',
      paragraph2: 'JinVault 不只是一个 memecoin。它是"世界终局"的指数基金——押注那块闪亮的石头：它见证并熬过了人类历史上每一个帝国。',
      paragraph3: '当别的币卖给你"戴帽子的狗"的梦，我们给你的是沉重、冰冷、坚硬的 REAL GOLD（真实黄金）。再用 100 倍的文化杠杆，把它推向大众。',
      missionDirective: "使命指令",
      accumulate: "囤积黄金",
      distributes: "销毁供应",
      ascend: "飞升",
      executeOrder: "执行 66 号指令"
    }
  };

  const t = content[language];
  return (
    <section className="py-24 relative text-amber-100 border-y-4 border-amber-600/50 overflow-hidden">
      {/* Goldback4 Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url(/goldback4.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70" />
      
      <div className="container mx-auto px-4 max-w-4xl relative z-10 pt-16 md:pt-24">
        <div className="border-4 border-amber-500 p-8 md:p-16 bg-black/60 backdrop-blur-md shadow-[0_0_80px_rgba(251,191,36,0.4)] relative">
          
          {/* Gold Shimmer Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-end justify-between mb-12 border-b-4 border-amber-600/50 pb-6">
              <div>
                <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8]">
                  <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                    {language === "en" ? (
                      <>The<br/>Prophecy</>
                    ) : (
                      t.title
                    )}
                  </span>
                </h2>
              </div>
              <div className="text-right font-mono font-bold text-amber-500">
                 <p>{t.docId}</p>
                 <p className="text-red-500">{t.confidential}</p>
              </div>
            </div>
            
            <div className="space-y-8 text-xl md:text-2xl leading-relaxed text-amber-50">
              <p>
                {language === "en" ? (
                  <>
                    <span className="float-left text-7xl font-black mr-4 mt-[-10px] bg-gradient-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">T</span>{t.paragraph1}
                  </>
                ) : (
                  <>
                    <span className="float-left text-7xl font-black mr-4 mt-[-10px] bg-gradient-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">2</span>{t.paragraph1}
                  </>
                )}
              </p>
              <p>
                {language === "en" ? (
                  <>
                    <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-black px-4 py-2 font-bold transform -rotate-1 inline-block border-4 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.6)]">JinVault</span> {t.paragraph2}
                  </>
                ) : (
                  <>
                    <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-black px-4 py-2 font-bold transform -rotate-1 inline-block border-4 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.6)]">JinVault</span> {t.paragraph2}
                  </>
                )}
              </p>
              <p>
                {t.paragraph3}
              </p>
              
              <div className="bg-black/80 backdrop-blur-sm p-8 border-l-8 border-amber-400 border-4 border-amber-500/50 mt-12 shadow-[0_0_50px_rgba(251,191,36,0.4)]">
                <p className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">{t.missionDirective}</p>
                <ol className="list-decimal list-inside space-y-3 font-black text-2xl uppercase text-amber-300">
                  <li>{t.accumulate}</li>
                  <li>{t.distributes}</li>
                  <li>{t.ascend}</li>
                </ol>
              </div>
            </div>

            <div className="mt-16 flex justify-center">
              <button className="px-12 py-6 bg-gradient-to-r from-red-700 to-red-900 text-white border-4 border-red-500 font-black text-2xl uppercase tracking-widest hover:from-red-600 hover:to-red-800 transition-all shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:shadow-[0_0_60px_rgba(239,68,68,0.6)] hover:-translate-y-1 transform cursor-pointer">
                {t.executeOrder}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
