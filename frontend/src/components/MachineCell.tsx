import React from 'react';
import type { MachineState } from '../context/LiveDashboardContext';

interface MachineCellProps {
  machine: MachineState;
  onClick: () => void;
}

export const MachineCell: React.FC<MachineCellProps> = ({ machine, onClick }) => {
  const { id, name, status, lastTemperature, lastVibration, lastPower } = machine;

  // Threshold breach criteria
  const isTempCritical = lastTemperature !== null && lastTemperature > 80.0;
  const isVibCritical = lastVibration !== null && lastVibration > 5.0;

  // Status colors mapping
  const statusColors: Record<string, string> = {
    RUNNING: '#22c55e',
    IDLE: '#f59e0b',
    DOWN: '#ef4444',
    MAINTENANCE: '#3b82f6',
    UNKNOWN: '#52524e',
  };

  const statusColor = statusColors[status] || statusColors.UNKNOWN;

  // Format values
  const formattedTemp = lastTemperature !== null ? `${lastTemperature.toFixed(1)}` : '...';
  const formattedVib = lastVibration !== null ? `${lastVibration.toFixed(2)}` : '...';
  const formattedPwr = lastPower !== null ? `${lastPower.toFixed(1)}` : '...';

  // CSS for flash colors based on machine status
  const flashStyle = {
    '--flash-color': statusColor,
  } as React.CSSProperties;

  return (
    <div
      onClick={onClick}
      className={status === 'DOWN' ? 'pulse-down' : ''}
      style={{
        width: '120px',
        height: '90px',
        backgroundColor: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: '4px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Row: Machine ID and Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '14px' }}>
        <span style={{ fontSize: '11px', color: '#52524e', fontWeight: 600 }}>
          {id}
        </span>
        <div
          style={{
            fontSize: '11px',
            color: statusColor,
            fontWeight: 600,
            borderLeft: `2px solid ${statusColor}`,
            paddingLeft: '4px',
            lineHeight: 1,
          }}
        >
          {status}
        </div>
      </div>

      {/* Middle Row: Machine Name */}
      <div
        style={{
          fontSize: '13px',
          fontWeight: 400,
          color: '#e8e8e2',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          margin: '4px 0',
        }}
        title={name}
      >
        {name}
      </div>

      {/* Bottom Row: Micro-metrics */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#e8e8e2',
          borderTop: '1px solid #1f1f1f',
          paddingTop: '6px',
        }}
      >
        {/* Temperature */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
          <span
            key={formattedTemp}
            className="flash-active"
            style={{
              ...flashStyle,
              color: isTempCritical ? '#ef4444' : '#e8e8e2',
              fontWeight: isTempCritical ? 600 : 400,
              display: 'inline-block',
            }}
          >
            {formattedTemp}
          </span>
          <span style={{ fontSize: '9px', color: '#52524e' }}>°C</span>
        </div>

        {/* Vibration */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, borderLeft: '1px solid #1f1f1f', borderRight: '1px solid #1f1f1f' }}>
          <span
            key={formattedVib}
            className="flash-active"
            style={{
              ...flashStyle,
              color: isVibCritical ? '#ef4444' : '#e8e8e2',
              fontWeight: isVibCritical ? 600 : 400,
              display: 'inline-block',
            }}
          >
            {formattedVib}
          </span>
          <span style={{ fontSize: '9px', color: '#52524e' }}>MM/S</span>
        </div>

        {/* Power */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
          <span
            key={formattedPwr}
            className="flash-active"
            style={{
              ...flashStyle,
              color: '#e8e8e2',
              display: 'inline-block',
            }}
          >
            {formattedPwr}
          </span>
          <span style={{ fontSize: '9px', color: '#52524e' }}>KW</span>
        </div>
      </div>
    </div>
  );
};
