import React from 'react';
import { useLiveDashboard } from '../context/LiveDashboardContext';
import type { MachineState } from '../context/LiveDashboardContext';
import { MachineCell } from './MachineCell';

interface PlantMapProps {
  onSelectMachine: (machine: MachineState) => void;
}

export const PlantMap: React.FC<PlantMapProps> = ({ onSelectMachine }) => {
  const { machines, selectedLine, setSelectedLine } = useLiveDashboard();

  // Filter machines based on selected line
  const filteredMachines = selectedLine === 'ALL'
    ? machines
    : machines.filter((m) => m.lineId === selectedLine);

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        backgroundColor: '#0a0a0a',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflowY: 'auto',
      }}
    >
      {/* Header with section name and Line filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1f1f1f',
          paddingBottom: '8px',
          height: '24px',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '11px', color: '#52524e', fontWeight: 600, letterSpacing: '0.5px' }}>
          PRODUCTION FLOOR
        </span>

        {/* Controls: Export & Line Filters */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* OEE CSV Export Button */}
          <button
            onClick={() => window.open('http://localhost:5000/api/reports/downtime/export', '_blank')}
            style={{
              background: 'none',
              border: '1px solid #1f1f1f',
              borderRadius: '2px',
              color: '#ef4444', // Red text matching status/alert cues
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'JetBrains Mono, monospace',
              padding: '2px 8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1f1f1f')}
          >
            [EXPORT OEE]
          </button>

          <div style={{ width: '1px', height: '12px', backgroundColor: '#1f1f1f' }} />

          {/* Line Filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'line_1', 'line_2', 'line_3'].map((line) => {
              const label = line === 'ALL' ? 'ALL' : `LINE ${line.split('_')[1]}`;
              const isActive = selectedLine === line;
              return (
                <button
                  key={line}
                  onClick={() => setSelectedLine(line)}
                  style={{
                    background: 'none',
                    border: `1px solid ${isActive ? '#e8e8e2' : '#1f1f1f'}`,
                    borderRadius: '2px',
                    color: isActive ? '#e8e8e2' : '#52524e',
                    fontSize: '11px',
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: 'JetBrains Mono, monospace',
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Container with Scan-line animation overlay */}
      <div
        className="scan-line-container"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 120px))',
          gridAutoRows: '90px',
          gap: '8px',
          minHeight: '200px',
          position: 'relative',
        }}
      >
        {filteredMachines.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              color: '#52524e',
              height: '100%',
            }}
          >
            establishing connection...
          </div>
        ) : (
          filteredMachines.map((m) => (
            <MachineCell
              key={m.id}
              machine={m}
              onClick={() => onSelectMachine(m)}
            />
          ))
        )}
      </div>
    </div>
  );
};
