import { useRef } from 'react'
import HeroPanel from './components/HeroPanel'
import HomePageWave from './components/HomePageWave'
import ScrollIndicator from '../../components/ScrollIndicator'
import ArticleList from '../../components/Blog/ArticleList'
import { useHomeDescent } from './hooks/useHomeDescent'
import { useHeroVideo } from './hooks/useHeroVideo'
import { useScrollPrompt } from './hooks/useScrollPrompt'
import { usePageReady } from '../../utils/pageReady'
import {
  HERO_FALLBACK_VIDEO_SRC,
  HERO_HLS_MANIFEST_SRC,
  HERO_IMAGE_SRC,
} from './utils/heroMedia'
import './styles/HomePage.css'
import './styles/HomeArchive.css'

const QUOTE_TEXT = '爱自己，是终身浪漫的开始。'

function Home() {
  usePageReady()
  const homePageRef = useRef<HTMLElement | null>(null)
  useHomeDescent(homePageRef)
  const articleSectionRef = useRef<HTMLDivElement | null>(null)
  const isVideoEnabled = useHeroVideo()
  const isScrollPromptVisible = useScrollPrompt()

  const scrollToArticles = () => {
    articleSectionRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    })
  }

  return (
    <main className="home-page" ref={homePageRef}>
      <div className="home-page__runway">
        <div className="home-page__sticky">
          <div className="home-page__hero">
            <HeroPanel
              panelClass="home-panel--current"
              quoteText={QUOTE_TEXT}
              canUseVideo={isVideoEnabled}
              imageSrc={HERO_IMAGE_SRC}
              hlsManifestSrc={HERO_HLS_MANIFEST_SRC}
              fallbackVideoSrc={HERO_FALLBACK_VIDEO_SRC}
            />
            <div className="home-page__dim" aria-hidden="true" />
            <div className="home-page__veil" aria-hidden="true" />
            <HomePageWave />
            <ScrollIndicator
              visible={isScrollPromptVisible}
              onActivate={scrollToArticles}
            />
          </div>
        </div>
      </div>

      <div className="home-page__articles" ref={articleSectionRef}>
        <header className="home-archive-heading">
          <div className="home-archive-heading__code"><span>01</span> / KNOWLEDGE ARCHIVE</div>
          <div className="home-archive-heading__row">
            <p className="home-archive-heading__title">NOTES <span>&</span><br />THOUGHTS<span className="home-archive-heading__period">.</span></p>
            <p className="home-archive-heading__caption">把好奇写成记录。<br /><span>代码、思考，以及未完成的探索。</span></p>
          </div>
          <div className="home-archive-heading__rule" aria-hidden="true"><span>LOUSUSAN / FIELD NOTES</span><span>↓</span></div>
        </header>
        <ArticleList />
      </div>
    </main>
  )
}

export default Home
