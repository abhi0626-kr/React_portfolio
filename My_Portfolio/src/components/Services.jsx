import React from 'react';

function Services({ services }) {
  return (
    <section id="services" className="services">
      <div className="container">
        <h2 className="section-title">My <span>Services</span></h2>
        <div className="services-grid">
          {services.map((service) => (
            <article className="service-card" key={service.title}>
              <div className="service-book">
                <div className="service-content">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>

                <div className="service-cover">
                  <i className={service.icon} />
                  <h3>{service.title}</h3>
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
