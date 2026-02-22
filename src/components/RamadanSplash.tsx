import { useState, useEffect } from "react";
import logo from "@/assets/desert-deal-logo-header.png";

const RamadanSplash = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2800);
    const remove = setTimeout(onComplete, 3400);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-600 bg-background ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Subtle pattern dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-foreground"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Minimal crescent */}
      <div className="relative mb-6 animate-fade-in">
        <svg width="60" height="60" viewBox="0 0 80 80" fill="none" className="opacity-90">
          <path
            d="M58 40c0 14.912-12.088 27-27 27 4.03 0 7.825-.905 11.25-2.52C53.14 59.31 60 50.41 60 40s-6.86-19.31-17.75-24.48A26.89 26.89 0 0131 13c14.912 0 27 12.088 27 27z"
            className="fill-foreground"
          />
        </svg>
        {/* Small star */}
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="absolute -top-1 right-0 animate-pulse">
          <path d="M8 0l1.5 5.5H15l-4.5 3.5 1.5 5.5L8 11l-4 3.5 1.5-5.5L1 5.5h5.5z" className="fill-foreground" />
        </svg>
      </div>

      {/* Text */}
      <h1
        className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-2 animate-fade-up"
        style={{ animationDelay: "0.3s", animationFillMode: "both" }}
      >
        Ramadan <span className="text-muted-foreground">Kareem</span>
      </h1>

      <p
        className="text-xl sm:text-3xl font-bold text-foreground mb-3 animate-fade-up tracking-widest"
        style={{ animationDelay: "0.6s", animationFillMode: "both" }}
      >
        UP TO 75% OFF
      </p>

      {/* Logo */}
      <img
        src={logo}
        alt="Desert Deal"
        className="h-10 sm:h-14 object-contain mb-1 animate-fade-up"
        style={{ animationDelay: "0.9s", animationFillMode: "both" }}
      />

      <p
        className="text-xs sm:text-sm text-muted-foreground animate-fade-up"
        style={{ animationDelay: "1.0s", animationFillMode: "both" }}
      >
        Shop With Confidence
      </p>

      {/* Loading bar */}
      <div
        className="mt-8 w-44 h-[2px] rounded-full bg-border overflow-hidden animate-fade-up"
        style={{ animationDelay: "1.2s", animationFillMode: "both" }}
      >
        <div className="h-full bg-foreground rounded-full animate-[splash-load_2.5s_ease-in-out_forwards]" />
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
