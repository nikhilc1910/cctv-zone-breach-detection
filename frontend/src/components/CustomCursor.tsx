import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(true);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Buffer spring for outer lag ring
  const springConfig = { damping: 30, stiffness: 280, mass: 0.6 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (hidden) setHidden(false);
    };

    const handleMouseLeave = () => setHidden(true);
    const handleMouseEnter = () => setHidden(false);

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Bind event listeners to interactive elements
    const addHoverListeners = () => {
      const elements = document.querySelectorAll(
        'button, a, .parallax-card, .bento-card, [role="button"], input, select, textarea'
      );
      elements.forEach((el) => {
        el.addEventListener('mouseenter', () => setHovered(true));
        el.addEventListener('mouseleave', () => setHovered(false));
      });
    };

    // Watch DOM mutations to attach listeners to dynamically rendered elements
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Initial binding
    addHoverListeners();

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      observer.disconnect();
    };
  }, [cursorX, cursorY, hidden]);

  if (hidden) return null;

  return (
    <>
      {/* 1. Spring-buffered Outer Ring Cursor */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 hidden md:block"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          scale: hovered ? 1.6 : 1.0,
          borderColor: hovered ? 'rgba(34, 197, 94, 0.7)' : 'rgba(59, 130, 246, 0.7)',
          backgroundColor: hovered ? 'rgba(34, 197, 94, 0.05)' : 'rgba(59, 130, 246, 0.02)',
          boxShadow: hovered 
            ? '0 0 10px rgba(34, 197, 94, 0.1)' 
            : '0 0 10px rgba(59, 130, 246, 0.05)'
        }}
      />
      {/* 2. Direct-tracking Inner Dot Cursor */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-running rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 hidden md:block shadow-[0_0_8px_hsl(var(--running))]"
        style={{
          x: cursorX,
          y: cursorY,
          scale: hovered ? 0.5 : 1.0,
          backgroundColor: hovered ? '#22c55e' : '#3b82f6'
        }}
      />
    </>
  );
};

export default CustomCursor;
