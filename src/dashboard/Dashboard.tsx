import { useState, useEffect } from 'react';
import { PlayerApp } from '../player/PlayerApp';
import { mockCampaigns } from '../data/mockCampaigns';
import { commandBus } from '../sync/CommandBus';
import type { PlayerStatus, PlayerId } from '../sync/types';

export const Dashboard = () => {
  const [playerStates, setPlayerStates] = useState<Record<PlayerId, PlayerStatus | null>>({
    top: null,
    middle: null,
    bottom: null
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      commandBus.onStatusUpdate((status) => {
        setPlayerStates(prev => ({
          ...prev,
          [status.playerId]: status
        }));
      });
      
      // El dashboard se conecta como monitor global
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
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center p-10 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">⚠️ ERROR DE SISTEMA</h1>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-zinc-800 text-white rounded">Reintentar</button>
        </div>
      </div>
    );
  }

  const sendSyncCommand = (type: any, target: any = 'all') => {
    commandBus.sendCommand({ type, target });
  };

  const isSimulation = commandBus.getMode() === 'simulation';

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {isSimulation && (
        <div className="bg-amber-600/20 border-b border-amber-600/30 text-amber-400 text-[10px] py-1 text-center font-bold tracking-widest uppercase">
          ⚠️ MODO SIMULACIÓN LOCAL: No hay conexión real con hardware BrightSign
        </div>
      )}
      {/* Sidebar / Topbar */}
      <header className="h-16 border-b border-zinc-800 flex items-center px-8 justify-between bg-zinc-900/50 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-red-600 rounded-md"></div>
          <h1 className="text-xl font-bold tracking-tight">INMOIA <span className="text-zinc-500 font-normal">ESCAPARATE CTRL</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex bg-zinc-800 p-1 rounded-lg border border-zinc-700">
            <button 
              className={`px-3 py-1 text-[9px] rounded-md transition-all ${isSimulation ? 'bg-zinc-700 text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => window.location.reload()} // Por ahora recarga para resetear transporte
            >
              SIMULACIÓN
            </button>
            <button 
              className="px-3 py-1 text-[9px] rounded-md text-zinc-500 hover:text-zinc-300"
              onClick={() => alert('Configura las credenciales de Firebase en src/sync/transports/FirebaseTransport.ts')}
            >
              REAL (FIREBASE)
            </button>
          </div>
          <span className="px-3 py-1 bg-green-900/30 text-green-400 border border-green-800 rounded text-xs">
            {commandBus.getTransportStatus().toUpperCase()}
          </span>
          <button 
            onClick={() => sendSyncCommand('RELOAD_CONTENT')}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
          >
            RECARGAR TODO
          </button>
        </div>
      </header>

      <main className="p-8 grid grid-cols-12 gap-8">
        {/* Panel Izquierdo: Control y Listado */}
        <div className="col-span-4 space-y-6">
          <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-lg">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Campañas Activas</h2>
            <div className="space-y-3">
              {mockCampaigns.map(campaign => (
                <div key={campaign.id} className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 flex justify-between items-center group hover:border-red-600/50 transition-colors">
                  <div>
                    <h3 className="text-sm font-bold">{campaign.name}</h3>
                    <p className="text-[10px] text-zinc-500">{campaign.playlist.length} elementos • Loop infinito</p>
                  </div>
                  <button 
                    onClick={() => sendSyncCommand('START_CAMPAIGN', 'all')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition-transform active:scale-95"
                  >
                    LANZAR
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-lg">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => sendSyncCommand('PAUSE')}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-bold flex flex-col items-center gap-2"
              >
                <span className="text-lg">⏸</span>
                PAUSAR TODO
              </button>
              <button 
                onClick={() => sendSyncCommand('RESUME')}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-bold flex flex-col items-center gap-2"
              >
                <span className="text-lg">▶</span>
                REANUDAR TODO
              </button>
            </div>
          </section>

          <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Estado Dispositivos</h2>
            <div className="space-y-2">
              <DeviceStatus label="TV-SUPERIOR" statusObj={playerStates.top} />
              <DeviceStatus label="TV-CENTRAL" statusObj={playerStates.middle} />
              <DeviceStatus label="TV-INFERIOR" statusObj={playerStates.bottom} />
            </div>
          </section>

          <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Sync Debug (Live)</h2>
            <div className="font-mono text-[10px] space-y-1 text-zinc-500">
              <div className="flex justify-between"><span>UTC_REF:</span> <span className="text-white">{Date.now()}</span></div>
              <div className="flex justify-between"><span>OFFSET:</span> <span className="text-white">0ms</span></div>
              <div className="flex justify-between"><span>TZ:</span> <span className="text-white">Europe/Madrid</span></div>
            </div>
          </section>
        </div>

        {/* Panel Derecho: Simulador Escaparate */}
        <div className="col-span-8 flex flex-col items-center">
          <div className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 self-start">Vista Real del Escaparate</div>
          
          <div className="w-[600px] flex flex-col gap-2 bg-zinc-800 p-4 rounded-2xl shadow-2xl border border-zinc-700">
            {/* Pantalla Superior */}
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border-2 border-zinc-600 relative group">
              <div className="absolute top-2 left-2 z-50 bg-black/80 px-2 py-1 text-[10px] rounded border border-white/20">POS: TOP</div>
              <PlayerApp screenOverride="top" />
            </div>
            
            {/* Pantalla Central */}
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border-2 border-zinc-600 relative group">
              <div className="absolute top-2 left-2 z-50 bg-black/80 px-2 py-1 text-[10px] rounded border border-white/20">POS: MIDDLE</div>
              <PlayerApp screenOverride="middle" />
            </div>

            {/* Pantalla Inferior */}
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border-2 border-zinc-600 relative group">
              <div className="absolute top-2 left-2 z-50 bg-black/80 px-2 py-1 text-[10px] rounded border border-white/20">POS: BOTTOM</div>
              <PlayerApp screenOverride="bottom" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 w-full">
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
              <div className="text-[10px] text-zinc-500 mb-1">FPS PROMEDIO</div>
              <div className="text-2xl font-mono text-white">60.0</div>
            </div>
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
              <div className="text-[10px] text-zinc-500 mb-1">LATENCIA SYNC</div>
              <div className="text-2xl font-mono text-green-500">2ms</div>
            </div>
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
              <div className="text-[10px] text-zinc-500 mb-1">PRÓX. SINCRONIZACIÓN</div>
              <div className="text-2xl font-mono text-white">0.8s</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const DeviceStatus = ({ label, statusObj }: { label: string, statusObj: PlayerStatus | null }) => {
  const isOnline = statusObj && (Date.now() - statusObj.lastHeartbeat < 5000);
  
  return (
    <div className={`p-3 rounded border ${isOnline ? 'bg-zinc-800/50 border-zinc-700' : 'bg-red-950/10 border-red-900/30'}`}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-zinc-400">{label}</span>
          <span className="text-[7px] text-zinc-600 uppercase tracking-tighter">TRN: {statusObj?.transport || 'LOCAL'}</span>
        </div>
        <div className="flex items-center gap-2">
          {statusObj?.lastCommandId && isOnline && (
            <span className={`text-[8px] font-bold px-1 rounded ${
              statusObj.lastCommandStatus === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
              statusObj.lastCommandStatus === 'RECEIVED' ? 'bg-blue-500/10 text-blue-500' :
              'bg-red-500/10 text-red-500'
            }`}>
              {statusObj.lastCommandStatus}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-600'}`}></div>
            <span className={`text-[9px] ${isOnline ? 'text-green-400' : 'text-red-500'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
      {isOnline && statusObj && (
        <div className="grid grid-cols-2 gap-x-2 text-[8px] text-zinc-500 font-mono">
          <div className="truncate">ITEM: {statusObj.currentItemId || 'IDLE'}</div>
          <div className="text-right">LATENCY: {Date.now() - statusObj.lastHeartbeat}ms</div>
        </div>
      )}
    </div>
  );
};
