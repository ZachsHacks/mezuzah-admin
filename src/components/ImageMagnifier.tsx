'use client';

import { useState, useRef } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  zoomLevel?: number;
  lensSize?: number;
}

export default function ImageMagnifier({
  src,
  alt,
  className = '',
  style,
  zoomLevel = 2.5,
  lensSize = 150,
}: Props) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, bgX: 0, bgY: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  function handleMouseMove(e: React.MouseEvent) {
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Background position for the zoomed image
    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;

    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, bgX, bgY });
  }

  return (
    <div
      className="relative"
      style={{ display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
        style={{ ...style, cursor: show ? 'none' : undefined }}
      />
      {show && (
        <div
          style={{
            position: 'absolute',
            left: pos.x - lensSize / 2,
            top: pos.y - lensSize / 2,
            width: lensSize,
            height: lensSize,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomLevel * 100}% ${zoomLevel * 100}%`,
            backgroundPosition: `${pos.bgX}% ${pos.bgY}%`,
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      )}
    </div>
  );
}
