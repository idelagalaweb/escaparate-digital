export type PlayerId = 'top' | 'middle' | 'bottom';

export type SyncCommandType =
  | 'START_CAMPAIGN'
  | 'STOP_CAMPAIGN'
  | 'PAUSE'
  | 'RESUME'
  | 'NEXT_ITEM'
  | 'SYNC_MONUMENTAL_MODE'
  | 'RELOAD_CONTENT'
  | 'HEALTH_CHECK';

export interface SyncCommand {
  id: string;
  type: SyncCommandType;
  payload?: any;
  timestamp: number;
  target?: PlayerId | 'all';
}

export interface PlayerStatus {
  playerId: PlayerId;
  online: boolean;
  currentCampaignId: string | null;
  currentItemId: string | null;
  lastHeartbeat: number;
  syncSessionId: string | null;
  errors: string[];
  // Nuevos campos para confirmación real (ACK)
  lastCommandId?: string;
  lastCommandStatus?: 'RECEIVED' | 'EXECUTING' | 'COMPLETED' | 'ERROR';
  transport: string;
}

export interface SyncSession {
  id: string;
  campaignId: string;
  mode: 'independent' | 'synchronized';
  players: PlayerId[];
  status: 'pending' | 'ready' | 'running' | 'failed' | 'completed';
  startedAt: number;
}
