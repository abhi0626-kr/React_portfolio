import React from 'react';

function Contact({ links, onSubmit }) {
  return (
    <section id="contact" className="contact">
      <div className="container">
        <h2 className="section-title">Contact <span>Me</span></h2>
        <div className="contact-content">
          <div className="contact-info">
            <h3>Get In Touch</h3>
            <p>Feel free to reach out for collaborations or just a friendly hello.</p>

            <div className="contact-item"><i className="fas fa-envelope" /><p>abhishek636kr@email.com</p></div>
            <div className="contact-item"><i className="fas fa-phone" /><p>+91 (6383221055)</p></div>
            <div className="contact-item"><i className="fas fa-map-marker-alt" /><p>Tirupattur, Tamil Nadu</p></div>

            <div className="social-links">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  aria-label={link.label}
                  title={link.label}
                  className="social-btn"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="social-icon-shell">
                    <i className={link.icon} />
                  </span>
                  <span className="social-bg" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="contact-form">
            <form id="contactForm" onSubmit={onSubmit}>
              <div className="form-group"><input type="text" placeholder="Your Name" required /></div>
              <div className="form-group"><input type="email" placeholder="Your Email" required /></div>
              <div className="form-group"><input type="text" placeholder="Subject" required /></div>
              <div className="form-group"><textarea rows="5" placeholder="Your Message" required /></div>
              <button type="submit" className="btn">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
