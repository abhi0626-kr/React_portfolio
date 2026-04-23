import React from 'react';

function Projects({ activeFilter, onFilterChange, filteredProjects, asset }) {
  return (
    <section id="portfolio" className="portfolio">
      <div className="container">
        <h2 className="section-title">My <span>Project</span></h2>

        <div className="portfolio-filter">
          {['all', 'web', 'app', 'design'].map((category) => (
            <button
              key={category}
              type="button"
              className={activeFilter === category ? 'filter-btn active' : 'filter-btn'}
              onClick={() => onFilterChange(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="portfolio-grid">
          {filteredProjects.map((project) => (
            <article className="portfolio-item" key={project.title}>
              <div className="project-card-container">
                <div className="project-profile-panel">
                  <img src={asset(project.image)} alt={project.title} className="project-cover" />
                  <span className="project-hover-label">{project.title}</span>
                </div>

                <div className="project-info-panel">
                  <div className="project-name-panel">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                  </div>

                  <div className="project-social-panel">
                    {project.githubLink && (
                      <a href={project.githubLink} className="project-action" target="_blank" rel="noreferrer" title="Open GitHub Repository">
                        <i className="fab fa-github" />
                      </a>
                    )}
                    {project.liveLink && (
                      <a href={project.liveLink} className="project-action" target="_blank" rel="noreferrer" title="Open Live Demo">
                        <i className="fas fa-rocket" />
                      </a>
                    )}
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

export default Projects;
