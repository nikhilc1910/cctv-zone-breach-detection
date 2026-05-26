import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
  }
};

export const TechStackSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const cards = containerRef.current.querySelectorAll('.parallax-card');
    const ctx = gsap.context(() => {
      cards.forEach((card, index) => {
        // Alternate y movement +/- 30px based on row/index for a subtle parallax effect
        const movement = index % 2 === 0 ? 30 : -30;
        gsap.fromTo(card, 
          { y: 0 },
          {
            y: movement,
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: 1
            }
          }
        );
      });
    }, containerRef.current);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      id="stack" 
      ref={containerRef}
      className="bg-transparent py-20 md:py-28 border-t border-stroke select-none overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-16">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-16 text-center md:text-left"
        >
          <span className="text-[10px] md:text-[11px] text-muted uppercase tracking-[0.4em] font-bold block mb-3">
            ENGINEERING STACK
          </span>
          <h2 className="text-3xl md:text-5xl tracking-tight mb-4 font-semibold text-text-primary">
            Built with <span className="font-display italic text-blue-400">precision</span>
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-12 gap-4 md:gap-5 w-full"
        >
          {/* CARD 1 — MQTT + Mosquitto (col-span-4) */}
          <motion.div 
            variants={itemVariants}
            className="parallax-card col-span-2 md:col-span-4 bg-surface rounded-2xl border border-stroke p-6 hover:border-stroke/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.06)] flex flex-col justify-between min-h-[160px] transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 bg-running rounded-full animate-pulse" />
              <span className="text-[9px] font-mono text-running font-bold tracking-wider">CONNECTED</span>
            </div>
            <div className="text-4xl md:text-5xl font-display italic text-text-primary/20 leading-none mb-4 group-hover:text-blue-500/20 transition-colors duration-300">
              MQTT
            </div>
            <div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">Mosquitto Message Broker</div>
              <div className="text-[11px] font-mono text-text-primary/80">
                eclipse-mosquitto:2.0 · QoS 1/2 · Wildcard topics
              </div>
            </div>
          </motion.div>

          {/* CARD 2 — Redis (col-span-4) */}
          <motion.div 
            variants={itemVariants}
            className="parallax-card col-span-2 md:col-span-4 bg-surface rounded-2xl border border-stroke p-6 hover:border-stroke/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.06)] flex flex-col justify-between min-h-[160px] transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 z-10">
              <div className="w-1.5 h-1.5 bg-[#ef4444] rounded-full animate-pulse" />
            </div>
            <div className="text-4xl md:text-5xl font-display italic text-text-primary/20 leading-none mb-4 group-hover:text-[#ef4444]/20 transition-colors duration-300">
              REDIS
            </div>
            <div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">State Cache & Deduplication</div>
              <div className="text-[11px] font-mono text-text-primary/80">
                7.0-alpine · Machine state cache · Alert dedup · Sub-ms reads
              </div>
            </div>
          </motion.div>

          {/* CARD 3 — PostgreSQL + Prisma (col-span-4) */}
          <motion.div 
            variants={itemVariants}
            className="parallax-card col-span-2 md:col-span-4 bg-surface rounded-2xl border border-stroke p-6 hover:border-stroke/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.06)] flex flex-col justify-between min-h-[160px] transition-all duration-300 relative group overflow-hidden"
          >
            <div className="text-4xl md:text-5xl font-display italic text-text-primary/20 leading-none mb-4 group-hover:text-blue-500/20 transition-colors duration-300">
              PSQL
            </div>
            <div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">Relational Database & ORM</div>
              <div className="text-[11px] font-mono text-text-primary/80">
                15-alpine · TimeSeries telemetry · Composite indexes · Cascade deletes
              </div>
            </div>
          </motion.div>

          {/* CARD 4 — Node.js + Express + TypeScript (col-span-6) */}
          <motion.div 
            variants={itemVariants}
            className="parallax-card col-span-2 md:col-span-6 bg-surface rounded-2xl border border-stroke p-6 hover:border-stroke/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.06)] flex flex-col justify-between min-h-[220px] transition-all duration-300 relative group overflow-hidden"
          >
            {/* Monospace Code Decoration in Background */}
            <div className="absolute inset-0 opacity-[0.03] font-mono text-[8px] p-6 pointer-events-none select-none overflow-hidden leading-tight text-left">
              {`import express from 'express';\nimport { createServer } from 'http';\nimport { Server } from 'socket.io';\nconst app = express();\nconst server = createServer(app);\nconst io = new Server(server);\nio.on('connection', (socket) => {\n  console.log('Client connected');\n});`}
            </div>
            <div className="text-5xl md:text-6xl font-display italic text-text-primary/20 leading-none mb-6 group-hover:text-blue-400/20 transition-colors duration-300">
              NODE
            </div>
            <div className="z-10">
              <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">Runtime & API Gateway</div>
              <div className="text-[11px] font-mono text-text-primary/80 mb-4">
                TypeScript · Express 4 · Zod validation · Pino logging
              </div>
              <div className="flex flex-wrap gap-2">
                {["ASYNC", "TYPED", "VALIDATED"].map(tag => (
                  <span key={tag} className="bg-bg border border-stroke rounded px-2.5 py-0.5 text-[9px] font-mono text-muted tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CARD 5 — React + Vite (col-span-6) */}
          <motion.div 
            variants={itemVariants}
            className="parallax-card col-span-2 md:col-span-6 bg-surface rounded-2xl border border-stroke p-6 hover:border-stroke/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.06)] flex flex-col justify-between min-h-[220px] transition-all duration-300 relative group overflow-hidden"
          >
            <div className="text-5xl md:text-6xl font-display italic text-text-primary/20 leading-none mb-6 group-hover:text-running/20 transition-colors duration-300">
              REACT
            </div>
            <div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">User Interface Framework</div>
              <div className="text-[11px] font-mono text-text-primary/80 mb-4">
                Vite 5 · Context API · Recharts · Framer Motion · Socket.IO client
              </div>
              <div className="flex flex-wrap gap-2">
                {["LIVE UPDATES", "WEBSOCKET", "CHARTING"].map(tag => (
                  <span key={tag} className="bg-bg border border-stroke rounded px-2.5 py-0.5 text-[9px] font-mono text-muted tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CARD 6 — Docker (col-span-4) */}
          <motion.div 
            variants={itemVariants}
            className="parallax-card col-span-2 md:col-span-4 bg-surface rounded-2xl border border-stroke p-6 hover:border-stroke/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.06)] flex flex-col justify-between min-h-[180px] transition-all duration-300 relative group overflow-hidden"
          >
            <div className="text-3xl md:text-4xl font-display italic text-text-primary/20 leading-none mb-4 group-hover:text-blue-500/20 transition-colors duration-300">
              DOCKER
            </div>
            <div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">Containerization Topology</div>
              <div className="text-[11px] font-mono text-text-primary/80 mb-3">
                5-service Compose stack · Health checks · Network isolation
              </div>
              <div className="flex flex-wrap gap-1">
                {["mosquitto", "redis", "postgres", "backend", "frontend"].map(svc => (
                  <span key={svc} className="text-[8px] font-mono border border-stroke/50 bg-bg rounded px-1.5 py-0.5 text-muted/80">
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CARD 7 — Testing (col-span-4) */}
          <motion.div 
            variants={itemVariants}
            className="parallax-card col-span-2 md:col-span-4 bg-surface rounded-2xl border border-stroke p-6 hover:border-stroke/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.06)] flex flex-col justify-between min-h-[180px] transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 text-[9px] font-mono text-running font-semibold">
              4/4 PASSING
            </div>
            <div className="text-3xl md:text-4xl font-display italic text-text-primary/20 leading-none mb-4 group-hover:text-running/20 transition-colors duration-300">
              JEST
            </div>
            <div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">Quality Assurance</div>
              <div className="text-[11px] font-mono text-text-primary/80">
                3 test suites · Unit · Integration · Timeout detection
              </div>
            </div>
          </motion.div>

          {/* CARD 8 — Alert Engine (col-span-4) */}
          <motion.div 
            variants={itemVariants}
            className="parallax-card col-span-2 md:col-span-4 bg-surface rounded-2xl border border-stroke p-6 hover:border-stroke/60 hover:shadow-[0_0_25px_rgba(239,68,68,0.06)] flex flex-col justify-between min-h-[180px] transition-all duration-300 relative group overflow-hidden"
          >
            <div className="text-3xl md:text-4xl font-display italic text-down/20 leading-none mb-4 group-hover:text-down/40 transition-colors duration-300">
              ALERTS
            </div>
            <div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">Rule Engine Lifecycle</div>
              <div className="text-[11px] font-mono text-text-primary/80 mb-2">
                5 threshold rules · Auto-resolve · Storm prevention
              </div>
              <div className="text-[8px] font-mono text-muted/60 space-y-0.5 border-t border-stroke/50 pt-1.5 text-left">
                <div>TEMP &gt; 80°C → HIGH</div>
                <div>VIB &gt; 5.0 → CRITICAL</div>
                <div>STATUS = DOWN → HIGH</div>
              </div>
            </div>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
};

export default TechStackSection;
