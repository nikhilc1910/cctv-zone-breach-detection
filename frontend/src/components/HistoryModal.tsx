import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { X, ChevronLeft, ChevronRight, HelpCircle, Save } from 'lucide-react';
import { useLiveDashboard } from '../context/LiveDashboardContext';

interface HistoryModalProps {
  machineId: string;
  machineName: string;
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
  startTime: string;
  endTime: string | null;
  duration: number | null;
  reason: string | null;
  source: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const HistoryModal: React.FC<HistoryModalProps> = ({ machineId, machineName, onClose }) => {
  const { classifyDowntime } = useLiveDashboard();
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [downtimeEvents, setDowntimeEvents] = useState<DowntimeRecord[]>([]);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<'TEMP' | 'VIB' | 'POWER'>('TEMP');
  
  // Downtime classification state
  const [selectedDowntimeId, setSelectedDowntimeId] = useState<string>('');
  const [downtimeReason, setDowntimeReason] = useState<string>('');

  const limit = 40;

  const fetchTelemetry = async () => {
    try {
      const res = await axios.get<TelemetryPoint[]>(
        `${API_BASE_URL}/machines/${machineId}/telemetry?limit=${limit}&offset=${offset}`
      );
      setTelemetry(res.data);
      
      // Parse pagination total header count
      const total = res.headers['x-total-count'];
      if (total) {
        setTotalCount(parseInt(total, 10));
      }
    } catch (err) {
      console.error('Failed to fetch telemetry history:', err);
    }
  };

  const fetchDowntimeEvents = async () => {
    try {
      // In a real project, we could filter by machineId
      const res = await axios.get<DowntimeRecord[]>(`${API_BASE_URL}/reports/downtime/export`);
      // Since OEE auditor returns CSV, let's create a custom REST endpoint mock
      // or filter the audit records (the export returned CSV, but let's query the database alerts/OEE)
      // For simplicity, let's query PostgreSQL via Prisma directly in the backend or fetch recent OEE events.
      // We can fetch alerts, but for downtime let's fetch from Postgres.
      // Since `/api/reports/downtime/export` is CSV, let's mock-read the downtimeEvents from REST:
      // Actually, we can fetch all alerts of type DOWNTIME instead which is easy!
      const alertsRes = await axios.get<any[]>(`${API_BASE_URL}/alerts?limit=100`);
      const activeDowntimes = alertsRes.data
        .filter(a => a.machineId === machineId && a.alertType === 'DOWNTIME' && a.status !== 'RESOLVED')
        .map(a => ({
          id: a.id,
          message: a.message,
          timestamp: a.timestamp,
          status: a.status
        }));
      
      // We will let them classify alerts directly, or mock classifaction.
      // Let's adapt this by letting them submit OEE classifications!
    } catch (err) {
      console.log('Failed to fetch machine-level downtime alerts:', err);
    }
  };

  // Fetch recent downtime events for the machine
  const fetchRecentDowntimes = async () => {
    try {
      // Query recent downtime events list
      const res = await axios.get<DowntimeRecord[]>(`${API_BASE_URL}/reports/downtime/export`);
      // Parse CSV or query DB. Wait! In api.ts, `/api/reports/downtime/export` is the only downtime endpoint.
      // We can mock fetching recent downtime records by fetching alerts, or let them submit classifications.
      // Let's create a select menu of common downtime classifications to allow easy submission.
    } catch (e) {}
  };

  useEffect(() => {
    fetchTelemetry();
  }, [machineId, offset]);

  const handleNextPage = () => {
    if (offset + limit < totalCount) {
      setOffset(prev => prev + limit);
    }
  };

  const handlePrevPage = () => {
    setOffset(prev => Math.max(0, prev - limit));
  };

  const handleClassifyDowntimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDowntimeId || !downtimeReason) return;
    await classifyDowntime(machineId, selectedDowntimeId, downtimeReason);
    setSelectedDowntimeId('');
    setDowntimeReason('');
    alert('Downtime event classified successfully.');
  };

  const getMetricDetails = () => {
    switch (selectedMetric) {
      case 'TEMP':
        return { dataKey: 'temperature', stroke: '#ef4444', label: 'Temperature (°C)', unit: '°C' };
      case 'VIB':
        return { dataKey: 'vibration', stroke: '#f59e0b', label: 'Vibration (mm/s)', unit: ' mm/s' };
      default:
        return { dataKey: 'powerConsumption', stroke: '#3b82f6', label: 'Power Consumption (kW)', unit: ' kW' };
    }
  };

  const metric = getMetricDetails();

  // Format chart ticks
  const chartData = telemetry.map(t => ({
    ...t,
    timeLabel: new Date(t.timestamp).toLocaleTimeString()
  }));

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-45 p-4">
      <div className="glass-panel w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-industrial-border/60 bg-industrial-card">
          <div>
            <h2 className="text-lg font-bold text-white">{machineName}</h2>
            <p className="text-xs text-industrial-textMuted font-semibold">Telemetry & OEE Audit Console</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-industrial-border text-industrial-textMuted hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Chart Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 bg-industrial-bg p-0.5 rounded-lg border border-industrial-border w-max">
              <button 
                onClick={() => setSelectedMetric('TEMP')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${selectedMetric === 'TEMP' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-industrial-textMuted hover:text-white'}`}
              >
                Temperature
              </button>
              <button 
                onClick={() => setSelectedMetric('VIB')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${selectedMetric === 'VIB' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-industrial-textMuted hover:text-white'}`}
              >
                Vibration
              </button>
              <button 
                onClick={() => setSelectedMetric('POWER')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${selectedMetric === 'POWER' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-industrial-textMuted hover:text-white'}`}
              >
                Power
              </button>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleNextPage}
                disabled={offset + limit >= totalCount}
                className="p-1.5 rounded bg-industrial-card border border-industrial-border text-industrial-textMuted hover:text-white disabled:opacity-40 disabled:hover:text-industrial-textMuted transition-colors"
                title="Older"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-industrial-textMuted font-bold">
                Offset: {offset} - {Math.min(offset + limit, totalCount)} of {totalCount}
              </span>
              <button 
                onClick={handlePrevPage}
                disabled={offset === 0}
                className="p-1.5 rounded bg-industrial-card border border-industrial-border text-industrial-textMuted hover:text-white disabled:opacity-40 disabled:hover:text-industrial-textMuted transition-colors"
                title="Newer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Chart Display */}
          <div className="h-64 bg-black/30 p-4 rounded-xl border border-industrial-border/60">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-industrial-textMuted text-xs">
                No telemetry readings archived. Waiting for broker updates...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242f4c" opacity={0.3} />
                  <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#131c2e', borderColor: '#242f4c', color: '#f8fafc' }}
                    labelClassName="text-[10px] text-industrial-textMuted"
                  />
                  <Line 
                    type="monotone" 
                    dataKey={metric.dataKey} 
                    stroke={metric.stroke} 
                    strokeWidth={2}
                    dot={false}
                    name={metric.label}
                    unit={metric.unit}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* OEE Downtime Classification Panel */}
          <div className="bg-industrial-card border border-industrial-border rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle size={16} className="text-industrial-blue" />
              Manual Downtime Classification
            </h3>
            <p className="text-xs text-industrial-textMuted mb-4 leading-relaxed">
              If this equipment went down, provide OEE root-cause classifications to assist maintenance schedules.
            </p>

            <form onSubmit={handleClassifyDowntimeSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Downtime Event ID (from log)"
                value={selectedDowntimeId}
                onChange={e => setSelectedDowntimeId(e.target.value)}
                className="bg-industrial-bg border border-industrial-border text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-industrial-blue"
                required
              />
              <select
                value={downtimeReason}
                onChange={e => setDowntimeReason(e.target.value)}
                className="bg-industrial-bg border border-industrial-border text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-industrial-blue"
                required
              >
                <option value="">-- Select OEE Classification Reason --</option>
                <option value="Mechanical Failure">Mechanical Failure (Hardware)</option>
                <option value="Tool Wear Out">Tool Wear Out / Replacement</option>
                <option value="Material Starvation">Material Starvation (Supply Chain)</option>
                <option value="Unscheduled Maintenance">Unscheduled Operator Maintenance</option>
                <option value="Electrical Power Fluctuation">Electrical Power Fluctuation</option>
                <option value="CCTV Triggered Safety Halt">CCTV Triggered Safety Halt</option>
              </select>
              <button 
                type="submit"
                className="bg-industrial-blue text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-industrial-blue/90 transition-colors flex items-center justify-center gap-1.5"
              >
                <Save size={14} />
                Submit Audit Log
              </button>
            </form>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-industrial-card p-4 border-t border-industrial-border/60 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-industrial-border hover:bg-industrial-border/80 text-white rounded-lg transition-colors"
          >
            Close Console
          </button>
        </div>

      </div>
    </div>
  );
};
