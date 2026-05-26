import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

const MQTT_PAYLOAD = `{
  "machine_id": "MACHINE_11",
  "status": "RUNNING",
  "metrics": {
    "temperature": 72.5,
    "vibration": 3.2,
    "power": 14.8
  }
}`;

const FEATURE_PILLS = [
  "MQTT WILDCARD",
  "REDIS DEDUP",
  "ALERT STORM PREVENTION",
  "DOWNTIME TRACKING",
  "CSV EXPORT",
  "SOCKET.IO ROOMS",
  "ZOD VALIDATION",
  "QOS 1/2",
  "BATCH WRITES",
  "JEST TESTS"
];

export const LiveMetricsSection: React.FC = () => {
  const [typedText, setTypedText] = useState('');
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Typewriter effect for MQTT payload
  useEffect(() => {
    let charIndex = 0;
    let typeInterval: NodeJS.Timeout;

    const startTyping = () => {
      setTypedText('');
      charIndex = 0;
      clearInterval(typeInterval);
      
      typeInterval = setInterval(() => {
        setTypedText(MQTT_PAYLOAD.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex >= MQTT_PAYLOAD.length) {
          clearInterval(typeInterval);
        }
      }, 25);
    };

    startTyping();
    const cycleInterval = setInterval(startTyping, 6000); // Typings repeat every 6s

    return () => {
      clearInterval(typeInterval);
      clearInterval(cycleInterval);
    };
  }, []);

  // GSAP Marquee for pills (running on desktop and mobile)
  useEffect(() => {
    if (!marqueeRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.to(marqueeRef.current, {
        x: '-50%',
        duration: 25,
        ease: 'none',
        repeat: -1
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section 
      id="metrics" 
      className="bg-transparent py-20 md:py-28 border-t border-stroke relative overflow-hidden flex flex-col items-center select-none"
    >
      <div className="max-w-[1200px] w-full mx-auto px-6 md:px-16 flex flex-col items-center">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-16 text-center w-full"
        >
          <span className="text-[10px] md:text-[11px] text-muted uppercase tracking-[0.4em] font-bold block mb-3">
            DASHBOARD PREVIEW
          </span>
          <h2 className="text-3xl md:text-5xl tracking-tight mb-4 font-semibold text-text-primary">
            A <span className="font-display italic text-blue-400">system</span> that never sleeps
          </h2>
          <p className="text-xs md:text-sm text-muted font-mono max-w-lg mx-auto">
            Live machine state updated via WebSocket at sub-second latency.
          </p>
        </motion.div>

        {/* Dashboard Showcase Frame */}
        <div className="relative w-full max-w-4xl flex items-center justify-center mb-16 px-4 md:px-0">
          
          {/* Main Screenshot with simple hover scale */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            viewport={{ once: true, margin: "-40px" }}
            className="w-full rounded-2xl border border-stroke overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.6)] bg-surface/50 group"
          >
            <img 
              src="/media/dashboard_screenshot.png" 
              alt="Industrial Twin Dashboard SCADA Panel" 
              className="w-full h-auto opacity-80 group-hover:opacity-95 transition-opacity duration-300 pointer-events-none"
            />
          </motion.div>

          {/* Left Floating MQTT Payload Card */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[-20px] top-[15%] hidden md:block w-64 bg-surface/90 border border-stroke rounded-xl p-4 font-mono text-[10px] leading-relaxed shadow-2xl backdrop-blur-md z-20 pointer-events-none select-none text-left"
          >
            <div className="text-[9px] text-muted uppercase tracking-wider mb-2 border-b border-stroke/50 pb-1.5 flex justify-between items-center">
              <span>MQTT Stream (1Hz)</span>
              <span className="text-running animate-pulse">●</span>
            </div>
            <pre className="text-text-primary/90 overflow-hidden whitespace-pre-wrap">
              {typedText}
              <span className="inline-block w-1 h-3 bg-text-primary ml-0.5 animate-blink-cursor" />
            </pre>
          </motion.div>

          {/* Right Floating Alert Status Card */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[-20px] bottom-[15%] hidden md:block w-64 bg-surface/90 border-l-2 border-l-down border border-stroke rounded-xl p-4 font-mono text-[10px] leading-relaxed shadow-2xl backdrop-blur-md z-20 pointer-events-none select-none text-left"
          >
            <div className="text-[9px] text-down uppercase tracking-widest font-bold mb-2 flex items-center justify-between">
              <span>⚠️ ALERT TRIGGERED</span>
              <div className="w-1.5 h-1.5 bg-down rounded-full animate-pulse-ring" />
            </div>
            <div className="space-y-1 text-text-primary/95">
              <div><span className="text-muted">TYPE:</span> HIGH_TEMPERATURE</div>
              <div><span className="text-muted">LINE:</span> LINE_1</div>
              <div><span className="text-muted">SRC:</span> MACHINE_11 · CRITICAL</div>
              <div className="text-down/90 mt-1.5 border-t border-stroke/40 pt-1.5">
                temp: 82.4°C &gt; threshold 80.0°C
              </div>
              <div className="flex gap-2 mt-3 pt-1">
                <span className="border border-stroke text-muted rounded px-2 py-0.5 scale-95 origin-left">ACK</span>
                <span className="border border-stroke text-muted rounded px-2 py-0.5 scale-95 origin-left">RESOLVE</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Mockup Stack */}
        <div className="w-full flex flex-col md:hidden gap-4 mb-16 px-4">
          {/* Mobile MQTT payload */}
          <div className="w-full bg-surface/75 border border-stroke rounded-xl p-4 font-mono text-[11px] text-left">
            <div className="text-[9px] text-muted uppercase tracking-wider mb-2 border-b border-stroke/50 pb-1.5 flex justify-between items-center">
              <span>MQTT Stream (1Hz)</span>
              <span className="text-running animate-pulse">●</span>
            </div>
            <pre className="text-text-primary/80 overflow-hidden whitespace-pre-wrap">
              {typedText}
              <span className="inline-block w-1 h-3 bg-text-primary ml-0.5 animate-blink-cursor" />
            </pre>
          </div>

          {/* Mobile active alert */}
          <div className="w-full bg-surface/75 border-l-2 border-l-down border border-stroke rounded-xl p-4 font-mono text-[11px] text-left">
            <div className="text-[9px] text-down uppercase tracking-widest font-bold mb-2 flex items-center justify-between">
              <span>⚠️ ALERT TRIGGERED</span>
              <div className="w-1.5 h-1.5 bg-down rounded-full animate-pulse-ring" />
            </div>
            <div className="space-y-1">
              <div><span className="text-muted">TYPE:</span> HIGH_TEMPERATURE</div>
              <div><span className="text-muted">SRC:</span> MACHINE_11 · CRITICAL</div>
              <div className="text-down/90 mt-1">temp: 82.4°C &gt; threshold 80°C</div>
            </div>
          </div>
        </div>

        {/* Infinite Scrolling Feature Pills Marquee */}
        <div className="w-full overflow-hidden py-4 border-y border-stroke/40 relative">
          <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
          
          <div ref={marqueeRef} className="flex gap-4 whitespace-nowrap w-fit">
            {/* Render items twice to ensure infinite scroll seam */}
            {[...FEATURE_PILLS, ...FEATURE_PILLS].map((pill, idx) => (
              <div 
                key={idx}
                className="group inline-block bg-surface border border-stroke hover:border-blue-500/60 rounded-full px-5 py-2.5 text-[10px] md:text-[11px] font-mono text-muted hover:text-text-primary cursor-default transition-all duration-300"
              >
                <span className="mr-1.5 text-blue-500/60 group-hover:text-running transition-colors duration-200">#</span>
                {pill}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default LiveMetricsSection;
