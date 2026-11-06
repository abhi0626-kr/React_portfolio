import React from 'react';

function Hero({ typedText, asset }) {
  const heroImg = asset('abhishek_hero.png');

  return (
    <section id="home" className="hero-editorial">
      {/* Background Giant Text & Ambient Glow */}
      <div className="hero-editorial-bg" aria-hidden="true">
        <div className="hero-ambient-glow" />
        <div className="hero-giant-portfolio">PORTFOLIO</div>
      </div>

      <div className="container hero-editorial-container">
        {/* Left Column: Greeting, Name, Role, Subtext, CTA, Location */}
        <div className="hero-left-col">
          <div className="hero-script-greet">Hello, I&apos;m</div>

          <h1 className="hero-name-title">
            ABHISHEK<span className="hero-name-square" />
          </h1>

          <div className="hero-role-tag">DEVELOPER &amp; DESIGNER</div>

          <p className="hero-tagline-desc">
            Designing interfaces. Shipping products.
            <br />
            I turn ideas into fast websites and apps people actually enjoy using, from the first wireframe to launch day.
          </p>

          <div className="hero-action-row">
            <a href="#projects" className="hero-cta-btn">
              <span>See my work</span>
              <span className="hero-cta-arrow">↓</span>
            </a>
          </div>

          <div className="hero-location-badge">
            <i className="fa-solid fa-location-dot" />
            <span>Bangalore, INDIA</span>
          </div>
        </div>

        {/* Center: Cutout Portrait Layered in Front */}
        <div className="hero-center-portrait">
          <div className="hero-portrait-glow" />
          <img
            src={heroImg}
            alt="Abhishek - Developer & Designer"
            className="hero-cutout-img"
            loading="eager"
          />
        </div>

        {/* Right Column: Purpose Badge & Vertical Stats */}
        <div className="hero-right-col">
          <div className="hero-purpose-pill">
            <div className="hero-spark-icon">
              <i className="fa-solid fa-asterisk" />
            </div>
            <div className="hero-purpose-text">
              Every pixel.
              <br />
              A purpose.
            </div>
          </div>

          <div className="hero-stats-group">
            <div className="hero-stat-card">
              <div className="hero-stat-digit">
                6<span>+</span>
              </div>
              <div className="hero-stat-desc">
                MONTHS BUILDING
                <br />
                FOR THE WEB
              </div>
            </div>

            <div className="hero-stat-divider" />

            <div className="hero-stat-card">
              <div className="hero-stat-digit">
                15<span>+</span>
              </div>
              <div className="hero-stat-desc">
                PROJECTS &amp; REVIEWS
                <br />
                RATED 4.9 / 5
              </div>
            </div>

            <div className="hero-stat-divider" />

            <a href="#services" className="hero-stat-card hero-stat-interactive">
              <div className="hero-stat-digit">6</div>
              <div className="hero-stat-desc">
                SERVICES OFFERED
                <br />
                IN WEB &amp; APP DEV <span className="stat-arrow-indicator">↗</span>
              </div>
            </a>
          </div>

          {/* Subtly show the typewriter role at the bottom right */}
          <div className="hero-live-badge">
            <span className="hero-live-dot" />
            <span className="hero-live-label">Currently coding:</span>
            <span className="hero-live-text">
              {typedText || ''}
              <span className="hero-live-cursor" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
