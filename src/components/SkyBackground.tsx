'use client';

import { useEffect, useRef } from 'react';

export default function SkyBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const sky = videoRef.current;
    if (!sky) return;

    sky.style.transition = 'opacity 1.2s ease';
    let fading = false;
    let lastTime = 0;

    function onTimeUpdate() {
      if (!sky || !sky.duration) return;
      const remaining = sky.duration - sky.currentTime;

      if (remaining < 1.4 && !fading) {
        fading = true;
        sky.style.opacity = '0';
      }

      if (lastTime > sky.duration - 2 && sky.currentTime < 0.8) {
        sky.style.opacity = '1';
        fading = false;
      }

      lastTime = sky.currentTime;
    }

    sky.addEventListener('timeupdate', onTimeUpdate);
    return () => sky.removeEventListener('timeupdate', onTimeUpdate);
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
      className="fixed inset-0 w-full h-full object-cover -z-10 pointer-events-none"
    >
      <source src="/sky-background.mp4" type="video/mp4" />
    </video>
  );
}
