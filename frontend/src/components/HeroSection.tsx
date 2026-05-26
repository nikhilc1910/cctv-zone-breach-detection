import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

interface HeroSectionProps {
  onViewDashboard: () => void;
}

const SYSTEM_FACTS = [
  "Monitoring 6 machines across 3 production lines",
  "Alert engine armed — threshold rules active",
  "MQTT telemetry at 1Hz per machine",
  "Redis cache hit rate: 99.2%",
  "Zero downtime in last 4 hours"
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onViewDashboard }) => {
  const [factIndex, setFactIndex] = useState(0);
  const [runningCount, setRunningCount] = useState(14);
  const [alertsCount, setAlertsCount] = useState(0);
  const [jointTemp, setJointTemp] = useState(34.5);
  const [torqueLoad, setTorqueLoad] = useState(12.5);
  const [axisAngle, setAxisAngle] = useState(42.8);
  const heroRef = useRef<HTMLDivElement>(null);

  // Cycle system facts
  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % SYSTEM_FACTS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Tick metrics up/down every 3s
  useEffect(() => {
    const timer = setInterval(() => {
      setRunningCount((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const next = prev + change;
        return Math.max(13, Math.min(15, next));
      });
      setAlertsCount((prev) => {
        return Math.random() > 0.8 ? (Math.random() > 0.6 ? 2 : 1) : 0;
      });
      setJointTemp((prev) => +(prev + (Math.random() - 0.5) * 0.4).toFixed(1));
      setTorqueLoad((prev) => Math.max(8.0, Math.min(18.0, +(prev + (Math.random() - 0.5) * 0.8).toFixed(1))));
      setAxisAngle((prev) => +(prev + (Math.random() - 0.5) * 1.5).toFixed(1));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // GSAP Entrance Animation
  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      // Name reveal
      gsap.fromTo(
        '.name-reveal',
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.1 }
      );

      // Blur in eyebrow, description, CTAs, metrics
      gsap.fromTo(
        '.blur-in',
        { opacity: 0, filter: 'blur(12px)', y: 20 },
        {
          opacity: 1,
          filter: 'blur(0px)',
          y: 0,
          duration: 1,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.3
        }
      );
    }, heroRef.current);

    return () => ctx.revert();
  }, []);

  const handleScrollToSystem = () => {
    const el = document.getElementById('system');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="overview"
      ref={heroRef}
      className="relative min-h-screen w-full flex flex-col justify-between items-center text-text-primary px-6 md:px-12 py-24 md:py-32 select-none overflow-hidden bg-transparent"
    >
      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="w-full h-[1px] bg-running/5 animate-scan-line" />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center max-w-[1200px] w-full z-10 py-8">
        
        {/* Left Column: Core Description & CTAs */}
        <div className="lg:col-span-7 flex flex-col justify-center items-center text-center lg:text-left lg:items-start w-full">
          {/* System label eyebrow */}
          <div className="blur-in text-[10px] md:text-[11px] text-muted uppercase tracking-[0.4em] font-bold mb-5">
            AUTONEX AI / INDUSTRIAL DIGITAL TWIN
          </div>

          {/* Main heading */}
          <h1 className="name-reveal text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-5 font-semibold select-none">
            Real-Time Factory<br />
            <span className="font-display italic font-normal text-blue-400">Intelligence</span>
          </h1>

          {/* Live status ticker */}
          <div className="blur-in h-6 mb-7 flex items-center overflow-hidden w-full justify-center lg:justify-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={factIndex}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="text-xs md:text-sm text-muted font-mono flex items-center gap-2"
              >
                <span className="inline-block w-1.5 h-1.5 bg-running rounded-full animate-pulse shrink-0" />
                {SYSTEM_FACTS[factIndex]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Technical Description */}
          <div className="blur-in text-[10px] md:text-[11px] text-muted/85 tracking-[0.2em] uppercase font-mono mb-8">
            Built with <span className="text-text-primary">MQTT</span> · <span className="text-text-primary">Redis</span> · <span className="text-text-primary">PostgreSQL</span> · <span className="text-text-primary">Socket.IO</span>
          </div>

          {/* CTA row */}
          <div className="blur-in inline-flex flex-wrap gap-4 mb-10 justify-center lg:justify-start">
            <button
              onClick={onViewDashboard}
              className="group relative bg-running text-bg hover:scale-105 rounded-full text-[12px] px-8 py-3.5 font-mono font-bold uppercase tracking-[0.1em] transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            >
              VIEW DASHBOARD
              <span className="absolute inset-0 rounded-full border border-transparent group-hover:border-running/40 scale-105 transition-all duration-300 pointer-events-none" />
            </button>
            <button
              onClick={handleScrollToSystem}
              className="border border-stroke text-text-primary hover:border-blue-500/60 rounded-full text-[12px] px-8 py-3.5 font-mono uppercase tracking-[0.1em] transition-all duration-300 bg-surface/30 backdrop-blur-sm"
            >
              READ DOCS
            </button>
          </div>

          {/* Live mini-metrics bar */}
          <div className="blur-in border border-stroke/60 bg-surface/50 backdrop-blur-sm rounded-lg px-5 py-3 font-mono text-[10px] md:text-[11px] flex flex-wrap gap-y-2 gap-x-6 items-center max-w-lg shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-1.5">
              <span className="text-muted">MACHINES RUNNING:</span>
              <div className="h-[14px] overflow-hidden inline-flex items-center w-4 justify-center">
                <span key={runningCount} className="counter-roll text-running font-bold">
                  {runningCount}
                </span>
              </div>
            </div>
            
            <div className="w-px h-3 bg-stroke hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <span className="text-muted">ACTIVE ALERTS:</span>
              <div className="h-[14px] overflow-hidden inline-flex items-center w-4 justify-center">
                <span 
                  key={alertsCount} 
                  className={`counter-roll font-bold ${alertsCount > 0 ? 'text-down' : 'text-muted'}`}
                >
                  {alertsCount}
                </span>
              </div>
            </div>

            <div className="w-px h-3 bg-stroke hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <span className="text-muted">UPTIME:</span>
              <span className="text-text-primary font-bold">99.8%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sleek 3D Device mock console */}
        <div className="lg:col-span-5 flex justify-center items-center w-full blur-in">
          <div className="relative bg-surface/30 backdrop-blur-md border border-stroke/80 rounded-2xl p-5 w-full max-w-[360px] aspect-[4/5] flex flex-col justify-between overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.65)] hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.12)] transition-all duration-500 animate-float">
            
            {/* Top row */}
            <div className="flex justify-between items-center text-[9px] font-mono text-muted uppercase tracking-wider border-b border-stroke/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-running rounded-full animate-pulse shadow-[0_0_6px_hsl(var(--running))]" />
                <span>MODEL_REF: RX-99</span>
              </div>
              <span className="text-blue-400">SYS_OK</span>
            </div>

            {/* Glowing Scan Line over the image */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-10">
              <div className="w-full h-8 bg-gradient-to-b from-blue-500/10 to-transparent translate-y-[-100%] animate-[scan-line_4s_linear_infinite]" />
            </div>

            {/* Center Image */}
            <div className="my-auto flex items-center justify-center relative py-4">
              <img 
                src="/media/robotic_arm_3d.png" 
                alt="3D Cybernetic Robotic Arm Model" 
                className="object-contain w-full h-[230px] filter brightness-[1.05] contrast-[1.05] drop-shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Bottom row: Live parameters */}
            <div className="border-t border-stroke/40 pt-2.5 flex flex-col gap-1.5 font-mono text-[9px]">
              <div className="flex justify-between text-muted">
                <span>AXIS_A: <span className="text-text-primary font-bold tabular-nums">{axisAngle}°</span></span>
                <span>JOINT_TEMP: <span className="text-text-primary font-bold tabular-nums">{jointTemp}°C</span></span>
              </div>
              <div className="flex justify-between items-center text-muted border-t border-stroke/20 pt-1.5">
                <span>TORQUE: <span className="text-running font-bold tabular-nums">{torqueLoad}%</span></span>
                <span className="text-[8px] bg-running/10 text-running border border-running/30 rounded px-1 py-0.2 uppercase font-bold tracking-wider">NOMINAL</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Scroll indicator */}
      <div 
        onClick={handleScrollToSystem}
        className="cursor-pointer flex flex-col items-center gap-2 group z-10"
      >
        <span className="text-[9px] text-muted/60 tracking-[0.3em] uppercase group-hover:text-text-primary transition-colors duration-250">
          SCROLL
        </span>
        <div className="w-[1px] h-10 bg-stroke relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-blue-500 to-running animate-scroll-down rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
