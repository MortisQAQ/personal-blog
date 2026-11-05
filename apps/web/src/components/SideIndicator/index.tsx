import './SideIndicator.css'

interface SideIndicatorProps {
  currentIndex: number
  total: number
  titles: { en: string; zh: string }[]
}

export default function SideIndicator({ currentIndex, total, titles }: SideIndicatorProps) {
  const currentTitle = titles[currentIndex]
  const currentNumber = String(currentIndex + 1).padStart(2, '0')
  const totalNumber = String(total).padStart(2, '0')

  return (
    <aside className="side-indicator" aria-label="Panel Navigation Indicator">
      <span className="side-indicator__register">PERSONAL<br />ARCHIVE</span>
      <div className="side-indicator__inner">
        <div className="side-indicator__numbers">
          <span className="side-indicator__current">{currentNumber}</span>
          <span className="side-indicator__sequence">/ {totalNumber}<small>LOUSUSAN</small></span>
        </div>
        <div className="side-indicator__text">
          <div className="side-indicator__title-en">{currentTitle.en}</div>
          <div className="side-indicator__title-zh">{currentTitle.zh}</div>
        </div>
      </div>
      <span className="side-indicator__mark" aria-hidden="true">✦</span>
      <span className="side-indicator__bottom">FIELD RECORD — {currentNumber}</span>
    </aside>
  )
}
