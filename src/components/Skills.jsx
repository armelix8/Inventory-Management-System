import React from 'react'
import './Skills.css'

const Skills = () => {
  const skillCategories = [
    {
      title: 'Frontend',
      skills: [
        { name: 'React', level: 90 },
        { name: 'JavaScript', level: 95 },
        { name: 'TypeScript', level: 85 },
        { name: 'HTML/CSS', level: 95 },
        { name: 'Vue.js', level: 80 },
        { name: 'Next.js', level: 85 },
      ]
    },
    {
      title: 'Backend',
      skills: [
        { name: 'Node.js', level: 90 },
        { name: 'Python', level: 85 },
        { name: 'Java', level: 80 },
        { name: 'Express.js', level: 90 },
        { name: 'REST APIs', level: 95 },
        { name: 'GraphQL', level: 75 },
      ]
    },
    {
      title: 'Tools & Technologies',
      skills: [
        { name: 'Git', level: 95 },
        { name: 'Docker', level: 85 },
        { name: 'AWS', level: 80 },
        { name: 'CI/CD', level: 85 },
        { name: 'MongoDB', level: 90 },
        { name: 'PostgreSQL', level: 85 },
      ]
    }
  ]

  return (
    <section id="skills" className="skills">
      <h2 className="section-title">Skills & Technologies</h2>
      <div className="skills-container">
        {skillCategories.map((category, index) => (
          <div key={index} className="skill-category">
            <h3 className="category-title">{category.title}</h3>
            <div className="skills-list">
              {category.skills.map((skill, skillIndex) => (
                <div key={skillIndex} className="skill-item">
                  <div className="skill-header">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-percentage">{skill.level}%</span>
                  </div>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Skills
