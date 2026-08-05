import React, { useEffect, useState } from 'react';

function Loader({ progress, onOpenPortfolio }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const isReady = progress >= 100;

  const handleDismiss = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    setTimeout(() => {
      onOpenPortfolio();
    }, 600);
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 5) {
        handleDismiss();
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touchCurrentY = e.touches[0].clientY;
        if (Math.abs(touchStartY - touchCurrentY) > 10) {
          handleDismiss();
        }
      }
    };

    const handleKeyDown = (e) => {
      if (['ArrowDown', 'PageDown', 'Space', 'Enter'].includes(e.code)) {
        handleDismiss();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLeaving]);

  return (
    <div
      id="loading-screen"
      onClick={handleDismiss}
      className={isLeaving ? 'loader-leaving' : ''}
    >
      <div className="loader-container">
        {/* Abhishek Brand Logo */}
        <div className="loader-logo-wrapper">
          <div className="loader-logo-ring" />
          <img
            src="/dist/2.png"
            alt="Abhishek Logo"
            className="loader-logo-img"
            onError={(e) => {
              e.target.src = '/logo.jpg';
            }}
          />
        </div>

        {/* Brand Name */}
        <h1 className="loader-title">Abhishek KR</h1>
        <p className="loader-subtitle">AI & Full Stack Developer</p>

        {/* Progress Bar & Percentage */}
        <div className="loader-progress-box">
          <div className="loader-progress-track">
            <div className="loader-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="loader-progress-text">
            <span>{isReady ? 'System Ready' : 'Initializing System...'}</span>
            <span className="loader-percentage">{progress}%</span>
          </div>
        </div>

        {/* Scroll or Click to Open Prompt */}
        <div className={`loader-action-prompt ${isReady ? 'ready' : ''}`}>
          <button
            type="button"
            className="loader-enter-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
          >
            <span>Open Portfolio</span>
            <i className="fas fa-arrow-right" />
          </button>

          <div className="loader-scroll-indicator">
            <span className="loader-scroll-text">Scroll or click to open</span>
            <i className="fas fa-chevron-down loader-chevron-animate" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loader;
