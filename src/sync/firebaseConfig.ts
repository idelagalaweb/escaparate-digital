console.log('[Config] Transport Mode:', import.meta.env.VITE_C2_TRANSPORT);

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const siteId = import.meta.env.VITE_SITE_ID || 'delagala-escaparate-01';
export const c2Transport = (import.meta.env.VITE_C2_TRANSPORT || 'local').toLowerCase();

if (c2Transport === 'firebase' && !firebaseConfig.apiKey) {
  console.error('[Config] CRÍTICO: Se ha solicitado transporte FIREBASE pero faltan las credenciales.');
}
