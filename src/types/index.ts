export type ScreenPosition = 'top' | 'middle' | 'bottom';
export type ContentType = 'image' | 'video' | 'text' | 'rss' | 'qr' | 'mixed' | 'monumental';
export type CampaignMode = 'independent' | 'synchronized';
export type CampaignStatus = 'active' | 'paused' | 'draft' | 'archived';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  mode: CampaignMode;
  priority: number;
  schedule: {
    start: string; // ISO Date
    end: string;   // ISO Date
    timeRange?: { from: string; to: string }; // ej. "09:00" - "21:00"
  };
  playlist: PlaylistItem[];
}

export interface PlaylistItem {
  id: string;
  type: ContentType;
  duration: number; // Segundos
  screens: ScreenPosition[]; // Pantallas donde se emite este item
  content: {
    url?: string;
    text?: string;
    title?: string;
    qrData?: string;
    metadata?: Record<string, any>;
  };
}

export interface SyncState {
  serverTime: number;
  activeCampaignId: string | null;
  lastUpdate: number;
}
