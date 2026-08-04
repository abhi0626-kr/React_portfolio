import React from 'react';

function Hero({ typedText, asset }) {
  const bg = asset('I am.png');
  return (
    <section id="home" className="hero">
      <div className="container hero-inner">
        {/* large background text behind the image */}
        <div className="hero-bg-text">Hi! I&apos;m Abhishek</div>
        {/* cutout image (in front of the background text) */}
        <img className="hero-bg-img" src={bg} alt="hero background" />
        <div className="hero-overlay">
          <div className="hero-content">
            {/* keep H1 for accessibility but visually hide it (background text is the visible heading) */}
            <h1 className="sr-only">Hi! I&apos;m Abhishek</h1>
            <p className="hero-description">
              Frontend developer specializing in responsive and user-friendly web applications.
            </p>
            <div className="hero-ctas">
              <a href="#contact" className="btn outline">Contact</a>
              <a href="#about" className="btn ghost">Who I'm</a>
            </div>
          </div>
        </div>
        {/* running/typewriter moved outside hero-content so it can be positioned relative to the hero container */}
        <div className="typewriter">
          <span className="typewriter-label">And I&apos;m a </span>
          <span id="typed">{typedText}</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
