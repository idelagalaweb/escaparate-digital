import { useEffect, useState } from 'react';
import { commandBus } from '../sync/CommandBus';

export const CompatibilityPage = () => {
  const [tests, setTests] = useState<any>({
    js_modern: { status: 'testing', label: 'JavaScript Moderno (ES6+)' },
    fetch: { status: 'testing', label: 'Soporte Fetch API' },
    firebase_conn: { status: 'testing', label: 'Conexión C2 (Transport)' },
    video: { status: 'testing', label: 'Aceleración Hardware Vídeo' },
    fullscreen: { status: 'testing', label: 'API Fullscreen' },
    local_storage: { status: 'testing', label: 'Persistencia Local (Offline Fallback)' },
  });

  useEffect(() => {
    // 1. JS Moderno
    try {
      const obj = { a: 1 };
      const spread = { ...obj, b: 2 };
      updateTest('js_modern', spread.b === 2 ? 'passed' : 'failed');
    } catch { updateTest('js_modern', 'failed'); }

    // 2. Fetch
    updateTest('fetch', typeof window.fetch === 'function' ? 'passed' : 'failed');

    // 3. Firebase / Transport
    const connStatus = commandBus.getTransportStatus();
    updateTest('firebase_conn', connStatus !== 'disconnected' ? 'passed' : 'failed');

    // 4. LocalStorage
    try {
      localStorage.setItem('test', '1');
      updateTest('local_storage', 'passed');
    } catch { updateTest('local_storage', 'failed'); }

    // 5. Fullscreen
    updateTest('fullscreen', !!document.documentElement.requestFullscreen ? 'passed' : 'failed');

    // 6. Video (simple check)
    const video = document.createElement('video');
    updateTest('video', video.canPlayType('video/mp4') ? 'passed' : 'failed');

  }, []);

  const updateTest = (id: string, status: 'passed' | 'failed') => {
    setTests((prev: any) => ({ ...prev, [id]: { ...prev[id], status } }));
  };

  return (
    <div className="min-h-screen bg-black text-white p-10 font-mono">
      <h1 className="text-2xl font-bold mb-8 text-red-600 border-b border-red-900 pb-4">
        BRIGHTSIGN COMPATIBILITY DIAGNOSTICS
      </h1>
      
      <div className="grid gap-4 max-w-2xl">
        {Object.entries(tests).map(([id, test]: any) => (
          <div key={id} className="flex justify-between items-center p-4 bg-zinc-900 rounded border border-zinc-800">
            <span>{test.label}</span>
            <span className={`font-bold ${
              test.status === 'passed' ? 'text-green-500' : 
              test.status === 'failed' ? 'text-red-500' : 'text-zinc-600'
            }`}>
              {test.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-blue-900/20 border border-blue-800 rounded text-blue-400 text-sm">
        <h3 className="font-bold mb-2 uppercase">Información del Navegador:</h3>
        <p>User Agent: {navigator.userAgent}</p>
        <p>Screen: {window.screen.width}x{window.screen.height} (@{window.devicePixelRatio}x)</p>
        <p>Transporte Activo: {commandBus.getMode().toUpperCase()}</p>
      </div>

      <button 
        onClick={() => window.location.href = '/'}
        className="mt-8 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs transition-colors"
      >
        VOLVER AL PLAYER
      </button>
    </div>
  );
};
