import { useState, useEffect } from 'react';
import { commandBus } from '../sync/CommandBus';
import type { PlayerId } from '../sync/types';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { siteId } from '../sync/firebaseConfig';

export const HelloTest = () => {
  const [testMessage, setTestMessage] = useState("HOLA MUNDO DESDE VERCEL");
  const [testTarget, setTestTarget] = useState<PlayerId | 'all'>('top');
  const [transportStatus, setTransportStatus] = useState(commandBus.getTransportStatus());
  const [lastSent, setLastSent] = useState<any>(null);

  useEffect(() => {
    const unsub = commandBus.onStatusChange((status) => {
      setTransportStatus(status);
    });
    
    // Conectar como un emisor simple
    commandBus.connect('dashboard').catch(err => {
      console.error("Error al conectar con CommandBus en HelloTest:", err);
    });
    
    return () => {
      // Limpieza si es necesario, CommandBus no tiene disconnect expuesto típicamente pero está bien
    };
  }, []);

  const sendSyncCommand = (type: any, payload: any = null, target: any = 'all') => {
    const cmd = { type, payload, target, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    setLastSent(cmd);
    commandBus.sendCommand(cmd);
  };

  const isRealMode = commandBus.getMode() === 'real';

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 text-zinc-100 font-sans">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-8 border border-white/10 bg-gradient-to-br from-indigo-900/30 to-purple-900/10 shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-indigo-300 uppercase tracking-widest">C2 TEST DIRECTO</h1>
            <p className="text-xs text-indigo-400/60 font-mono mt-1">SITE: {siteId}</p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-indigo-400/70 mb-2 uppercase tracking-widest">
              Mensaje a mostrar en pantalla
            </label>
            <input 
              type="text" 
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              className="w-full bg-black/50 border border-indigo-500/40 rounded-xl px-5 py-4 text-base text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
              placeholder="Escribe un mensaje..."
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-indigo-400/70 mb-2 uppercase tracking-widest">
              Seleccionar Target
            </label>
            <select 
              value={testTarget}
              onChange={(e) => setTestTarget(e.target.value as any)}
              className="w-full bg-black/50 border border-indigo-500/40 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-400 appearance-none"
            >
              <option value="top">TV SUPERIOR (TOP)</option>
              <option value="middle">TV CENTRAL (MIDDLE)</option>
              <option value="bottom">TV INFERIOR (BOTTOM)</option>
              <option value="all">TODAS LAS PANTALLAS (ALL)</option>
            </select>
          </div>
          
          <button 
            onClick={() => sendSyncCommand('DISPLAY_MESSAGE', { text: testMessage }, testTarget)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-600/30 uppercase mt-2"
          >
            Enviar Comando C2
          </button>
        </div>

        {/* Estado y Logs */}
        <div className="mt-8 space-y-4">
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${isRealMode && transportStatus === 'connected' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isRealMode && transportStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isRealMode && transportStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                TRANSPORTE: {isRealMode ? 'FIREBASE REAL' : 'SIMULACIÓN LOCAL'}
              </p>
              <p className={`text-[10px] leading-relaxed font-mono ${isRealMode && transportStatus === 'connected' ? 'text-green-500/70' : 'text-red-500/70'}`}>
                {isRealMode && transportStatus === 'connected' 
                  ? 'Conectado exitosamente a Firebase. Los comandos llegarán a cualquier reproductor online en la misma red.' 
                  : 'Atención: Estás usando simulación local (sin variables de Vercel). Los comandos sólo se enviarán en pestañas de este mismo navegador.'}
              </p>
            </div>
          </div>

          {lastSent && (
            <div className="p-4 bg-black/60 rounded-xl border border-white/10">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Último Comando Enviado</p>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-indigo-400 font-bold">{lastSent.type}</span>
                <span className="text-zinc-400">{new Date(lastSent.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Target: {lastSent.target} | ID: {lastSent.id.slice(-6)}</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
