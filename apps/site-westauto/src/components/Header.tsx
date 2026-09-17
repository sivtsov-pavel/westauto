import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LOCALES, LOCALE_LABELS, localeFromPath, pathForLocale } from '@avtoklyuch/shared';
import { BRAND } from '@/content/brand';
import { useI18n } from '@/i18n';
import { CloseIcon, MenuIcon } from './Icons';

const NAV = [
  { path: '/', key: 'nav.home' },
  { path: '/auto', key: 'nav.cars' },
  { path: '/#services', key: 'nav.services' },
  { path: '/blog', key: 'nav.blog' },
  { path: '/#contacts', key: 'nav.contacts' },
] as const;

export function Header() {
  const { t, href, locale } = useI18n();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Тот же путь на другом языке — чтобы переключение не выбрасывало на главную
  const { rest } = localeFromPath(pathname);

  return (
    <header className="header">
      <div className="header-inner">
        <Link to={href('/')} className="logo" aria-label={BRAND.name}>
          <img src={BRAND.logo} alt={BRAND.name} width={210} height={42} />
        </Link>

        <nav className={`nav ${open ? 'open' : ''}`} aria-label={t('nav.menu')}>
          {NAV.map((item) => {
            const target = item.path.startsWith('/#')
              ? `${href('/')}${item.path.slice(1)}`.replace('//#', '/#')
              : href(item.path);
            const active = !item.path.includes('#') && rest === item.path;
            return (
              <Link
                key={item.key}
                to={target}
                className={active ? 'active' : undefined}
                onClick={() => setOpen(false)}
              >
                {t(item.key)}
              </Link>
            );
          })}

          {/* На найвужчих екранах перемикач мов не влазить у шапку —
              показуємо його всередині відкритого меню */}
          <div className="lang lang-inline" role="group" aria-label="Language">
            {LOCALES.map((code) => (
              <a
                key={code}
                href={pathForLocale(rest, code)}
                aria-current={code === locale}
                hrefLang={code}
              >
                {LOCALE_LABELS[code]}
              </a>
            ))}
          </div>
        </nav>

        <div className="header-actions">
          {/* Переключатель языка: три версии, текущая подсвечена */}
          <div className="lang" role="group" aria-label="Language">
            {LOCALES.map((code) => (
              <a
                key={code}
                href={pathForLocale(rest, code)}
                aria-current={code === locale}
                hrefLang={code}
              >
                {LOCALE_LABELS[code]}
              </a>
            ))}
          </div>

          <a className="btn btn-red btn-sm" href={`${href('/')}#calculator`.replace('//#', '/#')}>
            {t('nav.calc')}
          </a>

          <button
            type="button"
            className="burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={t('nav.menu')}
          >
            {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
