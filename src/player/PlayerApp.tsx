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

  // Suscripción a comandos
  useEffect(() => {
    console.log(`[Player ${screen}] 🛰️ Sistema de escucha activo`);
    const handleCommand = (cmd: SyncCommand) => {
      if (cmd.target !== 'all' && cmd.target !== screen) return;

      console.log(`[Player ${screen}] 📥 Comando recibido: ${cmd.type}`);
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

      {/* Overlay de Debug */}
      {isDebug && (
        <div className="absolute top-0 left-0 p-6 bg-black/80 text-green-500 font-mono text-[10px] z-[100] border-b border-r border-green-500/20 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="opacity-50">SCREEN_ID:</span> <span>{screen.toUpperCase()}</span>
            <span className="opacity-50">CONTENT_ID:</span> <span>{currentContent.id}</span>
            <span className="opacity-50">PAUSED:</span> <span>{isPaused ? 'YES' : 'NO'}</span>
            <span className="opacity-50">TRANSPORT:</span> <span>{commandBus.getMode()}</span>
            <span className="opacity-50">SITE_ID:</span> <span>{import.meta.env.VITE_SITE_ID || 'DEFAULT'}</span>
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
