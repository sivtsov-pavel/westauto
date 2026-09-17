import { Link } from 'react-router-dom';
import { BRAND, CONTACTS } from '@/config';
import { KeyMark } from './Icons';

export function Footer() {
  return (
    <footer className="footer" id="contacts">
      <div className="footer-cols">
        <div className="footer-col">
          <div className="logo">
            <span style={{ color: 'var(--accent)', display: 'flex' }}>
              <KeyMark size={22} />
            </span>
            <span className="logo-text">
              <b style={{ fontSize: 17 }}>{BRAND.prefix}</b>
              <em style={{ fontSize: 19 }}>{BRAND.accent}</em>
            </span>
          </div>
          <p className="muted" style={{ margin: 0, maxWidth: 280, fontSize: 14 }}>
            Автомобілі з Copart та IAAI під ключ — від ставки на аукціоні до постановки на облік
            в Україні.
          </p>
        </div>

        <div className="footer-col">
          <b>Компанія</b>
          <a href="/#how">Як це працює</a>
          <a href="/#services">Послуги</a>
          <a href="/#why">Гарантії</a>
        </div>

        <div className="footer-col">
          <b>Авто</b>
          <Link to="/auto">Вітрина авто</Link>
          <a href="/#calc">Калькулятор вартості</a>
          <a href="/app/">Вхід для співробітників</a>
        </div>

        <div className="footer-col">
          <b>Контакти</b>
          <a className="mono" href={`tel:${CONTACTS.phone.replace(/[^\d+]/g, '')}`}>
            {CONTACTS.phone}
          </a>
          <a className="mono" href={`mailto:${CONTACTS.email}`}>
            {CONTACTS.email}
          </a>
          <span>{CONTACTS.city}</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {BRAND.full}. Розрахунки орієнтовні до підтвердження лоту.
        </span>
        <span>Працюємо по всій Україні</span>
      </div>
    </footer>
  );
}
