import React from 'react';

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'projects', label: 'Projects' },
  { id: 'blog', label: 'Blog' },
  { id: 'contact', label: 'Contact' }
];

function Header({ isMenuOpen, setIsMenuOpen, currentView }) {
  if (currentView === 'blog') {
    return (
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-container-max mx-auto px-gutter py-4 flex justify-between items-center">
          <a
            className="text-body-lg font-display-lg font-bold text-on-background hover:text-primary transition-colors"
            href="#home"
            onClick={() => setIsMenuOpen(false)}
          >
            I'm, Abhishek
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isCurrent = item.id === 'blog';
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-label-sm text-label-sm transition-colors ${
                    isCurrent
                      ? 'text-primary font-bold border-b-2 border-primary pb-1'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden material-symbols-outlined text-on-surface-variant hover:text-white"
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? 'close' : 'menu'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-white/10 px-gutter py-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setIsMenuOpen(false)}
                className={`block py-2 font-label-sm text-label-sm ${
                  item.id === 'blog' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>
    );
  }

  return (
    <header>
      <div className="scroll-text">
        <p>
          Welcome to my portfolio! I&apos;m Abhishek, an <span>AI Full Stack Developer.</span>
        </p>
      </div>
      <div className="container">
        <nav>
          <div className="nav-left">
            <div className="logo">
              <a href="#home" onClick={() => setIsMenuOpen(false)}>
                <span className="icon-bounce" />
                I'm <span>, Abhishek</span>
              </a>
            </div>
          </div>

          <div className="nav-center">
            <ul className={isMenuOpen ? 'nav-links active' : 'nav-links'}>
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setIsMenuOpen(false)}
                    className={item.id === currentView ? 'active' : ''}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-right">
            <div className="social-links" />

            <button
              className={isMenuOpen ? 'hamburger active' : 'hamburger'}
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <span className="line" />
              <span className="line" />
              <span className="line" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
