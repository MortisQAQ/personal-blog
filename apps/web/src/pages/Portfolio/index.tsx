import PanelPageLayout from '../../components/PanelPageLayout'
import PortfolioStage from './components/PortfolioStage'
import usePortfolioController from './hooks/usePortfolioController'
import { usePageReady } from '../../utils/pageReady'
import './styles/PortfolioPage.css'

function Portfolio() {
  usePageReady()
  const controller = usePortfolioController()

  return (
    <PanelPageLayout currentIndex={2}>
      <PortfolioStage controller={controller} />
    </PanelPageLayout>
  )
}

export default Portfolio
