import React from 'react';

function Services({ services }) {
  return (
    <section id="services" className="services">
      <div className="container">
        <div className="section-title-wrap">
          <h2 className="section-title">
            My <span>Services</span>
          </h2>
          <p className="services-section-desc">
            Production-grade engineering solutions across Full-Stack development, Generative AI integration, and Data Analytics based on my resume &amp; industry experience.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <article className="service-card cyber-card-container noselect" key={service.title}>
              <div className="cyber-canvas">
                {/* 25 grid trackers for smooth 3D tilt tracking */}
                <div className="tracker tr-1" />
                <div className="tracker tr-2" />
                <div className="tracker tr-3" />
                <div className="tracker tr-4" />
                <div className="tracker tr-5" />
                <div className="tracker tr-6" />
                <div className="tracker tr-7" />
                <div className="tracker tr-8" />
                <div className="tracker tr-9" />
                <div className="tracker tr-10" />
                <div className="tracker tr-11" />
                <div className="tracker tr-12" />
                <div className="tracker tr-13" />
                <div className="tracker tr-14" />
                <div className="tracker tr-15" />
                <div className="tracker tr-16" />
                <div className="tracker tr-17" />
                <div className="tracker tr-18" />
                <div className="tracker tr-19" />
                <div className="tracker tr-20" />
                <div className="tracker tr-21" />
                <div className="tracker tr-22" />
                <div className="tracker tr-23" />
                <div className="tracker tr-24" />
                <div className="tracker tr-25" />

                {/* 3D Cyber Card */}
                <div className="cyber-card">
                  <div className="cyber-card-content">
                    {/* Visual Cyber Layers */}
                    <div className="card-glare" />

                    <div className="cyber-lines">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="glowing-elements">
                      <div className="glow-1" />
                      <div className="glow-2" />
                      <div className="glow-3" />
                    </div>

                    <div className="corner-elements">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="scan-line" />

                    <div className="card-particles">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    {/* Resume Service Content */}
                    <div className="cyber-inner-body">
                      <div className="cyber-card-top">
                        <span className="cyber-service-code">SVC // 0{index + 1}</span>
                        <div className="cyber-icon-pill">
                          <i className={service.icon} />
                        </div>
                      </div>

                      <h3 className="cyber-card-title">{service.title}</h3>

                      {service.highlight && (
                        <div className="cyber-badge-wrap">
                          <span className="cyber-highlight-tag">{service.highlight}</span>
                        </div>
                      )}

                      <p className="cyber-card-desc">{service.description}</p>

                      {service.tags && (
                        <div className="cyber-tags-list">
                          {service.tags.map((tag) => (
                            <span key={tag} className="cyber-tech-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="cyber-card-footer">
                        <span className="cyber-footer-status">
                          <span className="cyber-status-led" />
                          <span>INTERACTIVE 3D SERVICE</span>
                        </span>
                        <span className="cyber-footer-arrow">
                          <i className="fas fa-chevron-right" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;
