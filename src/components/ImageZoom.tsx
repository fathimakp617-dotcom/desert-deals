import { useState, useRef, useCallback, memo } from "react";
import { ZoomIn } from "lucide-react";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

const ImageZoom = memo(({ src, alt, className = "" }: ImageZoomProps) => {
  const [zooming, setZooming] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setZooming(prev => {
      if (!prev) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setPosition({ x, y });
      }
      return !prev;
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!zooming) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  }, [zooming]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!zooming) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, [zooming]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${zooming ? "cursor-crosshair" : "cursor-zoom-in"} ${className}`}
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setZooming(false)}
      onTouchMove={handleTouchMove}
    >
      {/* Base image */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center"
        draggable={false}
      />

      {/* Hint */}
      {!zooming && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-full px-2.5 py-1.5 text-muted-foreground pointer-events-none transition-opacity">
          <ZoomIn className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium tracking-wide hidden sm:inline">DOUBLE-CLICK TO ZOOM</span>
        </div>
      )}
      {zooming && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "250%",
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  );
});

ImageZoom.displayName = "ImageZoom";

export default ImageZoom;
