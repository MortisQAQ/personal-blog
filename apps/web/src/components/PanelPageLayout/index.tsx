import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import SideIndicator from '../SideIndicator'
import './PanelPageLayout.css'

const PANEL_TITLES = [
  { en: 'HOMEPAGE', zh: '首页', path: '/Home' },
  { en: 'INFORMATION', zh: '介绍', path: '/Information' },
  { en: 'PORTFOLIO', zh: '作品', path: '/Portfolio' },
]

const PANEL_TOTAL = 4

type PanelPageLayoutProps = {
  currentIndex: number
  children: ReactNode
}

function PanelPageLayout({ currentIndex, children }: PanelPageLayoutProps) {
  const title = PANEL_TITLES[currentIndex]
  const next = PANEL_TITLES[(currentIndex + 1) % PANEL_TITLES.length]

  return (
    <main className={`panel-page panel-page--${title.en.toLowerCase()}`}>
      <div className="panel-page__grid" aria-hidden="true" />
      <div className="panel-page__body">
        <div className="panel-page__register"><span>FIELD RECORD / PERSONAL ARCHIVE</span><span>{title.en} — {String(currentIndex + 1).padStart(2, '0')} / {String(PANEL_TOTAL).padStart(2, '0')}</span></div>
        <div className="panel-page__content">{children}</div>
      </div>
      <SideIndicator currentIndex={currentIndex} total={PANEL_TOTAL} titles={PANEL_TITLES} />
      <footer className="panel-page__footer">
        <span className="panel-page__watermark" aria-hidden="true">{title.en}</span>
        <span className="panel-page__signature">LOUSUSAN / STILL IN PROGRESS</span>
        <Link to={next.path} className="panel-page__next"><span>NEXT / {next.zh}</span><span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  )
}

export default PanelPageLayout
