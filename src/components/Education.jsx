import React from 'react'
import './Education.css'

const Education = () => {
  const education = [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of Technology',
      location: 'New York, NY',
      period: '2015 - 2019',
      description: 'Specialized in Software Engineering and Web Development. Graduated with honors.',
      courses: ['Data Structures', 'Algorithms', 'Database Systems', 'Software Engineering']
    },
    {
      degree: 'Full Stack Web Development Bootcamp',
      institution: 'Tech Academy',
      location: 'Online',
      period: '2019',
      description: 'Intensive 6-month program covering modern web development technologies and best practices.',
      courses: ['React', 'Node.js', 'MongoDB', 'Git & GitHub']
    }
  ]

  const certifications = [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', year: '2023' },
    { name: 'Google Cloud Professional Developer', issuer: 'Google Cloud', year: '2022' },
    { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', year: '2021' },
  ]

  return (
    <section id="education" className="education">
      <h2 className="section-title">Education & Certifications</h2>
      <div className="education-container">
        <div className="education-section">
          <h3 className="subsection-title">Education</h3>
          <div className="education-list">
            {education.map((edu, index) => (
              <div key={index} className="education-card">
                <div className="education-header">
                  <div>
                    <h4 className="education-degree">{edu.degree}</h4>
                    <p className="education-institution">{edu.institution}</p>
                    <p className="education-location">{edu.location}</p>
                  </div>
                  <span className="education-period">{edu.period}</span>
                </div>
                <p className="education-description">{edu.description}</p>
                <div className="education-courses">
                  <strong>Key Courses:</strong>
                  <div className="courses-list">
                    {edu.courses.map((course, courseIndex) => (
                      <span key={courseIndex} className="course-tag">{course}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="certifications-section">
          <h3 className="subsection-title">Certifications</h3>
          <div className="certifications-list">
            {certifications.map((cert, index) => (
              <div key={index} className="certification-card">
                <div className="cert-icon">🏆</div>
                <div className="cert-content">
                  <h4 className="cert-name">{cert.name}</h4>
                  <p className="cert-issuer">{cert.issuer}</p>
                  <span className="cert-year">{cert.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Education
