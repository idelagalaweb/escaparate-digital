import { useMemo } from 'react';
import { Dashboard } from './dashboard/Dashboard';
import { HelloTest } from './dashboard/HelloTest';
import { PlayerApp } from './player/PlayerApp';
import { Diagnostics } from './player/Diagnostics';
import { CompatibilityPage } from './pages/Compatibility';
import './index.css';

function App() {
  const mode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    
    if (path.includes('diagnostics') || params.has('diag')) return 'diagnostics';
    if (path.includes('compatibility') || params.has('comp')) return 'compatibility';
    if (path.includes('hello-c2') || params.get('test') === 'hello') return 'hellotest';
    if (params.has('screen')) return 'player';
    return 'dashboard';
  }, []);

  console.log(`[App] 🧭 Routing mode: ${mode}`);

  if (mode === 'diagnostics') {
    return <Diagnostics />;
  }

  if (mode === 'compatibility') {
    return <CompatibilityPage />;
  }

  if (mode === 'hellotest') {
    return <HelloTest />;
  }

  if (mode === 'player') {
    return <PlayerApp />;
  }

  return <Dashboard />;
}

export default App;
