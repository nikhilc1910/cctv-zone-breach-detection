import React from 'react';
import { motion } from 'framer-motion';

interface ArchNodeProps {
  title: string;
  subtitle: string;
  color: 'running' | 'idle' | 'down' | 'maintenance';
  icon: string;
}

const ArchNode: React.FC<ArchNodeProps> = ({ title, subtitle, color, icon }) => {
  const colorMap = {
    running: 'border-running/30 hover:border-running/80 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)] text-running',
    idle: 'border-idle/30 hover:border-idle/80 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] text-idle',
    down: 'border-down/30 hover:border-down/80 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] text-down',
    maintenance: 'border-maintenance/30 hover:border-maintenance/80 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] text-maintenance'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`bg-surface border rounded-lg p-5 text-center flex flex-col justify-center items-center w-full min-h-[96px] shadow-lg cursor-default select-none transition-all duration-300 ${colorMap[color]}`}
    >
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-[12px] font-mono font-bold text-text-primary uppercase tracking-wider mb-1">
        {title}
      </div>
      <div className="text-[10px] text-muted font-mono leading-tight">
        {subtitle}
      </div>
    </motion.div>
  );
};

export const SystemArchSection: React.FC = () => {
  return (
    <section 
      id="system" 
      className="bg-transparent py-20 md:py-28 border-t border-stroke relative overflow-hidden"
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
            SYSTEM DESIGN
          </span>
          <h2 className="text-3xl md:text-5xl tracking-tight mb-4 font-semibold text-text-primary">
            How the <span className="font-display italic text-blue-400">pipeline</span> works
          </h2>
          <p className="text-xs md:text-sm text-muted font-mono max-w-xl">
            Seven layers from raw MQTT packet to live operator dashboard.
          </p>
        </motion.div>

        {/* Desktop Pipeline Flow Diagram */}
        <div className="hidden lg:grid grid-cols-4 gap-x-8 gap-y-12 relative py-8 px-4">
          
          {/* SVG Arrow Connectors Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible" style={{ minHeight: '500px' }}>
            <defs>
              <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            
            {/* Row 1 Horizontal Flow Paths */}
            {/* MQTT SENSORS -> INGESTION */}
            <path 
              d="M 210 65 L 290 65" 
              fill="none" 
              stroke="url(#flow-grad)" 
              strokeWidth="2" 
              strokeDasharray="6 4" 
              className="animate-[dash_10s_linear_infinite]" 
              style={{ strokeDashoffset: 100 }}
            />
            {/* INGESTION -> PROCESSOR */}
            <path 
              d="M 505 65 L 585 65" 
              fill="none" 
              stroke="url(#flow-grad)" 
              strokeWidth="2" 
              strokeDasharray="6 4" 
              className="animate-[dash_10s_linear_infinite]" 
            />
            {/* PROCESSOR -> REDIS CACHE */}
            <path 
              d="M 800 65 L 880 65" 
              fill="none" 
              stroke="url(#flow-grad)" 
 strokeWidth="2" 
              strokeDasharray="6 4" 
              className="animate-[dash_10s_linear_infinite]" 
            />

            {/* Vertical Flow Branch down from PROCESSOR */}
            {/* PROCESSOR -> ALERT ENGINE */}
            <path 
              d="M 692 115 L 692 165" 
              fill="none" 
              stroke="url(#flow-grad)" 
              strokeWidth="2" 
              strokeDasharray="6 4" 
              className="animate-[dash_10s_linear_infinite]" 
            />
            
            {/* ALERT ENGINE -> POSTGRESQL */}
            <path 
              d="M 692 260 L 692 310" 
              fill="none" 
              stroke="url(#flow-grad)" 
              strokeWidth="2" 
              strokeDasharray="6 4" 
              className="animate-[dash_10s_linear_infinite]" 
            />

            {/* POSTGRESQL -> SOCKET.IO */}
            <path 
              d="M 692 405 L 692 455" 
              fill="none" 
              stroke="url(#flow-grad)" 
              strokeWidth="2" 
              strokeDasharray="6 4" 
              className="animate-[dash_10s_linear_infinite]" 
            />

            {/* SOCKET.IO -> REACT DASHBOARD */}
            <path 
              d="M 800 500 L 880 500" 
              fill="none" 
              stroke="url(#flow-grad)" 
              strokeWidth="2" 
              strokeDasharray="6 4" 
              className="animate-[dash_10s_linear_infinite]" 
            />
          </svg>

          {/* Row 1 Nodes */}
          <div className="col-start-1 row-start-1 z-10 flex items-center">
            <ArchNode title="MQTT Sensors" subtitle="factory/+/+/telemetry 1Hz" color="maintenance" icon="🔌" />
          </div>
          <div className="col-start-2 row-start-1 z-10 flex items-center">
            <ArchNode title="Ingestion" subtitle="MQTT.js Daemon / Zod validation" color="maintenance" icon="📥" />
          </div>
          <div className="col-start-3 row-start-1 z-10 flex items-center">
            <ArchNode title="Processor" subtitle="Batch updates & rule engine" color="idle" icon="⚙️" />
          </div>
          <div className="col-start-4 row-start-1 z-10 flex items-center">
            <ArchNode title="Redis Cache" subtitle="Latest machine states & alert locks" color="running" icon="⚡" />
          </div>

          {/* Row 2 Nodes */}
          <div className="col-start-3 row-start-2 z-10 flex items-center justify-center">
            <ArchNode title="Alert Engine" subtitle="Storm mitigation / 5 threshold rules" color="down" icon="🚨" />
          </div>

          {/* Row 3 Nodes */}
          <div className="col-start-3 row-start-3 z-10 flex items-center justify-center">
            <ArchNode title="PostgreSQL" subtitle="Timescale history / Prisma ORM" color="maintenance" icon="💾" />
          </div>

          {/* Row 4 Nodes */}
          <div className="col-start-3 row-start-4 z-10 flex items-center justify-center">
            <ArchNode title="Socket.IO Gateway" subtitle="Pub/Sub rooms for operators" color="maintenance" icon="🌐" />
          </div>
          <div className="col-start-4 row-start-4 z-10 flex items-center">
            <ArchNode title="React Dashboard" subtitle="Monospace SCADA console" color="running" icon="🖥️" />
          </div>

        </div>

        {/* Mobile Pipeline Flow Diagram (Stacked scroll list) */}
        <div className="lg:hidden flex flex-col items-center gap-4 relative">
          <ArchNode title="MQTT Sensors" subtitle="factory/+/+/telemetry 1Hz" color="maintenance" icon="🔌" />
          <div className="text-xl text-blue-500 my-0.5">↓</div>
          <ArchNode title="Ingestion" subtitle="MQTT.js Daemon / Zod validation" color="maintenance" icon="📥" />
          <div className="text-xl text-blue-500 my-0.5">↓</div>
          <ArchNode title="Processor" subtitle="Batch updates & rule engine" color="idle" icon="⚙️" />
          <div className="text-xl text-blue-500 my-0.5">↓</div>
          <div className="w-full grid grid-cols-2 gap-4">
            <ArchNode title="Redis Cache" subtitle="Latest states" color="running" icon="⚡" />
            <ArchNode title="Alert Engine" subtitle="Storm prevention" color="down" icon="🚨" />
          </div>
          <div className="text-xl text-blue-500 my-0.5">↓</div>
          <ArchNode title="PostgreSQL" subtitle="Prisma ORM" color="maintenance" icon="💾" />
          <div className="text-xl text-blue-500 my-0.5">↓</div>
          <ArchNode title="Socket.IO Gateway" subtitle="Pub/Sub room updates" color="maintenance" icon="🌐" />
          <div className="text-xl text-blue-500 my-0.5">↓</div>
          <ArchNode title="React Dashboard" subtitle="Monospace SCADA" color="running" icon="🖥️" />
        </div>

        {/* Bottom Callout Bar */}
        <div className="mt-16 border border-stroke/60 bg-surface/30 rounded-xl p-4 md:p-6 text-center shadow-lg">
          <span className="text-[10px] md:text-[11px] text-muted font-mono tracking-[0.1em] uppercase leading-relaxed">
            QoS 1 for telemetry · QoS 2 for safety events · Redis-first dedup · 5s batch writes
          </span>
        </div>

      </div>

      {/* Style for path animation */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-\\[dash_10s_linear_infinite\\] {
          animation: dash 10s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default SystemArchSection;
