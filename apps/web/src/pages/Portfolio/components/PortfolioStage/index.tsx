import ProjectDeck from '../ProjectDeck'
import ProjectDirectory from '../ProjectDirectory'
import ProjectDetails from '../ProjectDetails'
import ProjectUnseal from '../ProjectUnseal'
import type { PortfolioController } from '../../hooks/usePortfolioController'
import { PROJECTS } from '../../utils/projects'
import './PortfolioStage.css'

type PortfolioStageProps = {
  controller: PortfolioController
}

export default function PortfolioStage({ controller }: PortfolioStageProps) {
  const {
    activeIndex, isDetailOpen, phase, unseal, stageRef, selectProject, openDetails, closeDetails,
    goNext, handleCardClick, handleKeyDown, handlePointerDown, handlePointerUp, cancelSwipe,
  } = controller
  const project = PROJECTS[activeIndex]

  return (
    <section
      className={`portfolio-stage ${isDetailOpen ? 'portfolio-stage--detail' : ''}`}
      data-phase={phase}
      ref={stageRef}
      aria-label="portfolio detail panel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelSwipe}
    >
      <div className="portfolio-stage__backdrop" aria-hidden="true">
        <span className="portfolio-stage__watermark">{isDetailOpen ? project.englishTitle.replace('\n', ' ') : 'SELECTED WORKS'}</span>
        <div className="portfolio-stage__grain" />
      </div>
      {isDetailOpen ? (
        <ProjectDetails
          key={project.id}
          project={project}
          activeIndex={activeIndex}
          onClose={closeDetails}
          onPrevious={() => goNext(-1)}
          onNext={() => goNext(1)}
        />
      ) : (
        <>
          <ProjectDirectory activeIndex={activeIndex} disabled={phase !== 'idle'} onSelect={selectProject} onOpen={openDetails} />
          <ProjectDeck activeIndex={activeIndex} opening={phase === 'opening'} onStep={goNext} onCardClick={handleCardClick} />
        </>
      )}
      {unseal ? <ProjectUnseal mode={unseal} project={project} index={activeIndex} /> : null}
    </section>
  )
}
