import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const VideoWallpaper: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('overview');

  // Detect active section on scroll for background state transitions
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'system', 'metrics', 'stack'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Trigger when section is in the middle of viewport
          if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run once on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP scroll-triggered scale zoom synchronized with body scrolling
  useEffect(() => {
    if (!videoRef.current) return;

    const anim = gsap.fromTo(videoRef.current,
      { scale: 1.0 },
      {
        scale: 1.35,
        ease: 'none',
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5
        }
      }
    );

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []);

  // Opacity mapper for video element
  const opacityMap: Record<string, number> = {
    overview: 0.22,
    system: 0.04,
    metrics: 0.16,
    stack: 0.08
  };
  const currentVideoOpacity = opacityMap[activeSection] ?? 0.15;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none"
    >
      {/* Background looping MP4 robot arm */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        style={{ opacity: currentVideoOpacity }}
        className="w-full h-full object-cover filter brightness-[0.45] contrast-[1.1] transition-opacity duration-1000 ease-in-out"
        src="https://assets.mixkit.co/videos/preview/mixkit-robot-arm-in-a-futuristic-factory-working-40342-large.mp4"
      />

      {/* OVERLAY 1: Static HSL Mesh glows */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(34,197,94,0.04) 0%, transparent 60%),
            linear-gradient(to bottom, rgba(4, 4, 4, 0.4) 0%, rgba(4, 4, 4, 0.8) 50%, rgba(4, 4, 4, 0.96) 100%)
          `
        }}
      />

      {/* OVERLAY 2: Cyber System CAD Grid (Active in SYSTEM section) */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-1000 ease-in-out"
        style={{ 
          opacity: activeSection === 'system' ? 0.75 : 0,
          backgroundImage: 'linear-gradient(to right, rgba(59, 130, 246, 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.035) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* OVERLAY 3: CCTV Viewfinder Overlay (Active in METRICS section) */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none transition-all duration-1000 ease-in-out"
        style={{ opacity: activeSection === 'metrics' ? 1.0 : 0 }}
      >
        {/* Frame borders */}
        <div className="absolute inset-6 md:inset-12 border border-stroke/10 pointer-events-none">
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-blue-500/40" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-blue-500/40" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-blue-500/40" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-blue-500/40" />
          
          {/* Viewfinder crosshairs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-60">
            <div className="w-1.5 h-1.5 bg-down rounded-full animate-ping" />
            <div className="absolute w-5 h-px bg-blue-500/40" />
            <div className="absolute h-5 w-px bg-blue-500/40" />
          </div>
          
          {/* Technical overlays text */}
          <div className="absolute top-3 left-4 text-[9px] font-mono text-muted/60 tracking-wider">
            REC ● 1080P 60FPS
          </div>
          <div className="absolute bottom-3 right-4 text-[9px] font-mono text-muted/60 tracking-widest">
            CAM_01_FEED
          </div>
        </div>
      </div>

      {/* OVERLAY 4: Tech Stack Dot Matrix Grid (Active in STACK section) */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-1000 ease-in-out"
        style={{ 
          opacity: activeSection === 'stack' ? 0.65 : 0,
          backgroundImage: 'radial-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />
    </div>
  );
};

export default VideoWallpaper;
