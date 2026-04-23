import React from 'react';
import SkillsOrbit from './SkillsOrbit';

function About({ skills, asset }) {
  const resumeFile = 'Resume_Abhishek_KR.pdf';

  return (
    <section id="about" className="about">
      <div className="container">
        <h2 className="section-title">About <span>Me</span></h2>
        <div className="about-content">
          <div className="about-skills-panel">
            <div className="skills">
              <h4>My Skills</h4>
              <SkillsOrbit skills={skills} />
            </div>
          </div>

          <div className="about-text">
            <h3>Who I Am</h3>
            <p>I&apos;m a passionate front-end developer with 5 months of experience creating modern and responsive websites.</p>
            <p>I build applications that are visually polished and smooth to use, while continuously learning the newest web tools.</p>
            <p>I enjoy turning ideas into fast, accessible interfaces that feel modern and intuitive across desktop and mobile devices.</p>

            <a href={asset(resumeFile)} download="Abhishek_KR_Resume.pdf" className="btn">Download CV</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
