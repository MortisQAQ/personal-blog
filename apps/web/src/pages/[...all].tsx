import { Link } from 'react-router-dom'
import { usePageReady } from '../utils/pageReady'
import './styles/NotFound.css'

function NotFoundPage() {
  usePageReady()

  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <section className="not-found-file">
        <header className="not-found-file__header">
          <span className="not-found-file__label">00 / EMPTY ARCHIVE</span>
          <span>LOUSUSAN / 档案检索</span>
        </header>
        <div className="not-found-file__body">
          <div className="not-found-file__graphic" aria-hidden="true">
            <span className="not-found-file__number">404</span>
            <span className="not-found-file__stamp">FILE NOT FOUND</span>
          </div>
          <div className="not-found-file__message">
            <p className="not-found-file__eyebrow">STATUS / 404</p>
            <h1 id="not-found-title">档案未找到<span>。</span></h1>
            <p className="not-found-file__description">
              这里暂时没有可供阅读的档案。页面可能已被移动或删除，也可能只是走错了一条路径。
            </p>
            <Link className="not-found-file__return" to="/Home">
              <span>返回首页 / HOME</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <footer className="not-found-file__footer">
          <span>检索结束 / END OF INDEX</span>
          <span>下一页，从首页开始。</span>
        </footer>
      </section>
    </main>
  )
}

export default NotFoundPage
