import { useState, useEffect } from 'react';
import { 
  Tv, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Play, 
  Activity, 
  Monitor, 
  AlertCircle,
  Layout
} from 'lucide-react';
import { PlayerApp } from '../player/PlayerApp';
import { mockCampaigns } from '../data/mockCampaigns';
import { commandBus } from '../sync/CommandBus';
import { siteId } from '../sync/firebaseConfig';
import type { PlayerStatus, PlayerId } from '../sync/types';

export const Dashboard = () => {
  const [playerStates, setPlayerStates] = useState<Record<PlayerId, PlayerStatus | null>>({
    top: null,
    middle: null,
    bottom: null
  });

  const [error, setError] = useState<string | null>(null);
  const [transportStatus, setTransportStatus] = useState(commandBus.getTransportStatus());
  const [sentCommands, setSentCommands] = useState<any[]>([]);

  useEffect(() => {
    try {
      commandBus.onStatusUpdate((status) => {
        setPlayerStates(prev => ({
          ...prev,
          [status.playerId]: status
        }));
      });

      commandBus.onStatusChange((status) => {
        setTransportStatus(status);
      });
      
      commandBus.connect('dashboard').catch(err => {
        console.error("Error al conectar con CommandBus:", err);
        setError("Error de conexión: Verifica las credenciales de Firebase.");
      });
    } catch (err) {
      setError("Error crítico al inicializar el Dashboard.");
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] text-red-500 flex items-center justify-center p-10 text-center">
        <div className="glass-panel p-10 rounded-3xl border-red-500/20 max-w-xl neon-border">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h1 className="text-3xl font-black mb-4 tracking-tighter italic">SISTEMA BLOQUEADO</h1>
          <p className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 font-mono text-sm mb-8 leading-relaxed">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-all font-black tracking-widest uppercase text-sm shadow-xl shadow-red-600/20 active:scale-95"
          >
            REINTENTAR CONEXIÓN
          </button>
        </div>
      </div>
    );
  }

  const sendSyncCommand = (type: any, payload: any = null, target: any = 'all') => {
    const cmd = { type, payload, target, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    setSentCommands(prev => [cmd, ...prev].slice(0, 10));
    commandBus.sendCommand(cmd);
  };

  const isRealMode = commandBus.getMode() === 'real';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-red-500/30">
      {!isRealMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-[10px] py-1.5 text-center font-bold tracking-[0.3em] uppercase animate-pulse-soft">
          ⚠️ MODO SIMULACIÓN ACTIVO — SIN CONTROL REAL DE HARDWARE
        </div>
      )}
      
      {/* Header Premium */}
      <header className="h-20 border-b border-white/5 flex items-center px-10 justify-between bg-zinc-950/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-600/30 border border-white/10">
            <Layout className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none italic uppercase">INMOIA <span className="text-red-500">360</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <Activity className="w-3 h-3 text-red-600 animate-pulse" />
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Escaparate Control v2.1</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          {/* Selector de Modo */}
          <div className="flex bg-zinc-900/80 p-1 rounded-2xl border border-white/5 shadow-inner">
            <button 
              className={`px-5 py-2 text-[10px] rounded-xl font-black tracking-widest transition-all ${!isRealMode ? 'bg-zinc-800 text-white shadow-xl border border-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}
              onClick={() => commandBus.setMode('simulation')}
            >
              SIMULACIÓN
            </button>
            <button 
              className={`px-5 py-2 text-[10px] rounded-xl font-black tracking-widest transition-all ${isRealMode ? 'bg-green-600 text-white shadow-xl' : 'text-zinc-600 hover:text-zinc-400'}`}
              onClick={() => commandBus.setMode('real')}
            >
              REAL (C2)
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl border ${
              transportStatus === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {transportStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">{transportStatus}</span>
            </div>
            
            <button 
              onClick={() => sendSyncCommand('PAUSE')}
              className="px-6 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-2xl text-[11px] font-black tracking-widest transition-all active:scale-95 border border-red-500/20 flex items-center gap-2 uppercase"
            >
              PAUSA
            </button>

            <button 
              onClick={() => sendSyncCommand('RESUME')}
              className="px-6 py-2.5 bg-green-600/10 hover:bg-green-600/20 text-green-500 rounded-2xl text-[11px] font-black tracking-widest transition-all active:scale-95 border border-green-500/20 flex items-center gap-2 uppercase"
            >
              PLAY
            </button>

            <button 
              onClick={() => sendSyncCommand('RELOAD_CONTENT')}
              className="group px-6 py-2.5 bg-zinc-100 hover:bg-white text-black rounded-2xl text-[11px] font-black tracking-widest transition-all active:scale-95 shadow-xl flex items-center gap-2 uppercase"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
              RECARGAR
            </button>
          </div>
        </div>
      </header>

      <main className="p-10 grid grid-cols-12 gap-10 max-w-[1800px] mx-auto">
        {/* Panel Izquierdo: Control */}
        <div className="col-span-4 space-y-8">
          <section className="glass-panel rounded-3xl p-8 neon-border">
            <div className="flex items-center gap-3 mb-8">
              <Play className="w-5 h-5 text-red-500" />
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Gestión de Campañas</h2>
            </div>
            
            <div className="space-y-4">
              {mockCampaigns.map(campaign => (
                <div key={campaign.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 hover:border-red-500/30 transition-all duration-300">
                  <div>
                    <h3 className="font-bold text-white group-hover:text-red-500 transition-colors tracking-tight">{campaign.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-red-600 transition-colors"></div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        {campaign.playlist.length} elementos • Loop Infinito
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => sendSyncCommand('START_CAMPAIGN', { campaignId: campaign.id })}
                    className="p-3 bg-zinc-800 group-hover:bg-red-600 text-white rounded-xl transition-all shadow-lg active:scale-90"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-8 border-white/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-red-500" />
                <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Registro C2 (Enviados)</h2>
              </div>
              <div className="text-[9px] text-zinc-600 font-mono">SITE: {siteId}</div>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {sentCommands.map((cmd, idx) => (
                <div key={idx} className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[9px] flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-red-500 font-bold">{cmd.type}</span>
                    <span className="text-zinc-600">{new Date(cmd.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between opacity-60">
                    <span>Target: {cmd.target}</span>
                    <span>ID: {cmd.id?.slice(-6)}</span>
                  </div>
                </div>
              ))}
              {sentCommands.length === 0 && (
                <div className="text-center py-10 text-[10px] text-zinc-700 uppercase tracking-widest font-bold">Sin actividad reciente</div>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-8 border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <Tv className="w-5 h-5 text-red-500" />
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Estado del Hardware</h2>
            </div>
            <div className="space-y-4">
              <DeviceStatus label="TV-SUPERIOR" statusObj={playerStates.top} />
              <DeviceStatus label="TV-CENTRAL" statusObj={playerStates.middle} />
              <DeviceStatus label="TV-INFERIOR" statusObj={playerStates.bottom} />
            </div>
          </section>
        </div>

        {/* Panel Derecho: Escaparate Virtual */}
        <div className="col-span-8 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-8">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-zinc-400" />
              <div className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em]">Live Digital Showcase</div>
            </div>
            <div className="text-[10px] text-zinc-600 font-mono">ID: {siteId}</div>
          </div>
          
          {/* El Escaparate */}
          <div className="w-[640px] flex flex-col gap-3 bg-zinc-950 p-6 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="aspect-video w-full bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 relative group ring-1 ring-white/5">
              <div className="absolute top-3 left-3 z-50 bg-black/80 px-2.5 py-1 text-[9px] font-black rounded-lg border border-white/10 backdrop-blur-md uppercase tracking-widest">TOP</div>
              <PlayerApp screenOverride="top" />
            </div>
            
            <div className="aspect-video w-full bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 relative group ring-1 ring-white/5">
              <div className="absolute top-3 left-3 z-50 bg-black/80 px-2.5 py-1 text-[9px] font-black rounded-lg border border-white/10 backdrop-blur-md uppercase tracking-widest">MIDDLE</div>
              <PlayerApp screenOverride="middle" />
            </div>

            <div className="aspect-video w-full bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 relative group ring-1 ring-white/5">
              <div className="absolute top-3 left-3 z-50 bg-black/80 px-2.5 py-1 text-[9px] font-black rounded-lg border border-white/10 backdrop-blur-md uppercase tracking-widest">BOTTOM</div>
              <PlayerApp screenOverride="bottom" />
            </div>
          </div>

          {/* Telemetría de Sincronización */}
          <div className="mt-12 grid grid-cols-3 gap-6 w-full">
            <MetricCard label="FRECUENCIA REFRESCO" value="60.0" unit="FPS" />
            <MetricCard label="LATENCIA C2" value="2" unit="MS" color="text-green-500" />
            <MetricCard label="BUFFER SYNC" value="0.8" unit="S" />
          </div>
        </div>
      </main>
    </div>
  );
};

const MetricCard = ({ label, value, unit, color = "text-white" }: any) => (
  <div className="glass-panel p-6 rounded-3xl border-white/5 text-center group hover:border-red-500/20 transition-all">
    <div className="text-[9px] text-zinc-600 mb-2 font-black tracking-[0.2em] uppercase">{label}</div>
    <div className={`text-3xl font-black tracking-tighter ${color} group-hover:scale-110 transition-transform`}>
      {value}<span className="text-xs ml-1 opacity-40">{unit}</span>
    </div>
  </div>
);

const DeviceStatus = ({ label, statusObj }: { label: string, statusObj: PlayerStatus | null }) => {
  // Aumentamos a 15s para dar margen a desfases de reloj en producción
  const isOnline = statusObj && (Date.now() - statusObj.lastHeartbeat < 15000);
  
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-500 ${
      isOnline 
        ? 'bg-white/5 border-white/5' 
        : 'bg-red-500/5 border-red-500/10 grayscale opacity-60'
    }`}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-zinc-300 tracking-tight">{label}</span>
          <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
            Transporte: {statusObj?.transport || (isOnline ? 'C2' : 'N/A')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-600'}`}></div>
            <span className={`text-[10px] font-black tracking-widest ${isOnline ? 'text-green-400' : 'text-red-500'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
      {isOnline && statusObj && (
        <div className="mt-3 flex justify-between items-center pt-3 border-t border-white/5">
          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter truncate max-w-[120px]">
            ITEM: {statusObj.currentItemId || 'IDLE'}
          </div>
          <div className="text-[9px] text-zinc-600 font-mono">
            {Date.now() - statusObj.lastHeartbeat}ms
          </div>
        </div>
      )}
    </div>
  );
};
