import { Link } from 'react-router-dom';
import { BRAND } from '@/config';
import { KeyMark, LockIcon } from './Icons';

const NAV = [
  { href: '/#how', label: 'Як це працює' },
  { href: '/auto', label: 'Авто в наявності' },
  { href: '/#services', label: 'Послуги' },
  { href: '/#why', label: 'Гарантії' },
  { href: '/#contacts', label: 'Контакти' },
];

export function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo" aria-label={`${BRAND.full} — на головну`}>
        <span style={{ color: 'var(--accent)', display: 'flex' }}>
          <KeyMark />
        </span>
        <span className="logo-text">
          <b>{BRAND.prefix}</b>
          <em>{BRAND.accent}</em>
        </span>
      </Link>

      <nav aria-label="Основна навігація">
        {NAV.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="row" style={{ gap: 12 }}>
        {/*
          Вхід до внутрішнього застосунку. Навмисно скромний: це інструмент
          для співробітників, а не пропозиція для відвідувача сайту.
        */}
        <a className="staff-link" href="/app/" title="Калькулятор для менеджерів">
          <LockIcon /> Вхід для співробітників
        </a>
        <a className="btn btn-accent btn-sm" href="/#calc">
          Розрахувати вартість
        </a>
      </div>
    </header>
  );
}
