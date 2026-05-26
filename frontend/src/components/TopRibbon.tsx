import React from 'react';
import { useLiveDashboard } from '../context/LiveDashboardContext';

export const TopRibbon: React.FC = () => {
  const { machines, alerts, isConnected } = useLiveDashboard();

  const total = machines.length;
  const running = machines.filter((m) => m.status === 'RUNNING').length;
  const idle = machines.filter((m) => m.status === 'IDLE').length;
  const down = machines.filter((m) => m.status === 'DOWN').length;
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div
      style={{
        height: '48px',
        width: '100%',
        backgroundColor: '#111111',
        borderBottom: '1px solid #1f1f1f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        userSelect: 'none',
      }}
    >
      {/* Left: Project Brand with Connection State */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#22c55e' : '#ef4444',
            boxShadow: isConnected
              ? '0 0 8px #22c55e'
              : '0 0 8px #ef4444',
            animation: 'blink 1.5s step-start infinite',
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px' }}>
          DIGITAL TWIN / AUTONEX
        </span>
      </div>

      {/* Right: Summary Stat Blocks */}
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <StatBlock label="TOTAL" value={total} color="#e8e8e2" />
        <StatBlock label="RUNNING" value={running} color={running > 0 ? '#22c55e' : '#52524e'} />
        <StatBlock label="IDLE" value={idle} color={idle > 0 ? '#f59e0b' : '#52524e'} />
        <StatBlock label="DOWN" value={down} color={down > 0 ? '#ef4444' : '#52524e'} />
        <StatBlock label="ALERTS" value={activeAlerts} color={activeAlerts > 0 ? '#ef4444' : '#52524e'} />
      </div>
    </div>
  );
};

interface StatBlockProps {
  label: string;
  value: number;
  color: string;
}

const StatBlock: React.FC<StatBlockProps> = ({ label, value, color }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 16px',
        height: '100%',
        borderLeft: '1px solid #1f1f1f',
        width: '90px',
      }}
    >
      <span style={{ fontSize: '11px', color: '#52524e', fontWeight: 400 }}>
        {label}
      </span>
      <div style={{ height: '24px', overflow: 'hidden', position: 'relative' }}>
        {/* React Key Change Re-render Trigger for Counter Roll Animation */}
        <span
          key={value}
          className="counter-roll"
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: color,
            display: 'block',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
};
