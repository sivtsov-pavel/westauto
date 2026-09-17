import { NavLink } from 'react-router-dom';
import { useAuth } from '@/state/auth';
import { can, ROLE_LABELS, type Permissions, type Role } from '@avtoklyuch/shared';
import { BookIcon, CalcIcon, CarIcon, ClockIcon, EyeIcon, GearIcon, KeyMark, ListIcon, UsersIcon, WalletIcon } from './Icons';
import { InstallButton } from './InstallButton';

/**
 * Пункты меню с правом, которое их открывает.
 *
 * Скрывать раздел, в который человек всё равно получит 403, — это не
 * безопасность, а вежливость: агенту незачем видеть вкладку «Тарифы» и
 * гадать, почему она не открывается. Настоящая защита — на сервере.
 */
const NAV: {
  to: string;
  label: string;
  icon: typeof CalcIcon;
  end?: boolean;
  needs?: keyof Permissions;
  roles?: Role[];
}[] = [
  { to: '/', label: 'Расчёт', icon: CalcIcon, end: true },
  { to: '/cabinet', label: 'Мой кабинет', icon: WalletIcon, roles: ['agent'] },
  { to: '/history', label: 'История', icon: ClockIcon },
  { to: '/leads', label: 'Клиенты', icon: UsersIcon, roles: ['agent'] },
  { to: '/watchlist', label: 'Наблюдение', icon: EyeIcon, needs: 'useWatchlist' },
  { to: '/showcase', label: 'Витрина', icon: CarIcon, needs: 'manageShowcase' },
  { to: '/agents', label: 'Агенты', icon: UsersIcon, needs: 'manageSettings' },
  { to: '/tariffs', label: 'Тарифы', icon: ListIcon, needs: 'viewTariffs' },
  { to: '/settings', label: 'Настройки', icon: GearIcon, needs: 'viewInternals' },
  { to: '/docs', label: 'Документация', icon: BookIcon },
];

const HOTKEYS = [
  ['Поиск лота', '⌘K'],
  ['Сохранить', '⌘S'],
  ['Копировать итог', '⌘⇧C'],
];

export function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const discount = user.deliveryDiscountPercent;
  const roleLine =
    user.role === 'manager' && discount !== 0
      ? `${ROLE_LABELS[user.role]} · ${discount > 0 ? '−' : '+'}${Math.abs(discount)}%`
      : ROLE_LABELS[user.role];

  return (
    <aside className="sidebar">
      <div className="stack" style={{ gap: 28 }}>
        <div className="brand">
          <span style={{ color: 'var(--accent)', display: 'flex' }}>
            <KeyMark />
          </span>
          Авто<em>Ключ</em>
        </div>

        <nav className="nav">
          {NAV.filter((item) => {
            if (item.roles && !item.roles.includes(user.role)) return false;
            if (item.needs && !can(user.role, item.needs)) return false;
            return true;
          }).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <InstallButton />

        {user.role !== 'agent' && <div className="hotkeys">
          <div className="faint" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Горячие клавиши
          </div>
          {HOTKEYS.map(([label, key]) => (
            <div className="row" key={key}>
              <span>{label}</span>
              <kbd>{key}</kbd>
            </div>
          ))}
        </div>}
      </div>

      <button
        type="button"
        className="user-chip"
        onClick={() => void logout()}
        title="Выйти из системы"
      >
        <span className="avatar">{initials}</span>
        <span className="stack" style={{ gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.fullName}
          </span>
          <span className="muted" style={{ fontSize: 11.5 }}>{roleLine}</span>
        </span>
      </button>
    </aside>
  );
}
