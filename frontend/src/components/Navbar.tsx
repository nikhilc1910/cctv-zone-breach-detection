import React, { useEffect, useState } from 'react';

interface NavbarProps {
  onViewDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onViewDashboard }) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('OVERVIEW');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Detect active section on scroll
      const sections = [
        { id: 'overview', name: 'OVERVIEW' },
        { id: 'system', name: 'SYSTEM' },
        { id: 'metrics', name: 'METRICS' },
        { id: 'stack', name: 'STACK' }
      ];

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If section is close to the top of screen
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveSection(section.name);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4 pointer-events-none">
      <div 
        className={`inline-flex items-center rounded-full backdrop-blur-md border border-stroke/50 bg-surface/85 px-4 py-2 font-mono transition-all duration-300 pointer-events-auto ${
          scrolled ? 'shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-stroke bg-bg/90' : ''
        }`}
      >
        {/* 1. Logo */}
        <div 
          onClick={() => scrollToSection('overview')}
          className="group cursor-pointer flex items-center justify-center p-[1.5px] rounded-full w-6 h-6 bg-gradient-to-r from-blue-500 to-running transition-transform duration-300 hover:scale-110 hover:bg-gradient-to-r hover:from-running hover:to-blue-500"
        >
          <div className="flex items-center justify-center bg-bg w-full h-full rounded-full">
            <span className="text-[9px] font-bold text-text-primary tracking-tighter">DT</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-stroke mx-3 md:mx-4" />

        {/* 3. Navigation Links */}
        <div className="flex items-center gap-1">
          {[
            { label: 'OVERVIEW', target: 'overview' },
            { label: 'SYSTEM', target: 'system' },
            { label: 'METRICS', target: 'metrics' },
            { label: 'STACK', target: 'stack' }
          ].map((link) => {
            const isActive = activeSection === link.label;
            return (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.target)}
                className={`text-[10px] md:text-[11px] rounded-full px-3 py-1.5 uppercase tracking-[0.15em] transition-all duration-200 ${
                  isActive 
                    ? 'text-text-primary bg-stroke/60 font-semibold shadow-inner' 
                    : 'text-muted hover:text-text-primary'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-stroke mx-3 md:mx-4" />

        {/* 5. LIVE Button */}
        <button
          onClick={onViewDashboard}
          className="group relative flex items-center gap-2 border border-stroke/80 bg-bg hover:border-running/60 rounded-full px-3 py-1.5 transition-all duration-300"
        >
          <div className="w-1.5 h-1.5 bg-running rounded-full animate-pulse shadow-[0_0_8px_hsl(var(--running))]" />
          <span className="text-[10px] md:text-[11px] text-text-primary font-semibold uppercase tracking-[0.15em] group-hover:text-running transition-colors duration-200">
            LIVE
          </span>
          <span className="absolute inset-0 rounded-full border border-transparent group-hover:border-running/30 transition-all duration-300 scale-105 pointer-events-none" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
