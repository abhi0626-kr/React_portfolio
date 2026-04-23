import React from 'react';

function Certificates({ certificates, asset, onSelect }) {
  return (
    <section id="certificates" className="certificates">
      <div className="container">
        <h2 className="section-title">My <span>Certificates</span></h2>
        <div className="certificates-grid">
          {certificates.map((certificate) => (
            <article className="certificate-card" key={certificate.image} onClick={() => onSelect(certificate.image)}>
              <div className="certificate-border" />
              <div className="certificate-content">
                <div className="certificate-preview">
                  <img src={asset(certificate.image)} alt={certificate.title} />
                  <span className="certificate-trail" />
                </div>
                <span className="certificate-brand">My Certificate</span>
              </div>
              <span className="certificate-bottom-text">Click To View</span>
              <h3>{certificate.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Certificates;
