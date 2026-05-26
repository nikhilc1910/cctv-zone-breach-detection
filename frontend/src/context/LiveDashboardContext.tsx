import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';

export interface MachineState {
  id: string;
  name: string;
  lineId: string;
  status: 'RUNNING' | 'IDLE' | 'DOWN' | 'MAINTENANCE' | 'UNKNOWN';
  lastTemperature: number | null;
  lastVibration: number | null;
  lastPower: number | null;
  lastUpdated: string;
}

export interface CameraEvent {
  id: string;
  cameraId: string;
  zone: string;
  timestamp: string;
  eventType: string;
  confidence: number;
  imageUrl: string;
}

export interface Alert {
  id: string;
  machineId: string | null;
  cameraId: string | null;
  cameraEventId: string | null;
  cameraEvent?: CameraEvent | null;
  alertType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  message: string;
  timestamp: string;
  resolvedAt: string | null;
  acknowledgedAt: string | null;
}

interface LiveDashboardContextProps {
  machines: MachineState[];
  alerts: Alert[];
  isConnected: boolean;
  selectedLine: string;
  setSelectedLine: (lineId: string) => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  classifyDowntime: (machineId: string, eventId: string, reason: string) => Promise<void>;
}

const LiveDashboardContext = createContext<LiveDashboardContextProps | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const LiveDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [machines, setMachines] = useState<MachineState[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch initial alerts list via REST API
  const fetchInitialAlerts = async () => {
    try {
      const res = await axios.get<Alert[]>(`${API_BASE_URL}/alerts?limit=50`);
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch initial alerts:', err);
    }
  };

  useEffect(() => {
    fetchInitialAlerts();

    // Connect to WebSocket Server
    const socketInstance = io(import.meta.env.VITE_WS_URL || '/', {
      path: '/socket.io'
    });
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket.IO connection active.');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket.IO connection lost.');
    });

    // Handle cache pre-population
    socketInstance.on('telemetry:init', (data: MachineState[]) => {
      const sorted = [...data].sort((a, b) => a.id.localeCompare(b.id));
      setMachines(sorted);
    });

    // Handle real-time machine telemetry packet updates
    socketInstance.on('telemetry:update', (data: MachineState) => {
      setMachines((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        const updated = exists
          ? prev.map((m) => (m.id === data.id ? data : m))
          : [...prev, data];
        return [...updated].sort((a, b) => a.id.localeCompare(b.id));
      });
    });

    // Handle real-time alert broadcasts
    socketInstance.on('alert:new', (newAlert: Alert) => {
      setAlerts((prev) => [newAlert, ...prev].slice(0, 100)); // Cap local list to latest 100
    });

    // Handle alert state shifts (e.g. Acknowledge, Resolve)
    socketInstance.on('alert:update', (updated: Alert) => {
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Sync client subscription room based on selected line filter
  useEffect(() => {
    if (!socket) return;
    
    if (selectedLine === 'ALL') {
      socket.emit('join:line', { lineId: 'line_1' });
      socket.emit('join:line', { lineId: 'line_2' });
      socket.emit('join:line', { lineId: 'line_3' });
    } else {
      socket.emit('join:line', { lineId: selectedLine });
    }

    return () => {
      if (selectedLine === 'ALL') {
        socket.emit('leave:line', { lineId: 'line_1' });
        socket.emit('leave:line', { lineId: 'line_2' });
        socket.emit('leave:line', { lineId: 'line_3' });
      } else {
        socket.emit('leave:line', { lineId: selectedLine });
      }
    };
  }, [selectedLine, socket]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, { operatorId: 'OP_CONSOLE_01' });
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/alerts/${alertId}/resolve`, { operatorId: 'OP_CONSOLE_01' });
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const classifyDowntime = async (machineId: string, eventId: string, reason: string) => {
    try {
      await axios.post(`${API_BASE_URL}/machines/${machineId}/downtime`, { eventId, reason });
    } catch (err) {
      console.error('Failed to classify downtime:', err);
    }
  };

  return (
    <LiveDashboardContext.Provider
      value={{
        machines,
        alerts,
        isConnected,
        selectedLine,
        setSelectedLine,
        acknowledgeAlert,
        resolveAlert,
        classifyDowntime,
      }}
    >
      {children}
    </LiveDashboardContext.Provider>
  );
};

export const useLiveDashboard = () => {
  const context = useContext(LiveDashboardContext);
  if (!context) {
    throw new Error('useLiveDashboard must be used within a LiveDashboardProvider');
  }
  return context;
};
