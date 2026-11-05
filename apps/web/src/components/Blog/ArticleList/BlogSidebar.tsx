import { Bilibili, Github } from '@lobehub/icons'
import { siteProfile } from '../../../config/siteProfile'
import type { SiteProfile } from '../../../config/siteProfile'
import type {
  ArticleIndexStats,
  ArticleSummary,
} from '../../../utils/contentApi'
import { resolvePublicAsset } from '../../../utils/baseUrl'
import { formatNumber, resolveDisplayImage } from '../contentUtils'
import { QQIcon } from '../../Icons/QQIcon'

type BlogSidebarProps = {
  profile?: SiteProfile
  side: 'left' | 'right'
  stats: ArticleIndexStats | null
  spotlightArticle: ArticleSummary | null
  now: Date
  copyStatus: 'idle' | 'copied'
  onCopyEmail: () => void
  onFocusSearch: () => void
}

export default function BlogSidebar({
  profile = siteProfile,
  side,
  stats,
  spotlightArticle,
  now,
  copyStatus,
  onCopyEmail,
  onFocusSearch,
}: BlogSidebarProps) {
  const profileSummary = [profile.handle, profile.role]
    .filter((value): value is string => Boolean(value))
    .join(' / ')
  const hasSocialLinks = Boolean(
    profile.githubUrl ||
    profile.bilibiliUrl ||
    profile.email,
  )

  if (side === 'right') {
    return (
      <aside className="blog-sidebar blog-sidebar--right" aria-label="站点信息">
        <section className="blog-card clock-card">
          <div className="card-register" aria-hidden="true">
            <span>SYSTEM TIME</span>
            <span>03</span>
          </div>
          <div className="clock-header">
            {profile.statusMessage ? (
              <span>{profile.statusMessage}</span>
            ) : null}
            <span className="weather-icon" aria-hidden="true">
              <i />
            </span>
          </div>
          <div className="clock-time">
            <span className="time-hm">
              {new Intl.DateTimeFormat('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).format(now)}
            </span>
            <span className="time-date">
              <span className="day">
                {new Intl.DateTimeFormat('en-US', { weekday: 'long' })
                  .format(now)
                  .toUpperCase()}
              </span>
              <span className="date">
                {new Intl.DateTimeFormat('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                }).format(now)}
              </span>
            </span>
          </div>
        </section>

        {spotlightArticle?.coverImage ? (
          <section className="blog-card image-card">
            <img
              src={resolveDisplayImage(spotlightArticle.coverImage)}
              alt={spotlightArticle.title}
              loading="lazy"
              decoding="async"
            />
            <span className="image-card__frame" aria-hidden="true" />
          </section>
        ) : null}

        {stats ? (
          <section className="blog-card stats-card">
            <div className="card-register" aria-hidden="true">
              <span>ARCHIVE INDEX</span>
              <span>04</span>
            </div>
            <h3 className="card-title">
              <span className="title-bar" /> 站点统计
            </h3>
            <ul className="stats-list">
              <li><span className="stat-name">文章</span><span className="stat-val">{formatNumber(stats.articleCount)}</span></li>
              <li><span className="stat-name">分类</span><span className="stat-val">{formatNumber(stats.categoryCount)}</span></li>
              <li><span className="stat-name">标签</span><span className="stat-val">{formatNumber(stats.tagCount)}</span></li>
              <li><span className="stat-name">总字数</span><span className="stat-val">{formatNumber(stats.totalWordCount)}</span></li>
              <li><span className="stat-name">最近更新</span><span className="stat-val">{stats.latestPublishedAt}</span></li>
            </ul>
          </section>
        ) : null}
      </aside>
    )
  }

  return (
    <aside className="blog-sidebar blog-sidebar--left" aria-label="作者信息">
      <section className="blog-card profile-card">
        <div className="card-register" aria-hidden="true">
          <span>PROFILE</span>
          <span>01</span>
        </div>
        {profile.avatarPath ? (
          <div className="profile-card__avatar">
            <img
              src={resolvePublicAsset(profile.avatarPath)}
              alt={profile.name}
              loading="lazy"
              decoding="async"
            />
            <span className="profile-card__frame" aria-hidden="true" />
          </div>
        ) : null}
        <h2 className="profile-card__name">{profile.name}</h2>
        {profileSummary ? (
          <p className="profile-card__bio">{profileSummary}</p>
        ) : null}
        {hasSocialLinks ? (
          <div className="profile-card__socials">
            {profile.githubUrl ? (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub">
                <Github />
              </a>
            ) : null}
            {profile.bilibiliUrl ? (
              <a href={profile.bilibiliUrl} target="_blank" rel="noreferrer" aria-label="Bilibili">
                <Bilibili />
              </a>
            ) : null}
            {profile.email ? (
              <button
                type="button"
                onClick={onCopyEmail}
                aria-label="复制邮箱"
                title="复制邮箱"
              >
                <QQIcon />
              </button>
            ) : null}
          </div>
        ) : null}
        {profile.email ? (
          <p className="profile-card__copy-status" aria-live="polite">
            {copyStatus === 'copied' ? '邮箱已复制' : null}
          </p>
        ) : null}
        {stats ? (
          <div className="profile-card__stats">
            <div className="stat-box">
              <span className="stat-label">文章</span>
              <span className="stat-value">{formatNumber(stats.articleCount)}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">字数</span>
              <span className="stat-value">{formatNumber(stats.totalWordCount)}</span>
            </div>
          </div>
        ) : null}
      </section>

      {profile.welcome ? (
        <section className="blog-card welcome-card">
          <div className="card-register" aria-hidden="true">
            <span>WELCOME</span>
            <span>02</span>
          </div>
          <h3 className="card-title">
            <span className="title-icon" aria-hidden="true">+</span>{' '}
            {profile.welcome.title}
          </h3>
          <p className="welcome-text">{profile.welcome.message}</p>
          {profile.welcome.actionLabel ? (
            <button className="welcome-btn" type="button" onClick={onFocusSearch}>
              <span>{profile.welcome.actionLabel}</span>
              <span aria-hidden="true">↗</span>
            </button>
          ) : null}
        </section>
      ) : null}

      {profile.quote ? (
        <section className="blog-card quote-card">
          <div className="card-register" aria-hidden="true">
            <span>DAILY QUOTE</span>
            <span>05</span>
          </div>
          <h3 className="card-title">
            <span className="title-icon" aria-hidden="true">/</span>{' '}
            {profile.quote.title}
          </h3>
          <p className="quote-text">{profile.quote.text}</p>
          {profile.quote.author ? (
            <span className="quote-author">—— {profile.quote.author}</span>
          ) : null}
        </section>
      ) : null}
    </aside>
  )
}
