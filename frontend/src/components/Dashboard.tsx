import React, { useState } from 'react';
import { LiveDashboardProvider } from '../context/LiveDashboardContext';
import type { MachineState } from '../context/LiveDashboardContext';
import { TopRibbon } from './TopRibbon';
import { PlantMap } from './PlantMap';
import { AlertsPanel } from './AlertsPanel';
import { TrendModal } from './TrendModal';

interface DashboardProps {
  onBack: () => void;
}

const DashboardContent: React.FC<DashboardProps> = ({ onBack }) => {
  const [selectedMachine, setSelectedMachine] = useState<MachineState | null>(null);

  return (
    <div
      className="monospace-all"
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
      <TopRibbon onBack={onBack} />

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
        {/* Left: Plant Grid Layout */}
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
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  return (
    <LiveDashboardProvider>
      <DashboardContent onBack={onBack} />
    </LiveDashboardProvider>
  );
};

export default Dashboard;
