import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from 'recharts';
import { useLiveDashboard } from '../context/LiveDashboardContext';
import type { MachineState } from '../context/LiveDashboardContext';

interface TrendModalProps {
  machine: MachineState;
  onClose: () => void;
}

interface TelemetryPoint {
  id: string;
  timestamp: string;
  temperature: number;
  vibration: number;
  powerConsumption: number;
}

interface DowntimeRecord {
  id: string;
  machineId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  reason: string | null;
  source: string;
}

const API_BASE_URL = '/api';

const DOWNTIME_REASONS = [
  'Mechanical Failure',
  'Electrical Issue',
  'Supply Shortage',
  'Operator Overrun',
  'Scheduled Maintenance',
  'Emergency Stop',
];

export const TrendModal: React.FC<TrendModalProps> = ({ machine, onClose }) => {
  const { classifyDowntime } = useLiveDashboard();
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [downtimeEvents, setDowntimeEvents] = useState<DowntimeRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [downtimeReason, setDowntimeReason] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch telemetry history (limit to latest 30 readings)
  const fetchTelemetryData = async (silent = false) => {
    try {
      const res = await axios.get<TelemetryPoint[]>(
        `${API_BASE_URL}/machines/${machine.id}/telemetry?limit=30`
      );
      setTelemetry(res.data);
    } catch (err) {
      console.error('Failed to fetch machine telemetry history:', err);
      if (!silent) throw err;
    }
  };

  // Fetch recent downtime events
  const fetchDowntimeData = async (silent = false) => {
    try {
      const res = await axios.get<DowntimeRecord[]>(
        `${API_BASE_URL}/machines/${machine.id}/downtime`
      );
      setDowntimeEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch machine downtime events:', err);
      if (!silent) throw err;
    }
  };

  useEffect(() => {
    let active = true;
    const loadInitialData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        await Promise.all([
          fetchTelemetryData(false),
          fetchDowntimeData(false)
        ]);
      } catch (err) {
        setFetchError('Failed to load telemetry data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialData();

    // Poll every 3 seconds to update the active charts in real time when modal is open
    const interval = setInterval(() => fetchTelemetryData(true), 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [machine.id]);

  const handleClassifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !downtimeReason) return;

    try {
      await classifyDowntime(machine.id, selectedEventId, downtimeReason);
      setSelectedEventId('');
      setDowntimeReason('');
      fetchDowntimeData(true); // refresh the table
    } catch (err) {
      console.error('Downtime classification failed:', err);
    }
  };

  // Format data for Recharts (parse timestamps to simple time strings)
  const chartData = telemetry.map((pt) => ({
    ...pt,
    timeLabel: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }));

  // Status colors mapping
  const statusColors: Record<string, string> = {
    RUNNING: '#22c55e',
    IDLE: '#f59e0b',
    DOWN: '#ef4444',
    MAINTENANCE: '#3b82f6',
    UNKNOWN: '#52524e',
  };
  const statusColor = statusColors[machine.status] || statusColors.UNKNOWN;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        boxSizing: 'border-box',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '680px',
          maxHeight: '90vh',
          backgroundColor: '#111111',
          border: '1px solid #1f1f1f',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()} // Prevent click-through overlay closing
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1f1f1f',
            padding: '12px',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>{machine.id}</span>
            <span style={{ fontSize: '13px', color: '#52524e' }}>— {machine.name}</span>
            <span
              style={{
                fontSize: '11px',
                color: statusColor,
                fontWeight: 600,
                borderLeft: `2px solid ${statusColor}`,
                paddingLeft: '4px',
                lineHeight: 1,
              }}
            >
              {machine.status}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#52524e',
              fontSize: '15px',
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
              padding: '4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e8e8e2')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#52524e')}
          >
            [X]
          </button>
        </div>

        {/* Scrollable Content Panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading && (
            <div style={{ color: '#52524e', fontSize: '13px', textAlign: 'center', padding: '40px', fontFamily: 'JetBrains Mono, monospace' }}>
              loading telemetry...
            </div>
          )}
          {fetchError && (
            <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '40px', fontFamily: 'JetBrains Mono, monospace' }}>
              {fetchError}
            </div>
          )}
          {!loading && !fetchError && (
            <>
              {/* Temperature Chart */}
              <ChartSection
                title="TEMPERATURE (°C)"
                data={chartData}
                dataKey="temperature"
                strokeColor="#ef4444"
              />

              {/* Vibration Chart */}
              <ChartSection
                title="VIBRATION (MM/S)"
                data={chartData}
                dataKey="vibration"
                strokeColor="#f59e0b"
              />

              {/* Power Consumption Chart */}
              <ChartSection
                title="POWER CONSUMPTION (KW)"
                data={chartData}
                dataKey="powerConsumption"
                strokeColor="#3b82f6"
              />

              {/* Downtime Event log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#52524e', fontWeight: 600, letterSpacing: '0.5px' }}>
                  RECENT DOWNTIME EVENTS
                </span>
                <div style={{ border: '1px solid #1f1f1f', borderRadius: '2px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #1f1f1f' }}>
                        <th style={{ padding: '6px 8px', color: '#52524e' }}>EVENT ID</th>
                        <th style={{ padding: '6px 8px', color: '#52524e' }}>START</th>
                        <th style={{ padding: '6px 8px', color: '#52524e' }}>DURATION</th>
                        <th style={{ padding: '6px 8px', color: '#52524e' }}>SOURCE</th>
                        <th style={{ padding: '6px 8px', color: '#52524e' }}>REASON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downtimeEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '12px 8px', color: '#52524e', textAlign: 'center' }}>
                            no downtime records archived
                          </td>
                        </tr>
                      ) : (
                        downtimeEvents.map((evt) => (
                          <tr key={evt.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                            <td style={{ padding: '6px 8px', color: '#52524e', fontFamily: 'monospace' }}>
                              {evt.id.substring(0, 8)}...
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              {new Date(evt.startTime).toLocaleString()}
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              {evt.duration !== null ? `${evt.duration}s` : 'active'}
                            </td>
                            <td style={{ padding: '6px 8px', color: '#52524e' }}>
                              {evt.source}
                            </td>
                            <td style={{ padding: '6px 8px', color: evt.reason ? '#e8e8e2' : '#f59e0b' }}>
                              {evt.reason || 'unclassified'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* OEE Downtime Classification Form */}
              {downtimeEvents.some((evt) => !evt.reason) && (
                <div
                  style={{
                    border: '1px solid #1f1f1f',
                    borderRadius: '2px',
                    padding: '12px',
                    backgroundColor: '#0a0a0a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#52524e', fontWeight: 600, letterSpacing: '0.5px' }}>
                    OEE AUDIT DOWNTIME ROOT-CAUSE ASSIGNMENT
                  </span>
                  <form onSubmit={handleClassifySubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Event Select */}
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: '#111111',
                        border: '1px solid #1f1f1f',
                        borderRadius: '2px',
                        color: '#e8e8e2',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono, monospace',
                        height: '28px',
                        padding: '0 6px',
                      }}
                      required
                    >
                      <option value="">-- Choose Unclassified Event --</option>
                      {downtimeEvents
                        .filter((evt) => !evt.reason)
                        .map((evt) => (
                          <option key={evt.id} value={evt.id}>
                            {evt.id.substring(0, 8)}... ({new Date(evt.startTime).toLocaleTimeString()})
                          </option>
                        ))}
                    </select>

                    {/* Reason Select */}
                    <select
                      value={downtimeReason}
                      onChange={(e) => setDowntimeReason(e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: '#111111',
                        border: '1px solid #1f1f1f',
                        borderRadius: '2px',
                        color: '#e8e8e2',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono, monospace',
                        height: '28px',
                        padding: '0 6px',
                      }}
                      required
                    >
                      <option value="">-- Choose OEE Reason --</option>
                      {DOWNTIME_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    {/* Submit */}
                    <button
                      type="submit"
                      style={{
                        height: '28px',
                        backgroundColor: 'none',
                        border: '1px solid #1f1f1f',
                        borderRadius: '2px',
                        color: '#e8e8e2',
                        fontSize: '11px',
                        fontWeight: 600,
                        fontFamily: 'JetBrains Mono, monospace',
                        padding: '0 12px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#e8e8e2')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1f1f1f')}
                    >
                      SUBMIT
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface ChartSectionProps {
  title: string;
  data: any[];
  dataKey: string;
  strokeColor: string;
}

const ChartSection: React.FC<ChartSectionProps> = ({ title, data, dataKey, strokeColor }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '11px', color: '#52524e', fontWeight: 600, letterSpacing: '0.5px' }}>
        {title}
      </span>
      <div style={{ height: '120px', backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '2px', padding: '6px' }}>
        {data.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', height: '100%', fontSize: '11px', color: '#52524e' }}>
            no historical data archived
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={108}>
            <LineChart data={data} margin={{ top: 2, right: 6, left: 6, bottom: 2 }}>
              <XAxis
                dataKey="timeLabel"
                stroke="#52524e"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#1f1f1f' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111111',
                  borderColor: '#1f1f1f',
                  borderRadius: '2px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: '#e8e8e2',
                }}
                itemStyle={{ color: strokeColor }}
                labelClassName="text-muted"
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={strokeColor}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
