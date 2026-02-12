import React from 'react'
import './Projects.css'

const Projects = () => {
  const projects = [
    {
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with payment integration, inventory management, and admin dashboard. Built with React, Node.js, and MongoDB.',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe API'],
      image: '🛒',
      github: 'https://github.com',
      demo: 'https://demo.com',
    },
    {
      title: 'Task Management App',
      description: 'A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features.',
      technologies: ['React', 'Socket.io', 'Express', 'PostgreSQL'],
      image: '📋',
      github: 'https://github.com',
      demo: 'https://demo.com',
    },
    {
      title: 'Weather Dashboard',
      description: 'A beautiful weather dashboard with location-based forecasts, interactive maps, and detailed weather analytics.',
      technologies: ['React', 'OpenWeather API', 'Chart.js', 'CSS3'],
      image: '🌤️',
      github: 'https://github.com',
      demo: 'https://demo.com',
    },
    {
      title: 'Social Media Analytics',
      description: 'Analytics platform for social media metrics with data visualization, reporting, and insights dashboard.',
      technologies: ['Vue.js', 'Python', 'D3.js', 'FastAPI'],
      image: '📊',
      github: 'https://github.com',
      demo: 'https://demo.com',
    },
    {
      title: 'Learning Management System',
      description: 'Complete LMS with course creation, student enrollment, progress tracking, and interactive quizzes.',
      technologies: ['Next.js', 'TypeScript', 'Prisma', 'AWS'],
      image: '🎓',
      github: 'https://github.com',
      demo: 'https://demo.com',
    },
    {
      title: 'Chat Application',
      description: 'Real-time chat application with group messaging, file sharing, and video call capabilities.',
      technologies: ['React', 'WebSocket', 'Node.js', 'Redis'],
      image: '💬',
      github: 'https://github.com',
      demo: 'https://demo.com',
    },
  ]

  return (
    <section id="projects" className="projects">
      <h2 className="section-title">Featured Projects</h2>
      <div className="projects-container">
        {projects.map((project, index) => (
          <div key={index} className="project-card">
            <div className="project-image">
              <div className="project-icon">{project.image}</div>
            </div>
            <div className="project-content">
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <div className="project-technologies">
                {project.technologies.map((tech, techIndex) => (
                  <span key={techIndex} className="tech-tag">{tech}</span>
                ))}
              </div>
              <div className="project-links">
                <a 
                  href={project.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="project-link"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Code
                </a>
                <a 
                  href={project.demo} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="project-link"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Live Demo
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Projects
