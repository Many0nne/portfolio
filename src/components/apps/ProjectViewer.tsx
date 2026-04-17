import styles from './ProjectViewer.module.css'
import { projects } from '../../data/projects'

interface ProjectViewerProps {
  projectId?: string
}

export function ProjectViewer({ projectId }: ProjectViewerProps) {
  const project = projects.find((p) => p.id === projectId) ?? projects[0]

  if (!project) return <div style={{ padding: 16 }}>Projet introuvable.</div>

  return (
    <div className={styles.container}>
      <div className={styles.screenshot}>
        <img
          src={project.screenshot}
          alt={`Capture d'écran de ${project.title}`}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget
            img.style.display = 'none'
            const placeholder = img.nextElementSibling as HTMLElement | null
            if (placeholder) placeholder.style.display = 'flex'
          }}
        />
        <div className={styles.screenshotPlaceholder}>
          <img src="/img/web_file_0.png" alt="" className={styles.screenshotPlaceholderIcon} />
          <span>{project.title}</span>
        </div>
      </div>

      <div className={styles.body}>
        <h2 className={styles.title}>{project.title}</h2>
        <p className={styles.description}>{project.description}</p>

        <table className={styles.metaTable}>
          <tbody>
            <tr>
              <th>Technologies</th>
              <td>{project.techStack.join(', ')}</td>
            </tr>
            <tr>
              <th>Date</th>
              <td>{project.date}</td>
            </tr>
            <tr>
              <th>Rôle</th>
              <td>{project.role}</td>
            </tr>
          </tbody>
        </table>

        <div className={styles.links}>
          {project.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkBtn}
            >
              <img src="/img/web_file_0.png" alt="" className={styles.linkBtnIcon} />
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
