import React, { useState } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import SystemArchSection from './components/SystemArchSection';
import LiveMetricsSection from './components/LiveMetricsSection';
import TechStackSection from './components/TechStackSection';
import StatsSection from './components/StatsSection';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import VideoWallpaper from './components/VideoWallpaper';
import CustomCursor from './components/CustomCursor';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard) {
    return <Dashboard onBack={() => setShowDashboard(false)} />;
  }

  return (
    <div className="bg-bg text-text-primary font-mono relative min-h-screen">
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      
      <VideoWallpaper />
      <CustomCursor />
      
      <div className="relative z-10 w-full">
        <Navbar onViewDashboard={() => setShowDashboard(true)} />
        <HeroSection onViewDashboard={() => setShowDashboard(true)} />
        <SystemArchSection />
        <LiveMetricsSection />
        <TechStackSection />
        <StatsSection />
        <Footer />
      </div>
    </div>
  );
};

export default App;
export {};
