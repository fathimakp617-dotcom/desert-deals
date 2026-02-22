import { useState, useRef, useCallback, memo } from "react";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

const ImageZoom = memo(({ src, alt, className = "" }: ImageZoomProps) => {
  const [zooming, setZooming] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-crosshair ${className}`}
      onMouseEnter={() => setZooming(true)}
      onMouseLeave={() => setZooming(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setZooming(true)}
      onTouchEnd={() => setZooming(false)}
      onTouchMove={handleTouchMove}
    >
      {/* Base image */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center"
        draggable={false}
      />

      {/* Zoomed overlay */}
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
