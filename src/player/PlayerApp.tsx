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
  
  const screen = useMemo(() => {
    if (screenOverride) return screenOverride;
    const params = new URLSearchParams(window.location.search);
    return (params.get('screen') as ScreenPosition) || 'middle';
  }, [screenOverride]);

  const [lastCommand, setLastCommand] = useState<{ id: string; status: PlayerStatus['lastCommandStatus'] } | null>(null);

  // Suscripción a comandos
  useEffect(() => {
    const handleCommand = (cmd: SyncCommand) => {
      if (cmd.target !== 'all' && cmd.target !== screen) return;

      console.log(`[Player ${screen}] Received Command: ${cmd.type}`);
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
          case 'START_CAMPAIGN':
            setLastCommand({ id: cmd.id, status: 'COMPLETED' });
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

  // Heartbeat periódico con Telemetría Real y Persistencia Offline
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

      // Guardar estado para recuperación offline
      localStorage.setItem(`last_status_${screen}`, JSON.stringify(status));
      
      commandBus.sendHeartbeat(status);
    }, 2000);
    return () => clearInterval(interval);
  }, [screen, currentContent, lastCommand]);

  useEffect(() => {
    if (isPaused) return;

    const update = () => {
      const content = orchestrator.getContentForScreen(screen);
      setCurrentContent(prev => {
        const next = JSON.stringify(prev) === JSON.stringify(content) ? prev : content;
        // Persistir el contenido actual para arranque rápido sin red
        if (next) localStorage.setItem(`fast_boot_content_${screen}`, JSON.stringify(next));
        return next;
      });
    };

    // Al arrancar, intentar cargar del cache si no hay red inmediata
    const cached = localStorage.getItem(`fast_boot_content_${screen}`);
    if (cached && !currentContent) {
      setCurrentContent(JSON.parse(cached));
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [screen, orchestrator, isPaused]);

  if (!currentContent) {
    return <div className="bg-black w-full h-full flex items-center justify-center text-white">Cargando contenido...</div>;
  }

  return (
    <div className="player-container w-full h-full bg-black overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentContent.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="w-full h-full"
        >
          {renderContent(currentContent)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const renderContent = (item: PlaylistItem) => {
  switch (item.type) {
    case 'image':
    case 'monumental':
      return (
        <div 
          className="w-full h-full bg-cover bg-center flex items-end p-20" 
          style={{ backgroundImage: `url(${item.content.url})` }}
        >
          {item.content.title && (
            <div className="bg-black/50 backdrop-blur-md p-10 text-white border-l-8 border-red-600">
              <h1 className="text-6xl font-bold uppercase">{item.content.title}</h1>
              {item.content.text && <p className="text-3xl mt-4">{item.content.text}</p>}
            </div>
          )}
        </div>
      );
    case 'mixed':
      return (
        <div className="grid grid-cols-2 h-full">
          <div 
            className="bg-cover bg-center" 
            style={{ backgroundImage: `url(${item.content.url})` }}
          />
          <div className="bg-zinc-900 flex flex-col justify-center p-20 text-white">
            <h2 className="text-5xl font-bold mb-10">{item.content.title}</h2>
            {item.content.qrData && (
              <div className="bg-white p-4 w-64 h-64 mx-auto">
                {/* Aquí iría un componente de QR real */}
                <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-black text-center text-sm">
                  [QR: {item.content.qrData}]
                </div>
              </div>
            )}
          </div>
        </div>
      );
    default:
      return <div className="text-white p-20">Tipo de contenido no soportado: {item.type}</div>;
  }
};
