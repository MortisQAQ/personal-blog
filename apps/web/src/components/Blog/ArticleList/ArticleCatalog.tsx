import ArticleCard from './ArticleCard'
import type { ArticleCatalogProps } from '../types'

const CARD_PLACEHOLDERS = ['card-1', 'card-2', 'card-3', 'card-4'] as const

export default function ArticleCatalog({
  articles,
  categories,
  tags,
  stats,
  activeCategory,
  activeTag,
  searchQuery,
  searchInputRef,
  visibleArticles,
  onSearchChange,
  onCategoryChange,
  onTagChange,
  onOpenArticle,
  onPrefetchArticle,
}: ArticleCatalogProps) {
  return (
    <main className="blog-main">
      <div className="blog-main__toolbar">
        <div className="blog-main__title">
          <span className="blog-main__eyebrow">
            <span className="blog-main__eyebrow-mark" aria-hidden="true" />
            KNOWLEDGE BASE
          </span>
          <h2>文章与思考</h2>
        </div>
        <label className="blog-search">
          <span className="sr-only">搜索文章</span>
          <span className="blog-search__glyph" aria-hidden="true">⌕</span>
          <input
            ref={searchInputRef}
            value={searchQuery}
            type="search"
            placeholder="搜索标题、摘要或标签"
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {searchQuery ? (
            <button
              type="button"
              aria-label="清空搜索"
              title="清空搜索"
              onClick={() => onSearchChange('')}
            >
              ×
            </button>
          ) : null}
        </label>
      </div>

      <nav className="blog-categories" aria-label="文章分类">
        <button
          className={`category-btn ${activeCategory === null ? 'is-active' : ''}`}
          type="button"
          onClick={() => onCategoryChange(null)}
        >
          归档
          {stats ? <span className="category-count">{stats.articleCount}</span> : null}
        </button>
        {categories.map((category) => (
          <button
            className={`category-btn ${activeCategory === category.name ? 'is-active' : ''}`}
            type="button"
            key={category.name}
            onClick={() => onCategoryChange(category.name)}
          >
            {category.name}
            <span className="category-count">{category.count}</span>
          </button>
        ))}
      </nav>

      <div className="blog-tag-filters" aria-label="文章标签">
        <span>标签</span>
        <button
          className={activeTag === null ? 'is-active' : ''}
          type="button"
          onClick={() => onTagChange(null)}
        >
          全部
        </button>
        {tags.slice(0, 10).map((tag) => (
          <button
            className={activeTag === tag.name ? 'is-active' : ''}
            type="button"
            key={tag.name}
            onClick={() => onTagChange(tag.name)}
          >
            #{tag.name}
            <small>{tag.count}</small>
          </button>
        ))}
      </div>

      <p className="blog-results-status" aria-live="polite">
        {articles && (searchQuery || activeCategory || activeTag)
          ? `当前显示 ${visibleArticles.length} 篇文章`
          : null}
      </p>

      {articles === null ? (
        <div className="blog-article-grid" aria-hidden="true">
          {CARD_PLACEHOLDERS.map((key) => (
            <div className="blog-card blog-card--skeleton" key={key}>
              <span className="blog-skeleton-bar blog-skeleton-bar--title" />
              <span className="blog-skeleton-bar" />
              <span className="blog-skeleton-bar blog-skeleton-bar--short" />
              <span className="blog-skeleton-bar blog-skeleton-bar--meta" />
            </div>
          ))}
        </div>
      ) : visibleArticles.length > 0 ? (
        <div className="blog-article-grid">
          {visibleArticles.map((article, index) => (
            <ArticleCard
              key={article.slug}
              article={article}
              index={index}
              onOpen={onOpenArticle}
              onPrefetch={onPrefetchArticle}
            />
          ))}
        </div>
      ) : (
        <p className="blog-empty-state">
          {searchQuery && visibleArticles.length === 0
            ? `没有找到包含“${searchQuery}”的文章`
            : '没有匹配的文章'}
        </p>
      )}
    </main>
  )
}
