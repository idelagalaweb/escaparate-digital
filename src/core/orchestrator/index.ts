import type { Campaign, PlaylistItem, ScreenPosition } from '../../types';
import { TimeService } from '../utils/timeService';

export class Orchestrator {
  private campaigns: Campaign[];

  constructor(campaigns: Campaign[]) {
    this.campaigns = campaigns.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calcula qué contenido debe mostrarse en una posición específica en un momento dado.
   */
  getContentForScreen(screen: ScreenPosition, timestamp: number = TimeService.getNormalizedTimestamp()): PlaylistItem | null {
    // 1. Filtrar campañas activas para el momento actual
    const activeCampaigns = this.campaigns.filter(c => this.isCampaignActive(c, timestamp));

    if (activeCampaigns.length === 0) return null;

    // 2. Buscar en la campaña de mayor prioridad que tenga contenido para esta pantalla
    for (const campaign of activeCampaigns) {
      const screenItems = campaign.playlist.filter(item => item.screens.includes(screen));
      if (screenItems.length === 0) continue;

      // 3. Lógica de rotación basada en el tiempo total transcurrido
      // Esto asegura que todos los BrightSign vean lo mismo en el mismo segundo
      const totalDuration = screenItems.reduce((acc, item) => acc + item.duration, 0);
      const secondsSinceEpoch = Math.floor(timestamp / 1000);
      let cycleSecond = secondsSinceEpoch % totalDuration;

      for (const item of screenItems) {
        if (cycleSecond < item.duration) {
          return item;
        }
        cycleSecond -= item.duration;
      }
    }

    return null;
  }

  private isCampaignActive(campaign: Campaign, timestamp: number): boolean {
    if (campaign.status !== 'active') return false;

    const date = new Date(timestamp);
    const isoDate = date.toISOString();

    // Validar rango de fechas
    if (isoDate < campaign.schedule.start || isoDate > campaign.schedule.end) return false;

    // Validar rango horario (si existe)
    if (campaign.schedule.timeRange) {
      const currentTime = date.getUTCHours().toString().padStart(2, '0') + ':' + 
                          date.getUTCMinutes().toString().padStart(2, '0');
      if (currentTime < campaign.schedule.timeRange.from || currentTime > campaign.schedule.timeRange.to) {
        return false;
      }
    }

    return true;
  }
}
