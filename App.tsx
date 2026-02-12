import React from 'react';
import ParticleIntro from './components/ParticleIntro';

function App() {
  return (
    <div className="min-h-screen bg-[#050510] text-white relative overflow-hidden">
      <ParticleIntro />
      
      {/* Optional Overlay UI for aesthetics */}
      <div className="absolute bottom-10 w-full text-center pointer-events-none z-20 opacity-70">
        <p className="font-rajdhani tracking-[0.5em] text-cyber-primary text-xs uppercase animate-pulse">
            System Architecture: Loaded
        </p>
      </div>
    </div>
  );
}

export default App;