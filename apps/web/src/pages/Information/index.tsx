import IntroPanel from './components/IntroPanel'
import PanelPageLayout from '../../components/PanelPageLayout'
import { usePageReady } from '../../utils/pageReady'

function Information() {
  usePageReady()

  return (
    <PanelPageLayout currentIndex={1}>
      <section className="home-panel home-panel--current" aria-label="home intro panel">
        <IntroPanel />
      </section>
    </PanelPageLayout>
  )
}

export default Information
