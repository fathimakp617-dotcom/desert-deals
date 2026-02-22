import { useState, useEffect } from "react";

const RamadanSplash = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2800);
    const remove = setTimeout(onComplete, 3400);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-600 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{ background: "linear-gradient(180deg, #0a0e2a 0%, #111b47 40%, #1a2a6c 70%, #0f1a3a 100%)" }}
    >
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              top: `${Math.random() * 50}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: 0.4 + Math.random() * 0.6,
            }}
          />
        ))}
      </div>

      {/* Mosque silhouette at bottom */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full opacity-20"
        viewBox="0 0 1200 200"
        fill="none"
        preserveAspectRatio="xMidYMax slice"
        style={{ maxHeight: "180px" }}
      >
        {/* Domes */}
        <ellipse cx="600" cy="140" rx="120" ry="80" fill="#1a2a6c" stroke="#D4AF37" strokeWidth="1" />
        <ellipse cx="400" cy="160" rx="80" ry="50" fill="#1a2a6c" stroke="#D4AF37" strokeWidth="0.5" />
        <ellipse cx="800" cy="160" rx="80" ry="50" fill="#1a2a6c" stroke="#D4AF37" strokeWidth="0.5" />
        {/* Minarets */}
        <rect x="280" y="80" width="12" height="120" fill="#0f1a3a" stroke="#D4AF37" strokeWidth="0.5" />
        <rect x="908" y="80" width="12" height="120" fill="#0f1a3a" stroke="#D4AF37" strokeWidth="0.5" />
        <rect x="560" y="50" width="10" height="90" fill="#0f1a3a" stroke="#D4AF37" strokeWidth="0.5" />
        <rect x="630" y="50" width="10" height="90" fill="#0f1a3a" stroke="#D4AF37" strokeWidth="0.5" />
        {/* Crescent on minaret */}
        <circle cx="565" cy="45" r="5" fill="none" stroke="#D4AF37" strokeWidth="1" />
        <circle cx="635" cy="45" r="5" fill="none" stroke="#D4AF37" strokeWidth="1" />
        {/* Base */}
        <rect x="0" y="170" width="1200" height="30" fill="#0a0e2a" />
      </svg>

      {/* Crescent moon */}
      <div className="relative mb-4 animate-fade-in">
        <svg width="70" height="70" viewBox="0 0 80 80" fill="none" className="drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]">
          <path
            d="M58 40c0 14.912-12.088 27-27 27 4.03 0 7.825-.905 11.25-2.52C53.14 59.31 60 50.41 60 40s-6.86-19.31-17.75-24.48A26.89 26.89 0 0131 13c14.912 0 27 12.088 27 27z"
            fill="url(#moon-grad)"
          />
          <defs>
            <linearGradient id="moon-grad" x1="31" y1="13" x2="60" y2="67" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF8DC" />
              <stop offset="0.5" stopColor="#D4AF37" />
              <stop offset="1" stopColor="#B8860B" />
            </linearGradient>
          </defs>
        </svg>
        {/* Small star near crescent */}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="absolute -top-1 right-0 animate-pulse">
          <path d="M8 0l1.5 5.5H15l-4.5 3.5 1.5 5.5L8 11l-4 3.5 1.5-5.5L1 5.5h5.5z" fill="#D4AF37" />
        </svg>
      </div>

      {/* Lantern */}
      <div className="relative mb-6 animate-fade-up" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
        <svg width="50" height="80" viewBox="0 0 50 80" fill="none" className="drop-shadow-[0_0_25px_rgba(212,175,55,0.5)]">
          {/* Hook */}
          <path d="M22 0 Q25 -2 28 0 L28 8 L22 8 Z" fill="#D4AF37" />
          {/* Top cap */}
          <path d="M15 8 L35 8 L32 16 L18 16 Z" fill="url(#lantern-cap)" />
          {/* Body */}
          <rect x="16" y="16" width="18" height="44" rx="2" fill="url(#lantern-body)" opacity="0.9" />
          {/* Glow inside */}
          <rect x="18" y="18" width="14" height="40" rx="1" fill="url(#lantern-glow)" opacity="0.7" />
          {/* Pattern lines */}
          <line x1="20" y1="20" x2="20" y2="56" stroke="#D4AF37" strokeWidth="0.5" opacity="0.5" />
          <line x1="25" y1="18" x2="25" y2="58" stroke="#D4AF37" strokeWidth="0.5" opacity="0.5" />
          <line x1="30" y1="20" x2="30" y2="56" stroke="#D4AF37" strokeWidth="0.5" opacity="0.5" />
          <line x1="18" y1="28" x2="32" y2="28" stroke="#D4AF37" strokeWidth="0.3" opacity="0.4" />
          <line x1="18" y1="38" x2="32" y2="38" stroke="#D4AF37" strokeWidth="0.3" opacity="0.4" />
          <line x1="18" y1="48" x2="32" y2="48" stroke="#D4AF37" strokeWidth="0.3" opacity="0.4" />
          {/* Bottom cap */}
          <path d="M18 60 L32 60 L28 68 L22 68 Z" fill="url(#lantern-cap)" />
          {/* Bottom finial */}
          <circle cx="25" cy="72" r="3" fill="#D4AF37" />
          <defs>
            <linearGradient id="lantern-cap" x1="15" y1="8" x2="35" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D4AF37" />
              <stop offset="1" stopColor="#B8860B" />
            </linearGradient>
            <linearGradient id="lantern-body" x1="16" y1="16" x2="34" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1a1a2e" />
              <stop offset="1" stopColor="#0f0f1a" />
            </linearGradient>
            <radialGradient id="lantern-glow" cx="0.5" cy="0.4" r="0.6">
              <stop stopColor="#FFD700" stopOpacity="0.6" />
              <stop offset="0.6" stopColor="#D4AF37" stopOpacity="0.2" />
              <stop offset="1" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
        {/* Light glow beneath lantern */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-8 bg-[#D4AF37]/10 rounded-full blur-xl" />
      </div>

      {/* Text */}
      <h1
        className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-2 animate-fade-up"
        style={{ animationDelay: "0.5s", animationFillMode: "both" }}
      >
        Ramadan <span className="text-[#D4AF37]">Kareem</span>
      </h1>

      <p
        className="text-xl sm:text-3xl font-bold text-[#D4AF37] mb-1 animate-fade-up tracking-wide"
        style={{ animationDelay: "0.8s", animationFillMode: "both" }}
      >
        UP TO 75% OFF
      </p>

      <p
        className="text-xs sm:text-sm text-white/50 animate-fade-up"
        style={{ animationDelay: "1.1s", animationFillMode: "both" }}
      >
        Desert Deal — Shop With Confidence
      </p>

      {/* Loading bar */}
      <div
        className="mt-8 w-44 h-1 rounded-full bg-white/10 overflow-hidden animate-fade-up"
        style={{ animationDelay: "1.3s", animationFillMode: "both" }}
      >
        <div className="h-full bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#FFF8DC] rounded-full animate-[splash-load_2.5s_ease-in-out_forwards]" />
      </div>

      <style>{`
        @keyframes splash-load {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default RamadanSplash;
