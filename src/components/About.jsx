import React from 'react'
import './About.css'

const About = () => {
  return (
    <section id="about" className="about">
      <h2 className="section-title">About Me</h2>
      <div className="about-container">
        <div className="about-content">
          <div className="about-text">
            <p className="about-intro">
              I'm a passionate software developer with over 5 years of experience 
              building scalable web applications and innovative solutions. My journey 
              in technology started with curiosity and has evolved into a career 
              dedicated to creating impactful digital experiences.
            </p>
            <p>
              I specialize in full-stack development, with expertise in modern 
              JavaScript frameworks, cloud architecture, and DevOps practices. 
              I'm always eager to learn new technologies and tackle challenging problems.
            </p>
            <p>
              When I'm not coding, you can find me contributing to open-source projects, 
              writing technical blogs, or exploring the latest trends in software engineering. 
              I believe in writing clean, maintainable code and following best practices 
              to deliver high-quality software solutions.
            </p>
          </div>
          <div className="about-stats">
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Projects Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">5+</div>
              <div className="stat-label">Years Experience</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">20+</div>
              <div className="stat-label">Technologies</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">GitHub Contributions</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
