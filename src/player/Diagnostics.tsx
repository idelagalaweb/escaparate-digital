import { useState, useEffect, useMemo } from 'react';
import { TimeService } from '../core/utils/timeService';
import { Orchestrator } from '../core/orchestrator';
import { mockCampaigns } from '../data/mockCampaigns';
import type { ScreenPosition } from '../types';

export const Diagnostics = () => {
  const [now, setNow] = useState(Date.now());
  const orchestrator = useMemo(() => new Orchestrator(mockCampaigns), []);
  
  const params = new URLSearchParams(window.location.search);
  const screen = (params.get('screen') as ScreenPosition) || 'unknown';

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  const activeContent = orchestrator.getContentForScreen(screen as any, now);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-10 text-xs md:text-sm">
      <h1 className="text-2xl mb-8 border-b border-green-900 pb-2">BRIGHTSIGN_DIAGNOSTICS_v1.0</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-4">
          <h2 className="text-white bg-green-900 px-2 py-1">HARDWARE_INFO</h2>
          <DataRow label="SCREEN_ID" value={screen.toUpperCase()} />
          <DataRow label="SYSTEM_TIME" value={new Date(now).toString()} />
          <DataRow label="UTC_TIMESTAMP" value={now.toString()} />
          <DataRow label="TIMEZONE_DETECTED" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />
          <DataRow label="NORMALIZED_MADRID" value={TimeService.getFormattedTime()} />
          <DataRow label="SYSTEM_OFFSET_MS" value={TimeService.getSystemOffset().toString()} />
          <DataRow label="USER_AGENT" value={navigator.userAgent} />
        </section>

        <section className="space-y-4">
          <h2 className="text-white bg-green-900 px-2 py-1">ORCHESTRATOR_STATE</h2>
          <DataRow label="ACTIVE_CAMPAIGN" value={activeContent ? 'OPERACIÓN_ESTÁNDAR' : 'NONE'} />
          <DataRow label="ACTIVE_ITEM" value={activeContent?.id || 'IDLE'} />
          <DataRow label="ITEM_TYPE" value={activeContent?.type || 'N/A'} />
          <DataRow label="ITEM_DURATION" value={activeContent ? `${activeContent.duration}s` : 'N/A'} />
          <DataRow label="SYNC_MODE" value="DETERMINISTIC_UTC" />
          <DataRow label="NETWORK_STATUS" value={navigator.onLine ? 'ONLINE' : 'OFFLINE'} className={navigator.onLine ? 'text-green-400' : 'text-red-500'} />
        </section>
      </div>

      <div className="mt-10 p-4 border border-green-900 bg-green-950/20">
        <div className="flex justify-between mb-2">
          <span>PROGRESS_SYNC_BAR</span>
          <span>{Math.floor((now % 15000) / 150)}%</span>
        </div>
        <div className="w-full h-2 bg-green-900/30">
          <div 
            className="h-full bg-green-500 transition-all duration-500" 
            style={{ width: `${(now % 15000) / 150}%` }}
          ></div>
        </div>
      </div>

      <footer className="mt-10 text-[10px] text-green-800">
        BUILD_ID: 2026.05.05.001 | INMOIA_TECH_CORE
      </footer>
    </div>
  );
};

const DataRow = ({ label, value, className = "" }: any) => (
  <div className="flex justify-between border-b border-green-900/30 py-1">
    <span className="text-green-800">{label}:</span>
    <span className={`text-right font-bold ${className}`}>{value}</span>
  </div>
);
