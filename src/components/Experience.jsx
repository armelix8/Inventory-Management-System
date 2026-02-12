import React from 'react'
import './Experience.css'

const Experience = () => {
  const experiences = [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Innovations Inc.',
      location: 'San Francisco, CA',
      period: '2022 - Present',
      description: [
        'Lead development of microservices architecture serving 1M+ users',
        'Mentored junior developers and conducted code reviews',
        'Implemented CI/CD pipelines reducing deployment time by 60%',
        'Collaborated with cross-functional teams to deliver scalable solutions'
      ],
      technologies: ['React', 'Node.js', 'AWS', 'Docker', 'Kubernetes']
    },
    {
      title: 'Full Stack Developer',
      company: 'Digital Solutions LLC',
      location: 'Remote',
      period: '2020 - 2022',
      description: [
        'Developed and maintained multiple client-facing web applications',
        'Optimized database queries improving performance by 40%',
        'Integrated third-party APIs and payment gateways',
        'Participated in agile development processes'
      ],
      technologies: ['Vue.js', 'Python', 'PostgreSQL', 'Redis']
    },
    {
      title: 'Software Developer',
      company: 'StartupXYZ',
      location: 'New York, NY',
      period: '2019 - 2020',
      description: [
        'Built MVP features for early-stage startup',
        'Worked on both frontend and backend development',
        'Contributed to product design and user experience decisions',
        'Deployed applications to cloud infrastructure'
      ],
      technologies: ['React', 'Express.js', 'MongoDB', 'Heroku']
    }
  ]

  return (
    <section id="experience" className="experience">
      <h2 className="section-title">Work Experience</h2>
      <div className="experience-container">
        <div className="timeline">
          {experiences.map((exp, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="experience-header">
                  <div>
                    <h3 className="experience-title">{exp.title}</h3>
                    <p className="experience-company">{exp.company}</p>
                    <p className="experience-location">{exp.location}</p>
                  </div>
                  <span className="experience-period">{exp.period}</span>
                </div>
                <ul className="experience-description">
                  {exp.description.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
                <div className="experience-technologies">
                  {exp.technologies.map((tech, techIndex) => (
                    <span key={techIndex} className="tech-badge">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Experience
