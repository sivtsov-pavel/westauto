import { Link } from 'react-router-dom';
import { BRAND, CONTACTS, REVIEWS, VIDEOS } from '@/content/brand';
import { useI18n } from '@/i18n';
import {
  FacebookIcon,
  InstagramIcon,
  LockIcon,
  TelegramIcon,
  TikTokIcon,
  ViberIcon,
} from './Icons';

/**
 * Соцсети бренда.
 *
 * Отфильтровано по null: у одних клиентов есть все пять, у других — один
 * Instagram. Пустая иконка-заглушка выглядит как недоделанный сайт, а ссылка
 * на несуществующий аккаунт — хуже, чем её отсутствие.
 */
const SOCIALS = [
  { href: CONTACTS.telegram, label: 'Telegram', Icon: TelegramIcon },
  { href: CONTACTS.viber, label: 'Viber', Icon: ViberIcon },
  { href: CONTACTS.instagram, label: 'Instagram', Icon: InstagramIcon },
  { href: CONTACTS.facebook, label: 'Facebook', Icon: FacebookIcon },
  { href: CONTACTS.tiktok, label: 'TikTok', Icon: TikTokIcon },
].filter((social): social is typeof social & { href: string } => Boolean(social.href));

export function Footer() {
  const { t, href } = useI18n();
  const home = href('/');

  return (
    <footer className="footer" id="contacts">
      <div className="footer-inner">
        {/* Четыре колонки в ряд, а не одна под другой */}
        <div className="footer-cols">
          <div className="footer-col">
            <div className="footer-logo">
              <img
                src={BRAND.logoLight}
                alt={BRAND.name}
                width={90}
                height={60}
                className={BRAND.invertLogoLight ? 'invert' : undefined}
              />
            </div>
            <p style={{ maxWidth: 300 }}>{t('footer.about')}</p>
            <div className="footer-socials">
              {SOCIALS.map(({ href: url, label, Icon }) => (
                <a
                  key={label}
                  href={url}
                  className="social"
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col">
            <b>{t('footer.company')}</b>
            <a href={`${home}#services`.replace('//#', '/#')}>{t('nav.services')}</a>
            <a href={`${home}#steps`.replace('//#', '/#')}>{t('steps.title')}</a>
            <a href={`${home}#about`.replace('//#', '/#')}>{t('nav.about')}</a>
            {/* Якоря ведут на блоки главной, а те рисуются только при
                непустом профиле. Ссылка в никуда хуже отсутствия ссылки:
                человек жмёт и остаётся там же, решив, что сайт сломан */}
            {REVIEWS.length > 0 ? (
              <a href={`${home}#reviews`.replace('//#', '/#')}>{t('reviews.eyebrow')}</a>
            ) : null}
          </div>

          <div className="footer-col">
            <b>{t('footer.useful')}</b>
            <Link to={href('/auto')}>{t('nav.cars')}</Link>
            <Link to={href('/blog')}>{t('blog.all')}</Link>
            {VIDEOS.length > 0 ? (
              <a href={`${home}#videos`.replace('//#', '/#')}>{t('videos.eyebrow')}</a>
            ) : null}
            <a href={`${home}#lead`.replace('//#', '/#')}>{t('nav.calc')}</a>
          </div>

          <div className="footer-col">
            <b>{t('footer.contacts')}</b>
            <a className="mono" href={CONTACTS.phoneHref}>{CONTACTS.phone}</a>
            {/* Второй номер есть не у всех — например, американский для тех,
                кто звонит по лоту из США */}
            {CONTACTS.phoneAlt && CONTACTS.phoneAltHref ? (
              <a className="mono" href={CONTACTS.phoneAltHref}>{CONTACTS.phoneAlt}</a>
            ) : null}
            <a className="mono" href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a>
            <span>{t('contacts.hours')}</span>

            {/*
              Вход в систему — отдельным заметным блоком.
              Менеджер и администратор не должны искать, «где кабинет».
            */}
            <b style={{ marginTop: 18 }}>{t('portal.title')}</b>
            <div className="portal">
              <a href="/app/"><LockIcon /> {t('portal.cabinet')}</a>
              <a href="/app/settings"><LockIcon /> {t('portal.admin')}</a>
            </div>
            <span style={{ fontSize: 12.5 }}>{t('portal.note')}</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {BRAND.legalName}. {t('footer.rights')} {t('footer.disclaimer')}
          </span>
          <span>{t('footer.allUkraine')}</span>
        </div>
      </div>
    </footer>
  );
}
