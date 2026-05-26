import React from 'react';
import { useLiveDashboard } from '../context/LiveDashboardContext';
import { Play, AlertTriangle, PowerOff, ShieldAlert, Cpu, Heart } from 'lucide-react';

export const PlantSummary: React.FC = () => {
  const { machines, alerts, isConnected } = useLiveDashboard();

  const totalMachines = machines.length;
  const runningMachines = machines.filter(m => m.status === 'RUNNING').length;
  const downMachines = machines.filter(m => m.status === 'DOWN').length;
  const idleMachines = machines.filter(m => m.status === 'IDLE').length;
  const maintenanceMachines = machines.filter(m => m.status === 'MAINTENANCE').length;
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').length;

  // Simple real-time OEE estimation
  const plantOee = totalMachines > 0 
    ? Math.round(((runningMachines + idleMachines * 0.5) / totalMachines) * 100) 
    : 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      
      {/* OEE KPI Panel */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-industrial-textMuted text-xs uppercase tracking-wider font-semibold">Plant OEE</p>
          <h3 className="text-2xl font-bold mt-1 text-white">{plantOee}%</h3>
        </div>
        <div className="bg-industrial-blue/20 p-2.5 rounded-lg border border-industrial-blue/30 text-blue-400">
          <Cpu size={20} />
        </div>
      </div>

      {/* Total Active Warnings */}
      <div className={`glass-panel p-4 rounded-xl flex items-center justify-between transition-colors ${activeAlerts > 0 ? 'border-industrial-danger/40 bg-industrial-danger/5' : ''}`}>
        <div>
          <p className="text-industrial-textMuted text-xs uppercase tracking-wider font-semibold">Active Alerts</p>
          <h3 className={`text-2xl font-bold mt-1 ${activeAlerts > 0 ? 'text-industrial-danger animate-pulse' : 'text-white'}`}>{activeAlerts}</h3>
        </div>
        <div className={`p-2.5 rounded-lg border ${activeAlerts > 0 ? 'bg-industrial-danger/20 border-industrial-danger/30 text-industrial-danger animate-alert-pulse' : 'bg-industrial-border text-industrial-textMuted'}`}>
          <AlertTriangle size={20} />
        </div>
      </div>

      {/* Running Machines */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-industrial-textMuted text-xs uppercase tracking-wider font-semibold">Running</p>
          <h3 className="text-2xl font-bold mt-1 text-industrial-success">{runningMachines} <span className="text-xs text-industrial-textMuted font-normal">/ {totalMachines}</span></h3>
        </div>
        <div className="bg-industrial-success/20 p-2.5 rounded-lg border border-industrial-success/30 text-industrial-success">
          <Play size={20} fill="currentColor" />
        </div>
      </div>

      {/* Down Machines */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-industrial-textMuted text-xs uppercase tracking-wider font-semibold">Down</p>
          <h3 className="text-2xl font-bold mt-1 text-industrial-danger">{downMachines}</h3>
        </div>
        <div className="bg-industrial-danger/20 p-2.5 rounded-lg border border-industrial-danger/30 text-industrial-danger">
          <PowerOff size={20} />
        </div>
      </div>

      {/* Idle / Maintenance */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-industrial-textMuted text-xs uppercase tracking-wider font-semibold">Idle & Maint.</p>
          <h3 className="text-2xl font-bold mt-1 text-white">{idleMachines + maintenanceMachines}</h3>
        </div>
        <div className="bg-industrial-purple/20 p-2.5 rounded-lg border border-industrial-purple/30 text-industrial-purple">
          <ShieldAlert size={20} />
        </div>
      </div>

      {/* Gateway State */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-industrial-textMuted text-xs uppercase tracking-wider font-semibold">IIoT Gateway</p>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-full text-xs font-semibold ${isConnected ? 'bg-industrial-success/20 text-industrial-success border border-industrial-success/30' : 'bg-industrial-danger/20 text-industrial-danger border border-industrial-danger/30'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-industrial-success animate-ping' : 'bg-industrial-danger'}`}></span>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
        <div className={`p-2.5 rounded-lg border ${isConnected ? 'bg-industrial-success/20 border-industrial-success/30 text-industrial-success' : 'bg-industrial-danger/20 border-industrial-danger/30 text-industrial-danger'}`}>
          <Heart size={20} fill={isConnected ? 'currentColor' : 'none'} />
        </div>
      </div>

    </div>
  );
};
