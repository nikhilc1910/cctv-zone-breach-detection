import React, { useState } from 'react';
import { useLiveDashboard, Alert } from '../context/LiveDashboardContext';
import { AlertCircle, CheckCircle, ShieldAlert, Eye, X } from 'lucide-react';

export const SidebarAlerts: React.FC = () => {
  const { alerts, acknowledgeAlert, resolveAlert } = useLiveDashboard();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE'>('ACTIVE');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const displayedAlerts = filter === 'ACTIVE' 
    ? alerts.filter(a => a.status !== 'RESOLVED')
    : alerts;

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'CRITICAL': return 'text-industrial-danger border-industrial-danger/40 bg-industrial-danger/10';
      case 'HIGH': return 'text-industrial-warning border-industrial-warning/40 bg-industrial-warning/10';
      case 'MEDIUM': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      default: return 'text-slate-300 border-slate-700 bg-slate-800/50';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col h-[calc(100vh-230px)] max-h-[800px] overflow-hidden">
      
      {/* Title & Filter Tabs */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-industrial-border/60">
        <h2 className="text-sm font-semibold tracking-wider text-white uppercase flex items-center gap-2">
          <ShieldAlert className="text-industrial-danger animate-pulse" size={18} />
          Alert Center
        </h2>
        <div className="flex gap-1 bg-industrial-bg p-0.5 rounded-lg border border-industrial-border">
          <button 
            onClick={() => setFilter('ACTIVE')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${filter === 'ACTIVE' ? 'bg-industrial-blue text-white' : 'text-industrial-textMuted hover:text-white'}`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${filter === 'ALL' ? 'bg-industrial-blue text-white' : 'text-industrial-textMuted hover:text-white'}`}
          >
            All Logs
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {displayedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <CheckCircle className="text-industrial-success mb-2" size={32} />
            <p className="text-xs text-industrial-textMuted font-semibold">Plant operations normal.</p>
            <p className="text-[10px] text-industrial-textMuted/70 mt-1">No active issues detected.</p>
          </div>
        ) : (
          displayedAlerts.map(alert => (
            <div 
              key={alert.id} 
              className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${getSeverityColor(alert.severity)}`}
            >
              {/* Alert Meta Header */}
              <div className="flex items-start justify-between gap-1">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/30 border border-white/5 mr-1.5">
                    {alert.alertType}
                  </span>
                  <span className="text-[10px] text-industrial-textMuted font-semibold">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border border-white/10">
                  {alert.status}
                </span>
              </div>

              {/* Message */}
              <p className="text-xs leading-relaxed text-white font-medium">{alert.message}</p>

              {/* Camera Event Context Link */}
              {alert.cameraEvent && (
                <div className="bg-black/20 p-2 rounded border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={alert.cameraEvent.imageUrl} 
                      alt="CCTV Alert Frame" 
                      className="w-10 h-7 rounded object-cover cursor-pointer border border-white/10 hover:border-industrial-blue"
                      onClick={() => setLightboxImage(alert.cameraEvent!.imageUrl)}
                    />
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase">{alert.cameraId}</p>
                      <p className="text-[9px] text-industrial-textMuted">Confidence: {Math.round(alert.cameraEvent.confidence * 100)}%</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setLightboxImage(alert.cameraEvent!.imageUrl)}
                    className="p-1 text-industrial-textMuted hover:text-white rounded hover:bg-white/5 transition-colors"
                  >
                    <Eye size={12} />
                  </button>
                </div>
              )}

              {/* Operational Action Buttons */}
              {alert.status === 'ACTIVE' && (
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="flex-1 py-1 text-[10px] font-bold uppercase rounded border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all text-center"
                  >
                    Acknowledge
                  </button>
                </div>
              )}

              {alert.status === 'ACKNOWLEDGED' && (
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => resolveAlert(alert.id)}
                    className="flex-1 py-1 text-[10px] font-bold uppercase rounded border-white/15 bg-white/10 text-white hover:bg-white/15 hover:border-white/20 transition-all text-center"
                  >
                    Resolve Alert
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Lightbox Modal overlay for CCTV Image Preview */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-3xl w-full bg-industrial-card border border-industrial-border rounded-xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
            >
              <X size={18} />
            </button>
            <div className="p-1">
              <img src={lightboxImage} alt="CCTV Lightbox" className="w-full h-auto object-contain rounded-lg" />
            </div>
            <div className="p-4 bg-industrial-card flex items-center justify-between border-t border-industrial-border/60">
              <span className="text-xs text-industrial-textMuted font-bold">CCTV SAFETY CAPTURE STREAM</span>
              <button 
                onClick={() => setLightboxImage(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-industrial-border text-white rounded-lg hover:bg-industrial-border/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
