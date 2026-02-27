import { useState, useEffect } from "react";
import logo from "@/assets/desert-deal-logo-header.png";

const RamadanSplash = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1200);
    const remove = setTimeout(onComplete, 1800);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{ background: "linear-gradient(160deg, #0c1220 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)" }}
    >
      {/* Animated stars */}
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${1 + Math.random() * 2.5}px`,
            height: `${1 + Math.random() * 2.5}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            background: `rgba(255, 215, 100, ${0.3 + Math.random() * 0.5})`,
            animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Golden glow behind crescent */}
      <div
        className="absolute rounded-full blur-3xl opacity-20"
        style={{
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, #d4a853 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
        }}
      />

      {/* Crescent moon + star */}
      <div className="relative mb-5 animate-fade-in">
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" className="drop-shadow-lg">
          <defs>
            <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5d47a" />
              <stop offset="50%" stopColor="#d4a853" />
              <stop offset="100%" stopColor="#b8860b" />
            </linearGradient>
          </defs>
          <path
            d="M70 50c0 18.64-15.11 33.75-33.75 33.75 5.04 0 9.78-1.13 14.06-3.15C62.93 74.14 72 63.01 72 50s-9.07-24.14-21.69-30.6A33.6 33.6 0 0136.25 16.25C54.89 16.25 70 31.36 70 50z"
            fill="url(#moonGrad)"
          />
        </svg>
        {/* Decorative star */}
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="absolute -top-2 right-0" style={{ animation: "pulse-glow 2s ease-in-out infinite" }}>
          <path d="M10 0l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L0 7h7z" fill="#f5d47a" />
        </svg>
        <svg width="10" height="10" viewBox="0 0 20 20" fill="none" className="absolute top-1 -left-3" style={{ animation: "pulse-glow 2.5s ease-in-out infinite 0.5s" }}>
          <path d="M10 0l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L0 7h7z" fill="#f5d47a" opacity="0.7" />
        </svg>
      </div>

      {/* Lantern decorations */}
      <div className="absolute top-8 left-8 sm:left-16 animate-fade-in" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
        <svg width="30" height="50" viewBox="0 0 40 70" fill="none" opacity="0.4">
          <rect x="14" y="0" width="12" height="6" rx="2" fill="#d4a853" />
          <line x1="20" y1="6" x2="20" y2="14" stroke="#d4a853" strokeWidth="1.5" />
          <ellipse cx="20" cy="40" rx="14" ry="24" fill="none" stroke="#d4a853" strokeWidth="1.5" />
          <ellipse cx="20" cy="40" rx="8" ry="24" fill="none" stroke="#d4a853" strokeWidth="0.8" opacity="0.5" />
        </svg>
      </div>
      <div className="absolute top-12 right-10 sm:right-20 animate-fade-in" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
        <svg width="24" height="40" viewBox="0 0 40 70" fill="none" opacity="0.3">
          <rect x="14" y="0" width="12" height="6" rx="2" fill="#d4a853" />
          <line x1="20" y1="6" x2="20" y2="14" stroke="#d4a853" strokeWidth="1.5" />
          <ellipse cx="20" cy="40" rx="14" ry="24" fill="none" stroke="#d4a853" strokeWidth="1.5" />
          <ellipse cx="20" cy="40" rx="8" ry="24" fill="none" stroke="#d4a853" strokeWidth="0.8" opacity="0.5" />
        </svg>
      </div>

      {/* Arabic-style geometric border line */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 sm:w-80 opacity-20 animate-fade-in" style={{ animationDelay: "1s", animationFillMode: "both" }}>
        <svg width="100%" height="12" viewBox="0 0 320 12" fill="none">
          <path d="M0 6h40l10-5 10 10 10-10 10 10 10-10 10 10 10-5h40l10-5 10 10 10-10 10 10 10-10 10 10 10-5h40" stroke="#d4a853" strokeWidth="1" />
        </svg>
      </div>

      {/* Ramadan Kareem text */}
      <h1
        className="text-4xl sm:text-6xl font-bold tracking-tight mb-1 animate-fade-up"
        style={{ animationDelay: "0.3s", animationFillMode: "both", color: "#f5d47a", textShadow: "0 2px 20px rgba(212, 168, 83, 0.3)" }}
      >
        Ramadan Kareem
      </h1>

      {/* Arabic calligraphy text */}
      <p
        className="text-2xl sm:text-3xl mb-4 animate-fade-up"
        style={{ animationDelay: "0.5s", animationFillMode: "both", fontFamily: "serif", color: "rgba(245, 212, 122, 0.6)", letterSpacing: "0.1em" }}
      >
        رمضان كريم
      </p>

      {/* Sale badge */}
      <div
        className="animate-fade-up mb-5"
        style={{ animationDelay: "0.7s", animationFillMode: "both" }}
      >
        <div className="relative px-8 py-2.5 border border-[#d4a853]/40 rounded-sm" style={{ background: "rgba(212, 168, 83, 0.08)" }}>
          <span className="text-xl sm:text-2xl font-bold tracking-[0.25em]" style={{ color: "#f5d47a" }}>
            UP TO 75% OFF
          </span>
        </div>
      </div>

      {/* Logo */}
      <img
        src={logo}
        alt="Desert Deal"
        className="h-10 sm:h-14 object-contain mb-1 animate-fade-up brightness-0 invert"
        style={{ animationDelay: "0.9s", animationFillMode: "both" }}
      />

      <p
        className="text-xs sm:text-sm animate-fade-up"
        style={{ animationDelay: "1.0s", animationFillMode: "both", color: "rgba(245, 212, 122, 0.5)" }}
      >
        Shop With Confidence
      </p>

      {/* Loading bar */}
      <div
        className="mt-8 w-48 h-[2px] rounded-full overflow-hidden animate-fade-up"
        style={{ animationDelay: "1.2s", animationFillMode: "both", background: "rgba(212, 168, 83, 0.15)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #d4a853, #f5d47a)", animation: "splash-load 1.2s ease-in-out forwards" }}
        />
      </div>

      <style>{`
        @keyframes splash-load {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 2px rgba(245,212,122,0.3)); }
          50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(245,212,122,0.6)); }
        }
      `}</style>
    </div>
  );
};

export default RamadanSplash;
