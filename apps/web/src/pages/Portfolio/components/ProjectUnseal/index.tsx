import ProjectArtwork from '../ProjectArtwork'
import { getFileNumber } from '../../utils/projects'
import type { PortfolioProject } from '../../utils/projects'
import './ProjectUnseal.css'

export type UnsealMode = 'arm' | 'reveal' | 'seal' | 'release'

type ProjectUnsealProps = {
  mode: UnsealMode
  project: PortfolioProject
  index: number
}

/**
 * 档案封套：卡片与详情页之间的连续性载体。
 * 四段式编排（arm → reveal / seal → release）让 deck 与 detail 的 DOM
 * 切换恰好发生在封套完全覆盖舞台的瞬间，因此看不到硬切。
 */
export default function ProjectUnseal({ mode, project, index }: ProjectUnsealProps) {
  const fileNumber = getFileNumber(index)

  return (
    <div className="portfolio-unseal" data-mode={mode} aria-hidden="true">
      <div className="portfolio-unseal__leaf">
        <span className="portfolio-unseal__mesh" />
        <span className="portfolio-unseal__swoosh" />
        <span className="portfolio-unseal__art">
          <ProjectArtwork project={project} />
        </span>
        <div className="portfolio-unseal__face">
          <div className="portfolio-unseal__head">
            <span className="portfolio-unseal__mark">L<i>／</i>S</span>
            <span className="portfolio-unseal__code">{fileNumber} / ARCHIVE</span>
          </div>
          <div className="portfolio-unseal__body">
            <strong className="portfolio-unseal__title">
              {project.englishTitle.replace('\n', ' ')}
            </strong>
            <em className="portfolio-unseal__name">{project.title}</em>
          </div>
          <div className="portfolio-unseal__base">
            <span className="portfolio-unseal__ruler" />
            <div className="portfolio-unseal__foot">
              <span className="portfolio-unseal__status">
                <i />
                UNSEALING FILE
              </span>
              <span className="portfolio-unseal__spine">
                LOUSUSAN — SELECTED WORKS / {project.code}
              </span>
            </div>
          </div>
        </div>
        <span className="portfolio-unseal__edge portfolio-unseal__edge--top" />
        <span className="portfolio-unseal__edge portfolio-unseal__edge--bottom" />
      </div>
    </div>
  )
}
