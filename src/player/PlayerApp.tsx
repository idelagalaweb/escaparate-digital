import { useState, useEffect, useMemo } from 'react';
import { Orchestrator } from '../core/orchestrator';
import { mockCampaigns } from '../data/mockCampaigns';
import type { ScreenPosition, PlaylistItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { commandBus } from '../sync/CommandBus';
import type { PlayerStatus, SyncCommand } from '../sync/types';

export const PlayerApp = ({ screenOverride }: { screenOverride?: ScreenPosition }) => {
  const [currentContent, setCurrentContent] = useState<PlaylistItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const orchestrator = useMemo(() => new Orchestrator(mockCampaigns), []);
  
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const isDebug = useMemo(() => params.has('debug'), [params]);

  const screen = useMemo(() => {
    if (screenOverride) return screenOverride;
    return (params.get('screen') as ScreenPosition) || 'middle';
  }, [screenOverride, params]);

  const [lastCommand, setLastCommand] = useState<{ id: string; status: PlayerStatus['lastCommandStatus'] } | null>(null);
  const [lastReceived, setLastReceived] = useState<any>(null);
  const [lastIgnored, setLastIgnored] = useState<any>(null);

  // Suscripción a comandos
  useEffect(() => {
    console.log(`[Player ${screen}] 🛰️ Sistema de escucha activo`);
    const handleCommand = (cmd: SyncCommand) => {
      // Diagnóstico básico
      const isTarget = cmd.target === 'all' || cmd.target === screen;
      const isNew = !cmd.timestamp || cmd.timestamp > (Date.now() - 30000); // 30s margen

      if (!isTarget) {
        setLastIgnored({ type: cmd.type, reason: `TARGET_MISMATCH (${cmd.target})`, time: Date.now() });
        return;
      }

      setLastReceived({ ...cmd, time: Date.now() });
      console.log(`[Player ${screen}] 📥 Comando aceptado: ${cmd.type}`);
      setLastCommand({ id: cmd.id, status: 'RECEIVED' });

      try {
        switch (cmd.type) {
          case 'PAUSE': 
            setIsPaused(true); 
            setLastCommand({ id: cmd.id, status: 'COMPLETED' });
            break;
          case 'RESUME': 
            setIsPaused(false); 
            setLastCommand({ id: cmd.id, status: 'COMPLETED' });
            break;
          case 'RELOAD_CONTENT': 
            window.location.reload(); 
            break;
          default:
            setLastCommand({ id: cmd.id, status: 'COMPLETED' });
        }
      } catch (err) {
        setLastCommand({ id: cmd.id, status: 'ERROR' });
      }
    };

    commandBus.onCommand(handleCommand);
  }, [screen]);

  // Heartbeat periódico
  useEffect(() => {
    const interval = setInterval(() => {
      const status: PlayerStatus = {
        playerId: screen,
        online: true,
        currentCampaignId: 'delagala-standard',
        currentItemId: currentContent?.id || null,
        lastHeartbeat: Date.now(),
        syncSessionId: null,
        errors: [],
        lastCommandId: lastCommand?.id,
        lastCommandStatus: lastCommand?.status,
        transport: commandBus.getMode()
      };
      
      commandBus.sendHeartbeat(status);
    }, 2000);
    return () => clearInterval(interval);
  }, [screen, currentContent, lastCommand]);

  useEffect(() => {
    if (isPaused) return;

    const update = () => {
      const content = orchestrator.getContentForScreen(screen);
      setCurrentContent(prev => {
        return JSON.stringify(prev) === JSON.stringify(content) ? prev : content;
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [screen, orchestrator, isPaused]);

  if (!currentContent) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4"></div>
        <div className="text-xs font-black text-zinc-500 uppercase tracking-widest">Sincronizando...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black overflow-hidden relative cursor-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentContent.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="w-full h-full absolute inset-0"
        >
          {renderContent(currentContent)}
        </motion.div>
      </AnimatePresence>

      {/* Overlay de Debug Extendido */}
      {isDebug && (
        <div className="absolute top-0 left-0 p-6 bg-black/90 text-green-500 font-mono text-[10px] z-[100] border-b border-r border-green-500/20 backdrop-blur-md max-w-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
            <span className="opacity-50 font-bold uppercase tracking-widest">SISTEMA</span> <span className="text-white">ONLINE</span>
            <span className="opacity-50">SCREEN:</span> <span>{screen.toUpperCase()}</span>
            <span className="opacity-50">TRANSPORT:</span> <span>{commandBus.getMode().toUpperCase()}</span>
            <span className="opacity-50">PAUSED:</span> <span className={isPaused ? "text-red-500 font-bold" : ""}>{isPaused ? 'YES' : 'NO'}</span>
          </div>
          
          <div className="border-t border-green-500/20 pt-4 space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-green-500/50 uppercase">Último Recibido:</span>
              {lastReceived ? (
                <div className="bg-green-500/10 p-2 rounded border border-green-500/20">
                  <div className="flex justify-between">
                    <span className="text-white font-bold">{lastReceived.type}</span>
                    <span>{new Date(lastReceived.time).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[8px] opacity-70">ID: {lastReceived.id?.slice(-6)} | T: {lastReceived.target}</div>
                </div>
              ) : <span className="opacity-30 italic">Esperando...</span>}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-red-500/50 uppercase">Último Ignorado:</span>
              {lastIgnored ? (
                <div className="bg-red-500/10 p-2 rounded border border-red-500/20 text-red-400">
                  <div className="flex justify-between">
                    <span className="font-bold">{lastIgnored.type}</span>
                    <span>{new Date(lastIgnored.time).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[8px] opacity-70">Motivo: {lastIgnored.reason}</div>
                </div>
              ) : <span className="opacity-30 italic">Ninguno</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const renderContent = (item: PlaylistItem) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-zinc-950">
      <div 
        className="w-full h-full bg-cover bg-center transition-transform duration-[10s] scale-110" 
        style={{ backgroundImage: `url(${item.content.url})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-20">
        {item.content.title && (
          <div className="max-w-4xl">
            <div className="w-20 h-1.5 bg-red-600 mb-6" />
            <h1 className="text-8xl font-black uppercase tracking-tighter text-white leading-none">
              {item.content.title}
            </h1>
            {item.content.text && (
              <p className="text-4xl mt-6 text-zinc-300 font-light max-w-2xl">
                {item.content.text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
