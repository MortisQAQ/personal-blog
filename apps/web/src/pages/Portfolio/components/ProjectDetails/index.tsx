import { useState } from 'react'
import ProjectArtwork from '../ProjectArtwork'
import { getFileNumber, normalizeProjectIndex, PROJECTS } from '../../utils/projects'
import type { PortfolioProject } from '../../utils/projects'
import './ProjectDetails.css'

type ProjectDetailsProps = {
  project: PortfolioProject
  activeIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

export default function ProjectDetails({ project, activeIndex, onClose, onPrevious, onNext }: ProjectDetailsProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const isOriginalArtwork = !project.image || imageFailed
  const fileNumber = getFileNumber(activeIndex)
  const previousProject = PROJECTS[normalizeProjectIndex(activeIndex - 1)]
  const nextProject = PROJECTS[normalizeProjectIndex(activeIndex + 1)]

  return (
    <article
      className="portfolio-details"
      data-project={project.id}
      data-image-type={isOriginalArtwork ? 'graphic' : project.imageType}
      aria-labelledby="portfolio-detail-title"
    >
      <div className="portfolio-details__toolbar">
        <button type="button" className="portfolio-details__close" onClick={onClose}>
          <span aria-hidden="true">←</span>返回档案
        </button>
        <p className="portfolio-details__number" aria-label={`作品 ${activeIndex + 1}，共 ${PROJECTS.length} 个`}>
          <span>{fileNumber}</span><span aria-hidden="true">/</span>{getFileNumber(PROJECTS.length - 1)}
        </p>
      </div>

      <header>
        <p className="portfolio-details__code">FILE {fileNumber} / {project.code}</p>
        <h2 id="portfolio-detail-title" tabIndex={-1}>{project.title}</h2>
        <p className="portfolio-details__english" lang="en">{project.englishTitle.replace(/\n/g, ' ')}</p>
        <span className="portfolio-details__category">{project.category}</span>
        <ul>{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
      </header>

      <div className="portfolio-details__visual">
        <div className="portfolio-details__art-register">
          <span>{isOriginalArtwork ? 'ORIGINAL ART / 原创封面 · 非产品截图' : 'PROJECT VISUAL / 作品视觉'}</span>
          <span aria-hidden="true">{fileNumber}—A</span>
        </div>
        <div className="portfolio-details__art">
          <ProjectArtwork project={project} onFallback={() => setImageFailed(true)} />
          <span className="portfolio-details__plate" aria-hidden="true" />
        </div>
        <p className="portfolio-details__pitch">{project.summary}</p>
      </div>

      <div className="portfolio-details__copy">
        <section>
          <h3><span aria-hidden="true">01 /</span> 项目背景 <small lang="en">PROJECT NOTE</small></h3>
          <p>{project.description}</p>
        </section>
        <section>
          <h3><span aria-hidden="true">02 /</span> 个人职责 <small lang="en">MY CONTRIBUTION</small></h3>
          <p>{project.role}</p>
        </section>
      </div>

      <a className="portfolio-details__link" href={project.link} target="_blank" rel="noopener noreferrer">
        <span>{project.linkLabel}</span>
        <small>新窗口打开 <span aria-hidden="true">↗</span></small>
      </a>

      <nav className="portfolio-details__navigation" aria-label="作品详情导航">
        <button type="button" onClick={onPrevious} aria-label="上一个项目">
          <span className="portfolio-details__direction" aria-hidden="true">←</span>
          <span className="portfolio-details__destination"><span>上一个作品</span><strong>{previousProject.title}</strong></span>
        </button>
        <button type="button" onClick={onNext} aria-label="下一个项目">
          <span className="portfolio-details__destination"><span>下一个作品</span><strong>{nextProject.title}</strong></span>
          <span className="portfolio-details__direction" aria-hidden="true">→</span>
        </button>
      </nav>
    </article>
  )
}
