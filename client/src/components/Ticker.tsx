export function Ticker() {
  const items = [
    "🏆 GOLD ATH $4,530",
    "💀 DOLLAR IS DYING",
    "🚀 WE ARE SO BACK",
    "📈 GOLD SUPERCYCLE CONFIRMED",
    "🖨️ FED PRINTING INFINITE CASH",
    "💎 BUY THE DIP",
    "🔐 HODL FOR GOLD",
    "🌕 JINVAULT TO THE MOON",
    "⚡ NO STAKING JUST EARN",
    "🔥 SUPPLY BURN IMMINENT",
    "🏛️ 金之金库 LIVE",
    "💰 金仓 ACTIVE"
  ];

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-black overflow-hidden py-3 border-y-4 border-amber-400 relative z-30 font-bold font-mono text-lg uppercase tracking-wider shadow-[0_0_40px_rgba(251,191,36,0.3)]">
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="mx-8 flex items-center">
            <span className="mr-2 text-amber-900">▲</span> {item}
          </span>
        ))}
        {items.map((item, i) => (
          <span key={`dup-${i}`} className="mx-8 flex items-center">
            <span className="mr-2 text-amber-900">▲</span> {item}
          </span>
        ))}
      </div>
    </div>
  );
}
