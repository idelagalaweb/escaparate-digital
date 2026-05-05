import { useMemo } from 'react';
import { Dashboard } from './dashboard/Dashboard';
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
    if (params.has('screen')) return 'player';
    return 'dashboard';
  }, []);

  if (mode === 'diagnostics') {
    return <Diagnostics />;
  }

  if (mode === 'compatibility') {
    return <CompatibilityPage />;
  }

  if (mode === 'player') {
    return <PlayerApp />;
  }

  return <Dashboard />;
}

export default App;
