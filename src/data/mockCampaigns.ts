import type { Campaign } from '../types';

export const mockCampaigns: Campaign[] = [
  {
    id: 'campaign-delagala-standard',
    name: 'Operación Estándar Delagala',
    status: 'active',
    mode: 'independent',
    priority: 1,
    schedule: {
      start: '2026-01-01T00:00:00Z',
      end: '2026-12-31T23:59:59Z',
      timeRange: { from: '00:00', to: '23:59' }
    },
    playlist: [
      {
        id: 'item-1-top',
        type: 'image',
        duration: 15,
        screens: ['top'],
        content: { 
          url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa', 
          title: 'VENTA PRO: CHALET EN POZUELO' 
        }
      },
      {
        id: 'item-2-middle',
        type: 'image',
        duration: 15,
        screens: ['middle'],
        content: { 
          url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750', 
          title: 'ALQUILER: ÁTICO EN MADRID' 
        }
      },
      {
        id: 'item-3-bottom',
        type: 'mixed',
        duration: 15,
        screens: ['bottom'],
        content: { 
          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab', 
          title: 'LOCAL COMERCIAL: GRAN VÍA',
          qrData: 'https://inmoia360.com/local-123'
        }
      }
    ]
  },
  {
    id: 'campaign-monumental-impact',
    name: 'Impacto Monumental Branding',
    status: 'active',
    mode: 'synchronized',
    priority: 10, // Prioridad alta para interrumpir
    schedule: {
      start: '2026-01-01T00:00:00Z',
      end: '2026-12-31T23:59:59Z'
    },
    playlist: [
      {
        id: 'monumental-1',
        type: 'monumental',
        duration: 10,
        screens: ['top', 'middle', 'bottom'],
        content: { 
          url: 'https://images.unsplash.com/photo-1497366216548-37526070297c', 
          text: 'TUS SUEÑOS, NUESTRA PASIÓN' 
        }
      }
    ]
  }
];
