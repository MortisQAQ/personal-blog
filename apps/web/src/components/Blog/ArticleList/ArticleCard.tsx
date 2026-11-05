import { memo, useRef } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { ArticleSummary } from '../../../utils/contentApi'
import { formatNumber, resolveDisplayImage } from '../contentUtils'

type ArticleCardProps = {
  article: ArticleSummary
  index: number
  onOpen: (article: ArticleSummary) => void
  onPrefetch?: (article: ArticleSummary) => void
}

const ArticleCard = memo(function ArticleCard({
  article,
  index,
  onOpen,
  onPrefetch,
}: ArticleCardProps) {
  const hasPrefetchedRef = useRef(false)

  const handlePrefetch = () => {
    if (hasPrefetchedRef.current) {
      return
    }
    hasPrefetchedRef.current = true
    onPrefetch?.(article)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen(article)
    }
  }

  return (
    <article
      className="featured-article"
      tabIndex={0}
      role="button"
      style={{ '--note-order': index } as CSSProperties}
      onClick={() => onOpen(article)}
      onKeyDown={handleKeyDown}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
    >
      <span className="featured-article__plate" aria-hidden="true" />
      {article.coverImage ? (
        <div className="featured-article__cover">
          <img
            src={resolveDisplayImage(article.coverImage)}
            alt={article.title}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}
      <div className="featured-article__content">
        <div className="featured-article__register" aria-hidden="true">
          <span className="featured-article__index">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="featured-article__track" />
          <span className="featured-article__kind">FIELD NOTE</span>
        </div>
        <h2 className="featured-article__title">{article.title}</h2>
        <div className="featured-article__tags">
          <span className="tag-pill tag-pill--primary">{article.category}</span>
          {article.tags.map((tag) => (
            <span className="tag-pill" key={tag}>
              # {tag}
            </span>
          ))}
        </div>
        <p className="featured-article__summary">{article.summary}</p>
        <div className="featured-article__meta">
          <span>{article.publishedAt}</span>
          <span>{formatNumber(article.wordCount)} 字</span>
          <span>{article.readingMinutes} 分钟</span>
          <span className="featured-article__open" aria-hidden="true">
            READ <i>↗</i>
          </span>
        </div>
      </div>
    </article>
  )
})

export default ArticleCard
