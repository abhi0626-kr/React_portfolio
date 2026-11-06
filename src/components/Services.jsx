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
            Production-grade engineering solutions across Full-Stack Python &amp; MERN development, Generative AI integration, and Data Analytics based on my resume &amp; industry experience.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <article className="service-card" key={service.title}>
              <div className="service-book">
                {/* Back content: revealed on hover when book cover opens */}
                <div className="service-content">
                  <div className="service-content-top">
                    <span className="service-idx-badge">0{index + 1}</span>
                    <i className={service.icon} />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  {service.tags && (
                    <div className="service-tags">
                      {service.tags.map((tag) => (
                        <span key={tag} className="service-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Front cover: interactive 3D door */}
                <div className="service-cover">
                  <span className="service-cover-number">0{index + 1}</span>
                  <div className="service-cover-icon-box">
                    <i className={service.icon} />
                  </div>
                  <h3>{service.title}</h3>
                  {service.highlight && (
                    <span className="service-cover-highlight">{service.highlight}</span>
                  )}
                  <div className="service-cover-hint">
                    <span>Hover to explore</span>
                    <i className="fas fa-arrow-right" />
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
