import React from 'react';

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'portfolio', label: 'Project' },
  { id: 'contact', label: 'Contact' }
];

function Header({ isMenuOpen, setIsMenuOpen }) {
  return (
    <header>
      <div className="scroll-text">
        <p>
          Welcome to my portfolio! I&apos;m Abhishek, an <span>AI Full Stack Developer.</span>
        </p>
      </div>
      <div className="container">
        <nav>
          <div className="logo">
            <a href="#home" onClick={() => setIsMenuOpen(false)}>
              <span className="icon-bounce" />
              My<span>portfolio</span>
            </a>
          </div>

          <ul className={isMenuOpen ? 'nav-links active' : 'nav-links'}>
            {navItems.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={() => setIsMenuOpen(false)}>{item.label}</a>
              </li>
            ))}
          </ul>

          <button
            className={isMenuOpen ? 'hamburger active' : 'hamburger'}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span className="line" />
            <span className="line" />
            <span className="line" />
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
