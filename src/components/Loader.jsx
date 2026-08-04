import React from 'react';

function Loader({ progress }) {
  return (
    <div id="loading-screen">
      <div className="computer-system">
        <div className="monitor">
          <div className="screen">
            <div className="screen-content">
              <p className="terminal-text">Initializing</p>
              <p className="terminal-text">Portfolio System...</p>
              <div className="loading-bar">
                <div className="loading-progress" style={{ width: `${progress}%` }} />
              </div>
              <div className="percent">{progress}%</div>
            </div>
          </div>
        </div>
        <div className="monitor-stand" />
        <div className="keyboard" />
        <div className="cpu">
          <div className="cpu-lights">
            <div className="cpu-light" />
            <div className="cpu-light" />
            <div className="cpu-light" />
          </div>
        </div>
      </div>
      <div className="loading-text">My Portfolio</div>
      <div className="loading-subtext">Booting up amazing content...</div>
      <div className="loading-dots">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    </div>
  );
}

export default Loader;
