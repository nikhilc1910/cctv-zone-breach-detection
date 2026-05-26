import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

interface LogLine {
  time: string;
  text: string;
  checked: boolean;
  triggerTime: number; // relative time in ms when this line starts showing
}

const LOG_DATA: LogLine[] = [
  { time: '[  0.001s]', text: 'Initializing observability core...', checked: false, triggerTime: 100 },
  { time: '[  0.048s]', text: 'Redis connection established', checked: true, triggerTime: 350 },
  { time: '[  0.112s]', text: 'PostgreSQL schema migrated', checked: true, triggerTime: 600 },
  { time: '[  0.203s]', text: 'MQTT broker handshake complete', checked: true, triggerTime: 850 },
  { time: '[  0.387s]', text: 'Socket.IO gateway mounted', checked: true, triggerTime: 1100 },
  { time: '[  0.541s]', text: 'Alert engine armed — 5 rules loaded', checked: true, triggerTime: 1350 },
  { time: '[  0.699s]', text: 'Heartbeat monitor daemon started', checked: true, triggerTime: 1600 },
  { time: '[  0.812s]', text: 'Ingesting factory/line/+/machine/+/telemetry', checked: true, triggerTime: 1850 },
  { time: '[  1.240s]', text: '6 machines registered on production floor', checked: true, triggerTime: 2100 },
  { time: '[  2.100s]', text: 'Dashboard ready — all systems nominal.', checked: false, triggerTime: 2350 }
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [visibleLinesCount, setVisibleLinesCount] = useState(0);
  const [typingText, setTypingText] = useState<string[]>(LOG_DATA.map(() => ''));
  const [isExiting, setIsExiting] = useState(false);

  // Counter animation 0 -> 100 over 2800ms
  useEffect(() => {
    const duration = 2800;
    const intervalTime = 28;
    const step = 100 / (duration / intervalTime);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= 100) {
        setCount(100);
        clearInterval(timer);
        // Hold for 400ms then exit
        setTimeout(() => {
          setIsExiting(true);
        }, 400);
      } else {
        setCount(Math.floor(current));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Triggering log lines
  useEffect(() => {
    const timers = LOG_DATA.map((line, index) => {
      return setTimeout(() => {
        setVisibleLinesCount(index + 1);
      }, line.triggerTime);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Typewriter effect for visible lines
  useEffect(() => {
    if (visibleLinesCount === 0) return;

    const activeIndex = visibleLinesCount - 1;
    const targetLine = LOG_DATA[activeIndex];
    let charIndex = 0;
    
    const interval = setInterval(() => {
      setTypingText((prev) => {
        const next = [...prev];
        next[activeIndex] = targetLine.text.slice(0, charIndex + 1);
        return next;
      });
      charIndex++;
      if (charIndex >= targetLine.text.length) {
        clearInterval(interval);
      }
    }, 15); // fast typewriter effect (15ms per character)

    return () => clearInterval(interval);
  }, [visibleLinesCount]);

  // Handle completion callback after slide-up exit
  const handleExitComplete = () => {
    onComplete();
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {!isExiting && (
        <motion.div
          key="loader"
          initial={{ y: 0, opacity: 1 }}
          exit={{ 
            y: '-100vh', 
            opacity: 0,
            transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } 
          }}
          className="fixed inset-0 z-[9999] bg-bg font-mono text-text-primary p-6 md:p-12 flex flex-col justify-between select-none"
        >
          {/* Top-Left Info */}
          <div>
            <div className="text-xs text-muted uppercase tracking-[0.4em] font-bold">
              AUTONEX AI
            </div>
            <div className="text-[11px] text-muted/60 tracking-[0.2em] mt-1">
              DIGITAL TWIN v1.0.0
            </div>
          </div>

          {/* Center-Left Terminal Log */}
          <div className="max-w-xl w-full mx-auto self-center mt-[-10vh]">
            <div className="space-y-2.5 h-[320px] overflow-hidden flex flex-col justify-start">
              {LOG_DATA.map((line, idx) => {
                if (idx >= visibleLinesCount) return null;
                const isCurrentTyping = idx === visibleLinesCount - 1 && typingText[idx].length < line.text.length;
                return (
                  <div key={idx} className="text-[12px] leading-relaxed flex items-start">
                    <span className="text-muted mr-3 shrink-0">{line.time}</span>
                    <span className="text-text-primary mr-1 break-words">
                      {typingText[idx]}
                      {isCurrentTyping && (
                        <span className="inline-block w-1.5 h-3.5 bg-text-primary ml-0.5 animate-blink-cursor" />
                      )}
                    </span>
                    {!isCurrentTyping && line.checked && (
                      <span className="text-running ml-1.5 font-bold">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Controls / Stats */}
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
              {/* Bottom-Left Status */}
              <div className="text-[10px] text-muted uppercase tracking-[0.3em]">
                {count < 100 ? 'SYSTEM BOOTING...' : 'INITIALIZATION COMPLETE'}
              </div>

              {/* Bottom-Right Counter */}
              <div className="text-7xl font-display italic text-text-primary/20 leading-none select-none">
                {String(count).padStart(3, '0')}
              </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="relative w-full h-[2px] bg-stroke overflow-hidden rounded-full">
              <motion.div
                className="absolute left-0 top-0 h-full accent-gradient origin-left"
                style={{ 
                  width: `${count}%`,
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.4)'
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
