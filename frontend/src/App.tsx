import React from 'react';
import { LiveDashboardProvider } from './context/LiveDashboardContext';
import { PlantSummary } from './components/PlantSummary';
import { MachineGrid } from './components/MachineGrid';
import { SidebarAlerts } from './components/SidebarAlerts';
import { Download, Cpu, RefreshCw } from 'lucide-react';

function App() {
  const handleExportCsv = () => {
    // Triggers download of full OEE auditing logs as structured CSV attachment
    window.open('http://localhost:5000/api/reports/downtime/export', '_blank');
  };

  return (
    <LiveDashboardProvider>
      <div className="min-h-screen bg-industrial-bg text-slate-100 flex flex-col">
        
        {/* Navigation / Header Bar */}
        <header className="glass-panel border-b border-industrial-border/60 py-4 px-6 mb-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
              <div className="bg-industrial-blue p-2 rounded-xl text-white shadow-lg shadow-blue-500/40">
                <Cpu size={24} className="animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-md sm:text-lg font-bold tracking-wider text-white uppercase flex items-center gap-2">
                  Autonex AI Digital Twin
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-industrial-blue/20 text-blue-400 border border-industrial-blue/30 tracking-widest">
                    v1.2.0
                  </span>
                </h1>
                <p className="text-[10px] text-industrial-textMuted font-bold uppercase tracking-widest mt-0.5">
                  Factory Floor Real-Time Observability
                </p>
              </div>
            </div>

            {/* Actions & Auditing */}
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-industrial-textMuted font-semibold">
                <RefreshCw size={12} className="animate-spin text-industrial-blue" />
                Live Sync Active
              </span>
              
              <button 
                onClick={handleExportCsv}
                className="bg-industrial-blue hover:bg-industrial-blue/90 border border-blue-500/30 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <Download size={14} />
                Export OEE Audit Report
              </button>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-8 flex flex-col gap-6">
          
          {/* OEE Statistics Ribbon */}
          <PlantSummary />

          {/* Core Panel Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left: Production Line Grid Layout (3/4 Width) */}
            <div className="lg:col-span-3">
              <MachineGrid />
            </div>

            {/* Right: Active Warning Sidebar Feed (1/4 Width) */}
            <div className="lg:col-span-1">
              <SidebarAlerts />
            </div>

          </div>

        </main>

        {/* Footer info bar */}
        <footer className="glass-panel border-t border-industrial-border/30 py-3 text-center text-[10px] text-industrial-textMuted/60 font-semibold mt-auto">
          &copy; {new Date().getFullYear()} Autonex AI &bull; Industry 4.0 Telemetry Observability Suite &bull; Sandbox Console
        </footer>

      </div>
    </LiveDashboardProvider>
  );
}

export default App;
