import React from 'react';
import { useLiveDashboard } from '../context/LiveDashboardContext';
import { AlertRow } from './AlertRow';

export const AlertsPanel: React.FC = () => {
  const { alerts } = useLiveDashboard();

  // Filter out RESOLVED alerts, keeping ACTIVE and ACKNOWLEDGED
  const activeAndAckAlerts = alerts.filter((a) => a.status !== 'RESOLVED');
  
  // Calculate count of strictly ACTIVE alerts for the header
  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div
      style={{
        width: '280px',
        height: '100%',
        backgroundColor: '#111111',
        borderLeft: '1px solid #1f1f1f',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1f1f1f',
          padding: '12px',
          height: '40px',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '11px', color: '#52524e', fontWeight: 600, letterSpacing: '0.5px' }}>
          ACTIVE ALERTS
        </span>
        {activeCount > 0 && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#ef4444',
              color: '#0a0a0a',
              padding: '1px 6px',
              borderRadius: '2px',
            }}
          >
            {activeCount}
          </span>
        )}
      </div>

      {/* List container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '8px',
          gap: '8px',
        }}
      >
        {activeAndAckAlerts.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '11px',
              color: '#52524e',
              textTransform: 'lowercase',
            }}
          >
            no active alerts
          </div>
        ) : (
          activeAndAckAlerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
};
