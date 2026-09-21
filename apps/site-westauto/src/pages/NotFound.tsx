import { Link } from 'react-router-dom';
import { ArrowRight } from '@/components/Icons';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useI18n } from '@/i18n';

/**
 * Страница несуществующего адреса.
 *
 * Сюда попадают в основном по старым ссылкам на прежний сайт компании:
 * домен переехал, адреса остались в поиске и в чужих статьях. Поэтому здесь
 * не только «страницы нет», но и два пути дальше — витрина и главная.
 */
export function NotFound() {
  const { t, href } = useI18n();
  useDocumentTitle(`${t('notFound.title')} — WestAuto`);

  return (
    <div className="empty-state">
      <h1 className="display h2" style={{ marginBottom: 16 }}>{t('notFound.title')}</h1>
      <p style={{ marginBottom: 26 }}>{t('notFound.text')}</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link className="btn btn-red btn-sm" to={href('/auto')}>
          {t('notFound.cars')} <ArrowRight />
        </Link>
        <Link className="btn btn-outline btn-sm" to={href('/')}>
          {t('notFound.home')}
        </Link>
      </div>
    </div>
  );
}
