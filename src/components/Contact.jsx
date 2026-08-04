import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';

function Contact({ links }) {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const onSubmitContact = (event) => {
    event.preventDefault();
    setLoading(true);
    setStatusMessage('');

    emailjs.sendForm(
      'service_n2zpwbt',
      'template_fuhg0pq',
      formRef.current,
      'A7SYt2e376L7Ly6xG'
    )
      .then((response) => {
        setStatusMessage('✓ Message sent successfully! I will get back to you soon.');
        formRef.current.reset();
        setTimeout(() => setStatusMessage(''), 3000);
      })
      .catch((error) => {
        setStatusMessage('✗ Failed to send message. Please try again.');
        console.error('EmailJS error:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

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
            <form ref={formRef} id="contactForm" onSubmit={onSubmitContact}>
              <div className="form-group"><input type="text" name="name" placeholder="Your Name" required /></div>
              <div className="form-group"><input type="email" name="email" placeholder="Your Email" required /></div>
              <div className="form-group"><input type="text" name="subject" placeholder="Subject" required /></div>
              <div className="form-group"><textarea name="message" rows="5" placeholder="Your Message" required /></div>
              <button type="submit" className="btn" disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</button>
            </form>
            {statusMessage && <p style={{ marginTop: '10px', fontSize: '14px', color: statusMessage.includes('✓') ? '#00c9a7' : '#ff6b6b' }}>{statusMessage}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
