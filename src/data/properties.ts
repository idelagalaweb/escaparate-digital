export interface Property {
  id: number;
  address: string;
  price: number;
  category: "VENTA" | "ALQUILER";
  type: "PISO" | "CHALET" | "LOCAL" | "OFICINA" | "GARAJE" | "NAVE" | "BRAND";
  thumb: string;
  visible: boolean;
  priority?: number;
  rooms?: number;
  baths?: number;
  sqm?: number;
  extras?: string[];
}

export const delagalaData: Property[] = [
  // ANUNCIO DE MARCA (NUEVO)
  {
    id: 999,
    address: "GETXO & BILBAO",
    price: 0,
    category: "VENTA",
    type: "BRAND",
    thumb: "/monumental.png",
    visible: true,
    priority: 10
  },
  // RESIDENCIAL VENTA
  {
    id: 101879097,
    address: "Casa independiente en Sta. María de Getxo",
    price: 1000000,
    category: "VENTA",
    type: "CHALET",
    rooms: 5, baths: 4, sqm: 450,
    thumb: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    visible: true
  },
  {
    id: 104690375,
    address: "Chalet de lujo en Barrika",
    price: 975000,
    category: "VENTA",
    type: "CHALET",
    rooms: 4, baths: 3, sqm: 320,
    thumb: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    visible: true
  },
  {
    id: 107392379,
    address: "Piso Exclusivo en Sta. María de Getxo",
    price: 850000,
    category: "VENTA",
    type: "PISO",
    rooms: 3, baths: 2, sqm: 145,
    thumb: "https://images.unsplash.com/photo-1600607687940-c52af0369996?auto=format&fit=crop&w=1200&q=80",
    visible: true
  },
  {
    id: 109179718,
    address: "Piso Señorial Ensanche-Moyua, Bilbao",
    price: 830000,
    category: "VENTA",
    type: "PISO",
    rooms: 4, baths: 3, sqm: 190,
    thumb: "https://images.unsplash.com/photo-1600566752355-3979ff1040ad?auto=format&fit=crop&w=1200&q=80",
    visible: true
  },
  
  // RESIDENCIAL ALQUILER
  {
    id: 2001,
    address: "Piso Moderno en Las Arenas, Getxo",
    price: 1800,
    category: "ALQUILER",
    type: "PISO",
    rooms: 3, baths: 2, sqm: 110,
    thumb: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    visible: true
  },

  // TERCIARIOS
  {
    id: 3001,
    address: "Local Comercial Centro, Las Arenas",
    price: 2500,
    category: "ALQUILER",
    type: "LOCAL",
    sqm: 155,
    thumb: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    visible: true
  },
  {
    id: 3002,
    address: "Nave Industrial Polígono Erandio",
    price: 420000,
    category: "VENTA",
    type: "NAVE",
    sqm: 600,
    thumb: "https://images.unsplash.com/photo-1580983546522-bb174092b7ce?auto=format&fit=crop&w=1200&q=80",
    visible: true
  }
];

export function getWeightedRandomProperty(properties: Property[]): Property {
  const candidates = properties.filter(p => p.visible);
  if (candidates.length === 0) return properties[0];
  return candidates[Math.floor(Math.random() * candidates.length)];
}
