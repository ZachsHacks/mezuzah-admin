'use client';

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  zoomLevel?: number;
}

export default function ImageMagnifier({
  src,
  alt,
  className = '',
  style,
  zoomLevel = 3,
}: Props) {
  const [show, setShow] = useState(false);
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setBgPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });

    // Position the zoom panel to the right of the image
    setPanelPos({
      top: rect.top,
      left: rect.right + 12,
    });
  }, []);

  const handleMouseEnter = useCallback(() => setShow(true), []);
  const handleMouseLeave = useCallback(() => setShow(false), []);

  // Panel size matches image height for a balanced look
  const panelSize = 320;

  return (
    <>
      <div
        className="relative"
        style={{ display: 'inline-block' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={className}
          style={{ ...style, cursor: show ? 'crosshair' : undefined }}
          onLoad={(e) => {
            const img = e.currentTarget;
            setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />
      </div>
      {show && typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: panelPos.top,
              left: panelPos.left,
              width: panelSize,
              height: panelSize,
              borderRadius: 12,
              border: '2px solid rgba(255,255,255,0.9)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              backgroundImage: `url(${src})`,
              backgroundSize: imgNatural.w > imgNatural.h
                ? `${zoomLevel * 100}% auto`
                : `auto ${zoomLevel * 100}%`,
              backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'rgba(235,244,252,0.95)',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          />,
          document.body,
        )
      }
    </>
  );
}
