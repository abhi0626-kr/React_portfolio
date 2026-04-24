import React, { useEffect, useMemo, useState } from 'react';
import About from './components/About';
import CertificateModal from './components/CertificateModal';
import Certificates from './components/Certificates';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Header from './components/Header';
import Hero from './components/Hero';
import Loader from './components/Loader';
import Projects from './components/Projects';
import Services from './components/Services';
import { certificates, links, projects, roles, services, skills } from './data/portfolioData';

const asset = (fileName) => `/${encodeURIComponent(fileName)}`;

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(progressTimer);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    const loaderTimer = window.setTimeout(() => {
      setShowLoader(false);
    }, 5000);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(loaderTimer);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId;

    const loop = () => {
      const currentRole = roles[roleIndex];
      if (!deleting) {
        charIndex += 1;
        if (mounted) {
          setTypedText(currentRole.slice(0, charIndex));
        }

        if (charIndex === currentRole.length) {
          deleting = true;
          timeoutId = window.setTimeout(loop, 1400);
          return;
        }

        timeoutId = window.setTimeout(loop, 90);
      } else {
        charIndex -= 1;
        if (mounted) {
          setTypedText(currentRole.slice(0, charIndex));
        }

        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          timeoutId = window.setTimeout(loop, 350);
          return;
        }

        timeoutId = window.setTimeout(loop, 50);
      }
    };

    timeoutId = window.setTimeout(loop, 800);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    const targets = document.querySelectorAll(
      '.section-title, .about-content, .service-card, .certificate-card, .portfolio-item, .contact-content, .skill-item'
    );

    targets.forEach((el) => observer.observe(el));

    return () => {
      targets.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedCertificate ? 'hidden' : 'auto';
  }, [selectedCertificate]);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') {
      return projects;
    }
    const normalizedFilter = activeFilter.toLowerCase();
    return projects.filter((project) => String(project.category).toLowerCase() === normalizedFilter);
  }, [activeFilter]);

  const onSubmitContact = (event) => {
    event.preventDefault();
    window.alert('Thank you for your message! I will get back to you soon.');
    event.currentTarget.reset();
  };

  return (
    <>
      {showLoader && <Loader progress={loadingProgress} />}

      <div className={showLoader ? 'app-shell app-hidden' : 'app-shell'}>
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

        <main>
          <Hero typedText={typedText} asset={asset} />
          <About skills={skills} asset={asset} />
          <Services services={services} />
          <Certificates certificates={certificates} asset={asset} onSelect={setSelectedCertificate} />
          <Projects
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            filteredProjects={filteredProjects}
            asset={asset}
          />
          <Contact links={links} onSubmit={onSubmitContact} />
        </main>

        <Footer />
        <CertificateModal selectedCertificate={selectedCertificate} onClose={() => setSelectedCertificate(null)} asset={asset} />
      </div>
    </>
  );
}

export default App;
