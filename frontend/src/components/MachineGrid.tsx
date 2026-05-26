import React, { useState } from 'react';
import { useLiveDashboard, MachineState } from '../context/LiveDashboardContext';
import { Power, Flame, Activity, Zap, Play, HelpCircle } from 'lucide-react';
import { HistoryModal } from './HistoryModal';

export const MachineGrid: React.FC = () => {
  const { machines, selectedLine, setSelectedLine } = useLiveDashboard();
  const [activeHistoryMachine, setActiveHistoryMachine] = useState<MachineState | null>(null);

  // Group machines by Line ID
  const lines = ['line_1', 'line_2', 'line_3'];

  const lineNames: Record<string, string> = {
    line_1: 'Production Line A - Robotic Welding',
    line_2: 'Production Line B - Stamping Press',
    line_3: 'Production Line C - Assembly & Packing'
  };

  const getStatusColor = (status: MachineState['status']) => {
    switch (status) {
      case 'RUNNING': return 'border-industrial-success/40 bg-industrial-success/5 text-industrial-success';
      case 'DOWN': return 'border-industrial-danger/40 bg-industrial-danger/5 text-industrial-danger animate-alert-pulse';
      case 'IDLE': return 'border-industrial-warning/40 bg-industrial-warning/5 text-industrial-warning';
      case 'MAINTENANCE': return 'border-industrial-purple/40 bg-industrial-purple/5 text-industrial-purple';
      default: return 'border-industrial-border bg-slate-800/10 text-industrial-textMuted';
    }
  };

  const getStatusIndicator = (status: MachineState['status']) => {
    switch (status) {
      case 'RUNNING': return 'bg-industrial-success shadow-lg shadow-emerald-500/50';
      case 'DOWN': return 'bg-industrial-danger shadow-lg shadow-red-500/50 animate-ping';
      case 'IDLE': return 'bg-industrial-warning shadow-lg shadow-amber-500/50';
      case 'MAINTENANCE': return 'bg-industrial-purple shadow-lg shadow-purple-500/50';
      default: return 'bg-industrial-textMuted';
    }
  };

  // Filter lines if line selection filter is active
  const filteredLines = selectedLine === 'ALL' ? lines : [selectedLine];

  return (
    <div className="space-y-6">
      
      {/* Line Filter Selection */}
      <div className="flex gap-2 pb-2 overflow-x-auto">
        <button 
          onClick={() => setSelectedLine('ALL')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all ${selectedLine === 'ALL' ? 'bg-industrial-blue border-industrial-blue text-white shadow-lg shadow-blue-500/30' : 'bg-industrial-card border-industrial-border text-industrial-textMuted hover:text-white'}`}
        >
          All Production Floors
        </button>
        {lines.map(l => (
          <button 
            key={l}
            onClick={() => setSelectedLine(l)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all ${selectedLine === l ? 'bg-industrial-blue border-industrial-blue text-white shadow-lg shadow-blue-500/30' : 'bg-industrial-card border-industrial-border text-industrial-textMuted hover:text-white'}`}
          >
            {l === 'line_1' ? 'Welding Bay' : l === 'line_2' ? 'Stamping Press' : 'Assembly Floor'}
          </button>
        ))}
      </div>

      {/* Grid rendering per floor line */}
      {filteredLines.map(lineId => {
        const lineMachines = machines.filter(m => m.lineId === lineId);
        
        return (
          <div key={lineId} className="glass-panel p-5 rounded-xl border border-industrial-border/60">
            
            {/* Floor line header */}
            <div className="flex items-center justify-between mb-4 border-b border-industrial-border/40 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {lineNames[lineId] || lineId}
              </h3>
              <span className="text-[10px] text-industrial-textMuted font-semibold">
                Active Nodes: {lineMachines.length}
              </span>
            </div>

            {/* Grid list of machines */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lineMachines.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-industrial-textMuted font-semibold flex items-center justify-center gap-1.5">
                  <HelpCircle size={14} />
                  No active machines found on this floor.
                </div>
              ) : (
                lineMachines.map(m => (
                  <div 
                    key={m.id}
                    onClick={() => setActiveHistoryMachine(m)}
                    className={`glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer border flex flex-col gap-4 ${getStatusColor(m.status)}`}
                  >
                    {/* Header: Machine ID and Status Indicator */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{m.name}</h4>
                        <p className="text-[10px] text-industrial-textMuted font-bold uppercase tracking-wide">{m.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 bg-black/20 rounded">
                          {m.status}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${getStatusIndicator(m.status)}`}></span>
                      </div>
                    </div>

                    {/* Sensor Readings Block */}
                    <div className="grid grid-cols-3 gap-2 border-t border-industrial-border/40 pt-3 bg-black/10 p-2 rounded-lg">
                      {/* Temperature */}
                      <div className="flex flex-col items-center">
                        <span className="text-industrial-textMuted text-[9px] font-bold uppercase flex items-center gap-0.5 mb-1">
                          <Flame size={10} className="text-red-400" />
                          Temp
                        </span>
                        <span className="text-xs font-bold text-white">
                          {m.lastTemperature !== null ? `${m.lastTemperature.toFixed(1)}°C` : 'N/A'}
                        </span>
                      </div>

                      {/* Vibration */}
                      <div className="flex flex-col items-center border-x border-industrial-border/40">
                        <span className="text-industrial-textMuted text-[9px] font-bold uppercase flex items-center gap-0.5 mb-1">
                          <Activity size={10} className="text-amber-400" />
                          Vib
                        </span>
                        <span className="text-xs font-bold text-white">
                          {m.lastVibration !== null ? `${m.lastVibration.toFixed(2)} mm/s` : 'N/A'}
                        </span>
                      </div>

                      {/* Power */}
                      <div className="flex flex-col items-center">
                        <span className="text-industrial-textMuted text-[9px] font-bold uppercase flex items-center gap-0.5 mb-1">
                          <Zap size={10} className="text-blue-400" />
                          Power
                        </span>
                        <span className="text-xs font-bold text-white">
                          {m.lastPower !== null ? `${m.lastPower.toFixed(1)} kW` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Heartbeat Status Footer */}
                    <div className="flex items-center justify-between text-[9px] text-industrial-textMuted/80 font-semibold border-t border-industrial-border/30 pt-2">
                      <span>Telemetry: 1Hz Ingress</span>
                      <span>Updated: {new Date(m.lastUpdated).toLocaleTimeString()}</span>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        );
      })}

      {/* Telemetry Detail Audit History Modal */}
      {activeHistoryMachine && (
        <HistoryModal 
          machineId={activeHistoryMachine.id}
          machineName={activeHistoryMachine.name}
          onClose={() => setActiveHistoryMachine(null)}
        />
      )}

    </div>
  );
};
