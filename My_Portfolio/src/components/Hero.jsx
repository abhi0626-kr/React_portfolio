import React from 'react';

function Hero({ typedText, asset }) {
  return (
    <section id="home" className="hero">
      <div className="container">
        <div className="hero-content">
          <h3>Hello It&apos;s Me</h3>
          <h1><span>Abhishek</span></h1>
          <div className="typewriter">
            <span className="typewriter-label">And I&apos;m a </span>
            <span id="typed">{typedText}</span>
          </div>
          <p>Frontend developer specializing in responsive and user-friendly web applications.</p>
          <div className="hero-btns">
            <a href="#portfolio" className="btn">View My Work</a>
            <a href="#contact" className="btn secondary-btn">Hire Me</a>
          </div>
        </div>

        <div className="hero-img">
          <img src={asset('I am.jpeg')} alt="Abhishek" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
