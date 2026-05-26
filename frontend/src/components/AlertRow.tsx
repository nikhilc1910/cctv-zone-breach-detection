import React, { useState } from 'react';
import { useLiveDashboard } from '../context/LiveDashboardContext';
import type { Alert } from '../context/LiveDashboardContext';
import { useRelativeTime } from '../hooks/useRelativeTime';

interface AlertRowProps {
  alert: Alert;
}

export const AlertRow: React.FC<AlertRowProps> = ({ alert }) => {
  const { acknowledgeAlert, resolveAlert } = useLiveDashboard();
  const relativeTime = useRelativeTime(alert.timestamp);

  // States to manage hover border color
  const [hoveredAck, setHoveredAck] = useState(false);
  const [hoveredResolve, setHoveredResolve] = useState(false);

  // Severity colors mapping
  const severityColors = {
    CRITICAL: '#ef4444', // Red
    HIGH: '#f59e0b',     // Amber
    MEDIUM: '#3b82f6',   // Blue
    LOW: '#52524e',      // Gray
  };

  const severityColor = severityColors[alert.severity] || severityColors.LOW;

  // Check if camera event
  const isCameraAlert = !!alert.cameraEventId;

  return (
    <div
      className="animate-slide-in"
      style={{
        backgroundColor: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: '2px',
        padding: '8px',
        display: 'flex',
        gap: '8px',
        position: 'relative',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Left Severity Indicator Bar */}
      <div
        style={{
          width: '2px',
          height: 'auto',
          alignSelf: 'stretch',
          backgroundColor: severityColor,
        }}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        {/* Source ID + Type Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#52524e', fontWeight: 600 }}>
            {alert.machineId || alert.cameraId || 'SYSTEM'}
          </span>
          <span style={{ fontSize: '11px', color: '#52524e' }}>
            {relativeTime}
          </span>
        </div>

        {/* Alert Type */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: severityColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {isCameraAlert ? `CAM: ${alert.alertType}` : alert.alertType}
        </div>

        {/* Message Body */}
        <div
          style={{
            fontSize: '11px',
            color: '#52524e',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
          }}
        >
          {alert.message}
        </div>

        {/* Actions Row */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          {alert.status === 'ACTIVE' && (
            <button
              onClick={() => acknowledgeAlert(alert.id)}
              onMouseEnter={() => setHoveredAck(true)}
              onMouseLeave={() => setHoveredAck(false)}
              style={{
                height: '22px',
                background: 'none',
                border: `1px solid ${hoveredAck ? severityColor : '#1f1f1f'}`,
                color: hoveredAck ? severityColor : '#e8e8e2',
                borderRadius: '2px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '0 8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              [ACK]
            </button>
          )}

          {alert.status !== 'RESOLVED' && (
            <button
              onClick={() => resolveAlert(alert.id)}
              onMouseEnter={() => setHoveredResolve(true)}
              onMouseLeave={() => setHoveredResolve(false)}
              style={{
                height: '22px',
                background: 'none',
                border: `1px solid ${hoveredResolve ? severityColor : '#1f1f1f'}`,
                color: hoveredResolve ? severityColor : '#e8e8e2',
                borderRadius: '2px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '0 8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              [RESOLVE]
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
