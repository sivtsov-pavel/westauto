import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from '@/components/Icons';
import { LeadForm } from '@/components/LeadForm';
import { findArticle, type Block } from '@/content/articles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useI18n } from '@/i18n';

export function Article() {
  const { t, href, locale, tag } = useI18n();
  const { slug } = useParams<{ slug: string }>();
  const article = findArticle(slug ?? '');

  useDocumentTitle(article ? `${article.title[locale]} — WestAuto` : `${t('blog.notFound')} — WestAuto`);

  if (!article) {
    return (
      <div className="empty-state">
        <h1 className="display h2" style={{ marginBottom: 16 }}>{t('blog.notFound')}</h1>
        <Link className="btn btn-outline btn-sm" to={href('/blog')}>
          {t('blog.back')} <ArrowRight />
        </Link>
      </div>
    );
  }

  return (
    <>
      <article className="section">
        <div className="wrap">
          <Link to={href('/blog')} className="muted" style={{ fontSize: 14.5, display: 'inline-block', marginBottom: 26 }}>
            ← {t('blog.back')}
          </Link>

          <div className="stack" style={{ gap: 14, maxWidth: 760, marginBottom: 36 }}>
            <div className="article-meta">
              {new Date(article.date).toLocaleDateString(tag, {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </div>
            <h1 className="display h1">{article.title[locale]}</h1>
            <p className="lead" style={{ fontSize: 19 }}>{article.excerpt[locale]}</p>
          </div>

          <div className="prose">
            {article.blocks.map((block, index) => renderBlock(block, index, locale))}
          </div>
        </div>
      </article>

      <section className="section section-navy">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="stack" style={{ gap: 18, textAlign: 'center', alignItems: 'center' }}>
            <h2 className="display h2">{t('lead.title')}</h2>
            <p className="lead" style={{ color: '#9fb2c0', maxWidth: 580 }}>{t('lead.lead')}</p>
            <div style={{ width: '100%', marginTop: 8 }}>
              <LeadForm source={`article:${article.slug}`} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function renderBlock(block: Block, index: number, locale: 'uk' | 'ru' | 'en') {
  switch (block.t) {
    case 'h2':
      return <h2 key={index}>{block.v[locale]}</h2>;
    case 'h3':
      return <h3 key={index}>{block.v[locale]}</h3>;
    case 'p':
      return <p key={index}>{block.v[locale]}</p>;
    case 'ul':
      return (
        <ul key={index}>
          {block.v[locale].map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case 'ol':
      return (
        <ol key={index}>
          {block.v[locale].map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      );
    case 'quote':
      return <blockquote key={index}><strong>{block.v[locale]}</strong></blockquote>;
    default:
      return null;
  }
}
