import { useState, useEffect } from "react";

const RamadanSplash = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2200);
    const remove = setTimeout(onComplete, 2800);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-600 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Decorative crescent */}
      <div className="relative mb-6 animate-fade-in">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="drop-shadow-[0_0_30px_rgba(212,175,55,0.5)]">
          <path
            d="M60 40c0 16.569-13.431 30-30 30 4.477 0 8.694-1.005 12.5-2.8C54.16 61.54 62 51.68 62 40s-7.84-21.54-19.5-27.2A29.87 29.87 0 0030 10c16.569 0 30 13.431 30 30z"
            fill="url(#gold-gradient)"
          />
          <defs>
            <linearGradient id="gold-gradient" x1="30" y1="10" x2="62" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F5E6A3" />
              <stop offset="0.5" stopColor="#D4AF37" />
              <stop offset="1" stopColor="#B8860B" />
            </linearGradient>
          </defs>
        </svg>
        {/* Star */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute top-1 right-0 animate-pulse">
          <path d="M8 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" fill="#D4AF37" />
        </svg>
      </div>

      {/* Text */}
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-2 animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
        Ramadan <span className="text-[#D4AF37]">Kareem</span>
      </h1>

      <p className="text-lg sm:text-2xl font-semibold text-[#D4AF37] mb-1 animate-fade-up" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
        Up to 75% OFF
      </p>

      <p className="text-sm text-white/60 animate-fade-up" style={{ animationDelay: "0.8s", animationFillMode: "both" }}>
        Desert Deal — Shop With Confidence
      </p>

      {/* Loading bar */}
      <div className="mt-8 w-40 h-1 rounded-full bg-white/10 overflow-hidden animate-fade-up" style={{ animationDelay: "1s", animationFillMode: "both" }}>
        <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3] rounded-full animate-[loading_2s_ease-in-out_forwards]" />
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default RamadanSplash;
