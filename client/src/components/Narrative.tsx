import { motion } from "framer-motion";
import chartImg from "@assets/generated_images/gold_vs_dollar_chart_showing_dollar_crashing_and_gold_mooning.png";

export function Narrative() {
  return (
    <section className="py-24 relative text-amber-950 border-y-4 border-amber-800/70 overflow-hidden">
      {/* Papiro Background */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundImage: 'url(/papireback.png)',
          backgroundSize: 'auto',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          opacity: 0.7
        }}
      />
      
      {/* Overlay suave */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/35 via-zinc-900/45 to-amber-950/35" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/25" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-16">
          
          <div className="w-full md:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative p-2 bg-amber-900/80 backdrop-blur-sm border-4 border-amber-950 shadow-[6px_6px_0px_rgba(0,0,0,0.6)]"
            >
               <img 
                 src={chartImg} 
                 alt="Gold vs Dollar Chart" 
                 className="relative z-10 w-full transition-all duration-500"
               />
               <div className="absolute top-4 left-4 bg-red-800 text-amber-50 font-black px-4 py-2 border-4 border-red-950 transform -rotate-2 z-20 text-xl shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                 FIAT COLLAPSE IMMINENT
               </div>
            </motion.div>
          </div>

          <div className="w-full md:w-1/2 space-y-8">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black uppercase leading-[0.8]"
            >
              <span className="bg-gradient-to-r from-amber-900 via-amber-950 to-black bg-clip-text text-transparent drop-shadow-[2px_2px_4px_rgba(251,191,36,0.3)]">
                Why We<br/>Are Here
              </span>
            </motion.h2>
            <p className="text-amber-900 text-lg font-bold">我们为何而来</p>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-6 text-amber-950/90 text-xl leading-relaxed font-serif"
            >
              <p>
                <strong className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-amber-50 px-3 py-1 border-4 border-amber-950 shadow-[3px_3px_0px_rgba(0,0,0,0.5)]">Gold hit $4,530.</strong> This isn't just a number. It's a signal. The signal that the 50-year experiment of fiat currency is coming to an end.
              </p>
              <p>
                Governments are printing trillions. Your purchasing power is being stolen every second you hold cash. They call it "Quantitative Easing". We call it theft.
              </p>
              <p>
                <strong className="bg-zinc-950 text-amber-400 px-3 py-1 border-4 border-amber-900 shadow-[3px_3px_0px_rgba(0,0,0,0.5)]">JinVault (金之金库)</strong> is the answer. We don't just meme about wealth. We capture it. By automatically converting fees into REAL tokenized Gold, we build a floor that cannot be rugged.
              </p>
            </motion.div>

            <motion.div
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="grid grid-cols-2 gap-4"
            >
              <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 p-6 border-4 border-amber-950 shadow-[6px_6px_0px_rgba(0,0,0,0.6)]">
                <h4 className="font-black text-xl mb-1 uppercase text-amber-50">SAFE HAVEN</h4>
                <p className="text-xs text-amber-200 mb-2">避风港</p>
                <p className="text-sm text-amber-100">Historically proven for 5,000 years.</p>
              </div>
              <div className="bg-gradient-to-br from-red-800 to-red-950 p-6 border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.6)]">
                <h4 className="font-black text-xl mb-1 uppercase text-amber-50">ANTI-INFLATION</h4>
                <p className="text-xs text-red-200 mb-2">抗通胀</p>
                <p className="text-sm text-amber-100">The only hedge that matters.</p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
