import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, decimals = 0, suffix = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    const duration = 1500; // 1.5s duration
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Quad ease-out function
      const easeProgress = progress * (2 - progress);
      const currentVal = start + (end - start) * easeProgress;
      
      setDisplayValue(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {decimals > 0 ? displayValue.toFixed(decimals) : Math.floor(displayValue)}
      {suffix}
    </span>
  );
};

export const StatsSection: React.FC = () => {
  return (
    <section className="bg-transparent py-20 md:py-24 border-y border-stroke select-none">
      <div className="max-w-[1200px] mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 relative">
          
          {/* STAT 1: Machines */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left md:pr-8">
            <div className="text-7xl md:text-8xl font-display italic text-text-primary/90 leading-none mb-3">
              <AnimatedNumber value={15} />
            </div>
            <div className="text-[11px] font-mono text-muted uppercase tracking-[0.3em] mb-2 font-bold">
              Machines Monitored
            </div>
            <p className="text-[11px] font-mono text-muted/80 max-w-[240px] leading-relaxed">
              Across 3 production lines with 1Hz live telemetry.
            </p>
          </div>

          {/* Divider between stat 1 & 2 */}
          <div className="hidden md:block absolute left-1/3 top-1/2 -translate-y-1/2 w-px h-24 bg-stroke" />

          {/* STAT 2: Alert Rules */}
          <div className="flex flex-col items-center text-center md:px-8">
            <div className="text-7xl md:text-8xl font-display italic text-text-primary/90 leading-none mb-3">
              <AnimatedNumber value={5} />
            </div>
            <div className="text-[11px] font-mono text-muted uppercase tracking-[0.3em] mb-3 font-bold">
              Alert Rule Types
            </div>
            <div className="text-[9px] font-mono text-muted/75 leading-relaxed bg-surface/50 border border-stroke/50 rounded px-2.5 py-1">
              HIGH_TEMP · HIGH_VIB · DOWNTIME · TIMEOUT · SAFETY
            </div>
          </div>

          {/* Divider between stat 2 & 3 */}
          <div className="hidden md:block absolute left-2/3 top-1/2 -translate-y-1/2 w-px h-24 bg-stroke" />

          {/* STAT 3: Redis Cache Hit */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right md:pl-8">
            <div className="text-7xl md:text-8xl font-display italic text-text-primary/90 leading-none mb-3">
              <AnimatedNumber value={99.2} decimals={1} suffix="%" />
            </div>
            <div className="text-[11px] font-mono text-muted uppercase tracking-[0.3em] mb-2 font-bold">
              Redis Cache Hit Rate
            </div>
            <p className="text-[11px] font-mono text-muted/80 max-w-[240px] leading-relaxed">
              Sub-millisecond reads. PostgreSQL protected from polling load.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default StatsSection;
