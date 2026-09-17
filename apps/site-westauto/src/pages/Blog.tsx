import { Link } from 'react-router-dom';
import { ArrowRight } from '@/components/Icons';
import { ARTICLES } from '@/content/articles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useI18n } from '@/i18n';

export function Blog() {
  const { t, href, locale, tag } = useI18n();
  useDocumentTitle(`${t('blog.title')} — WestAuto`);

  return (
    <section className="section">
      <div className="wrap">
        <div className="stack" style={{ gap: 16, maxWidth: 720, marginBottom: 'clamp(32px, 4vw, 56px)' }}>
          <div className="eyebrow">{t('blog.eyebrow')}</div>
          <h1 className="display h1 rule">{t('blog.title')}</h1>
          <p className="lead">{t('blog.lead')}</p>
        </div>

        <div className="articles">
          {ARTICLES.map((article) => (
            <Link key={article.slug} to={href(`/blog/${article.slug}`)} className="article-card">
              <div className="article-meta">
                {new Date(article.date).toLocaleDateString(tag, {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </div>
              <h2 className="display" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>
                {article.title[locale]}
              </h2>
              <p className="muted" style={{ fontSize: 14.5 }}>{article.excerpt[locale]}</p>
              <span className="article-more">{t('blog.readMore')} <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
