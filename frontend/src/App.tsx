import React, { useState } from 'react';
import { LiveDashboardProvider } from './context/LiveDashboardContext';
import type { MachineState } from './context/LiveDashboardContext';
import { TopRibbon } from './components/TopRibbon';
import { PlantMap } from './components/PlantMap';
import { AlertsPanel } from './components/AlertsPanel';
import { TrendModal } from './components/TrendModal';

const App: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<MachineState | null>(null);

  return (
    <LiveDashboardProvider>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          backgroundColor: '#0a0a0a',
          color: '#e8e8e2',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Status & Metrics Ribbon */}
        <TopRibbon />

        {/* Main Terminal Workspace Layout */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            width: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* Left: Plant Interactive Grid Layout */}
          <PlantMap onSelectMachine={setSelectedMachine} />

          {/* Right: Active Warning Sidebar Feed */}
          <AlertsPanel />
        </div>

        {/* Historical Trends & OEE Audit Overlay Modal */}
        {selectedMachine && (
          <TrendModal
            machine={selectedMachine}
            onClose={() => setSelectedMachine(null)}
          />
        )}
      </div>
    </LiveDashboardProvider>
  );
};

export default App;
