import { useLanguage } from "@/contexts/LanguageContext";

export function Ticker() {
  const { language } = useLanguage();

  const items = {
    en: [
      "▲ GOLD ATH $5,079",
      "▲ DOLLAR IS DYING",
      "▲ WE ARE SO BACK",
      "▲ GOLD SUPERCYCLE CONFIRMED",
      "▲ FED PRINTING INFINITE CASH",
      "▲ BUY THE DIP",
      "▲ HODL FOR GOLD",
      "▲ GOLDENBAO TO THE MOON",
      "▲ NO STAKING JUST EARN",
      "▲ SUPPLY BURN IMMINENT"
    ],
    zh: [
      "▲ GOLD ATH $5,079",
      "▲ 美元正在走向终结",
      "▲ 我们强势回归",
      "▲ 黄金超级周期已确认",
      "▲ 美联储无限印钞",
      "▲ 逢低加仓",
      "▲ 抱紧等黄金",
      "▲ GOLDENBAO 冲月",
      "▲ 无需质押，自动收益",
      "▲ 即将开启销毁"
    ]
  };

  const tickerItems = items[language];

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-black overflow-hidden py-3 border-y-4 border-amber-400 relative z-30 font-bold font-mono text-lg uppercase tracking-wider shadow-[0_0_40px_rgba(251,191,36,0.3)]">
      <div className="flex animate-ticker whitespace-nowrap">
        {tickerItems.map((item, i) => (
          <span key={i} className="mx-8 flex items-center">
            {item}
          </span>
        ))}
        {tickerItems.map((item, i) => (
          <span key={`dup-${i}`} className="mx-8 flex items-center">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
