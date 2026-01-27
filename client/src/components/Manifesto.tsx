import { motion } from "framer-motion";

export function Manifesto() {
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
                    The<br/>Prophecy
                  </span>
                </h2>
                <p className="text-amber-600 text-lg mt-2">预言</p>
              </div>
              <div className="text-right font-mono font-bold text-amber-500">
                 <p>DOC_ID: VAULT-8888</p>
                 <p className="text-red-500">CONFIDENTIAL</p>
                 <p className="text-xs text-amber-700">机密文件</p>
              </div>
            </div>
            
            <div className="space-y-8 text-xl md:text-2xl leading-relaxed text-amber-50">
              <p>
                <span className="float-left text-7xl font-black mr-4 mt-[-10px] bg-gradient-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">T</span>he year is 2025. Gold is at $4,530. The dollar is dissolving into digital dust. The suits at Wall Street are panicking. They told you inflation was "transitory". They lied.
              </p>
              <p>
                <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-black px-4 py-2 font-bold transform -rotate-1 inline-block border-4 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.6)]">JinVault (金之金库)</span> isn't just a memecoin. It's an index fund for the end of the world. It's a bet on the shiny rock that has outlasted every empire in history.
              </p>
              <p>
                While other coins offer you dreams of dogs in hats, we offer you the heavy, cold, hard reality of <strong className="underline decoration-4 decoration-amber-400 text-amber-200">REAL GOLD</strong>. With 100x leverage on culture.
              </p>
              
              <div className="bg-black/80 backdrop-blur-sm p-8 border-l-8 border-amber-400 border-4 border-amber-500/50 mt-12 shadow-[0_0_50px_rgba(251,191,36,0.4)]">
                <p className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-2">MISSION DIRECTIVE</p>
                <p className="text-xs text-amber-500/80 mb-4">任务指令</p>
                <ol className="list-decimal list-inside space-y-3 font-black text-2xl uppercase text-amber-300">
                  <li>ACCUMULATE GOLD <span className="text-sm text-amber-500 font-bold">积累黄金</span></li>
                  <li>BURN THE SUPPLY <span className="text-sm text-amber-500 font-bold">销毁供应</span></li>
                  <li>ASCEND <span className="text-sm text-amber-500 font-bold">升天</span></li>
                </ol>
              </div>
            </div>

            <div className="mt-16 flex justify-center">
              <button className="px-12 py-6 bg-gradient-to-r from-red-700 to-red-900 text-white border-4 border-red-500 font-black text-2xl uppercase tracking-widest hover:from-red-600 hover:to-red-800 transition-all shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:shadow-[0_0_60px_rgba(239,68,68,0.6)] hover:-translate-y-1 transform cursor-pointer">
                Execute Order 66
                <span className="block text-sm mt-1">执行66号命令</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
