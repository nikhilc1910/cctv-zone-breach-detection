import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const Footer: React.FC = () => {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!marqueeRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.to(marqueeRef.current, {
        xPercent: -50,
        duration: 45,
        ease: 'none',
        repeat: -1
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <footer 
      className="relative bg-transparent pt-20 pb-8 border-t border-stroke overflow-hidden select-none"
      style={{
        background: `radial-gradient(ellipse at 50% 100%, rgba(34,197,94,0.04) 0%, transparent 60%)`
      }}
    >
      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="w-full h-[1px] bg-running/5 animate-scan-line" />
      </div>

      <div className="w-full flex flex-col items-center z-10 relative">
        
        {/* GSAP Marquee */}
        <div className="w-full overflow-hidden border-y border-stroke/40 py-3 mb-16 relative">
          <div 
            ref={marqueeRef} 
            className="flex whitespace-nowrap w-fit gap-0"
          >
            {/* 16 repeats to guarantee coverage on all display sizes */}
            {Array.from({ length: 16 }).map((_, i) => (
              <span 
                key={i} 
                className="text-[10px] md:text-[11px] font-mono text-muted/30 uppercase tracking-[0.4em] inline-flex items-center shrink-0"
              >
                DIGITAL TWIN<span className="text-running mx-3">·</span>
                MQTT<span className="text-running mx-3">·</span>
                REDIS<span className="text-running mx-3">·</span>
                POSTGRESQL<span className="text-running mx-3">·</span>
                SOCKET.IO<span className="text-running mx-3">·</span>
                AUTONEX AI<span className="text-running mx-3">·</span>
              </span>
            ))}
          </div>
        </div>

        {/* CTA Block */}
        <div className="text-center px-6 max-w-xl mx-auto mb-16 flex flex-col items-center">
          <span className="text-[10px] md:text-[11px] text-muted tracking-[0.3em] uppercase font-bold mb-4">
            BUILT FOR AUTONEX AI INTERNSHIP
          </span>
          
          <h3 className="font-display italic text-text-primary text-4xl md:text-6xl mb-8 font-normal">
            Open to <span className="text-blue-400">feedback</span>
          </h3>

          <a
            href="https://github.com/nikhilc1910/realtime-digital-twin-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center rounded-full border border-stroke/80 bg-surface px-8 py-4 text-[11px] md:text-[12px] font-mono font-bold uppercase tracking-[0.2em] text-text-primary hover:scale-105 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          >
            <span className="absolute inset-0 rounded-full border border-transparent group-hover:border-running/30 transition-all duration-300 scale-105 pointer-events-none" />
            VIEW SOURCE ON GITHUB
          </a>
        </div>

        {/* Footer Bar */}
        <div className="max-w-[1200px] w-full mx-auto px-6 md:px-16 border-t border-stroke mt-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 items-center justify-between text-center md:text-left">
            
            {/* Left */}
            <div className="font-mono text-[10px] md:text-[11px] text-muted flex flex-col gap-1">
              <span className="font-bold text-text-primary/75">DIGITAL TWIN / AUTONEX AI</span>
              <span>Built by Nikhil · May 2026</span>
            </div>

            {/* Center */}
            <div className="flex justify-center">
              <div className="inline-flex gap-2 text-[9px] font-mono text-muted/80 border border-stroke rounded-full px-4 py-1.5 bg-surface/50">
                {["Node.js", "React", "MQTT", "Redis", "PostgreSQL"].map((tech) => (
                  <span key={tech} className="hover:text-text-primary transition-colors duration-150 cursor-default">
                    [{tech}]
                  </span>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col items-center md:items-end gap-1 font-mono text-[10px] md:text-[11px]">
              <div className="flex items-center gap-2 text-running font-bold tracking-wider">
                <span className="w-1.5 h-1.5 bg-running rounded-full animate-pulse shadow-[0_0_8px_hsl(var(--running))]" />
                ALL SYSTEMS OPERATIONAL
              </div>
              <span className="text-muted">Uptime: 99.8%</span>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
