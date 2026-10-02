import { NavLink } from 'react-router-dom';
import { useAuth } from '@/state/auth';
import { can, ROLE_LABELS, type Permissions, type Role } from '@avtoklyuch/shared';
import { useBrand } from '@/state/brand';
import { BrandMarkIcon, BrandName } from './Brand';
import { BookIcon, CalcIcon, CarIcon, ChartIcon, ClockIcon, EyeIcon, GearIcon, ListIcon, UsersIcon, WalletIcon } from './Icons';
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
  { to: '/', label: 'Сводка', icon: ChartIcon, end: true },
  { to: '/calc', label: 'Расчёт', icon: CalcIcon },
  { to: '/cabinet', label: 'Мой кабинет', icon: WalletIcon, roles: ['agent'] },
  { to: '/history', label: 'История', icon: ClockIcon },
  { to: '/leads', label: 'Заявки', icon: UsersIcon },
  { to: '/clients', label: 'Клиенты', icon: UsersIcon },
  { to: '/deals', label: 'Сделки', icon: CarIcon },
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
  // Имя в шапке — то же, что на экране входа: оно приходит из бренда
  // экземпляра, а не зашито в вёрстку
  const brand = useBrand();
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
          {brand && (
            <span style={{ color: 'var(--accent)', display: 'flex' }}>
              <BrandMarkIcon brand={brand} />
            </span>
          )}
          <BrandName brand={brand} />
        </div>

        <nav className="nav">
          {NAV.filter((item) => {
            if (item.roles && !item.roles.includes(user.role)) return false;
            if (item.needs && !can(user.role, item.needs)) return false;
            return true;
          }).map(({ to, label, icon: Icon, end }) => (
            // data-tour: запасная цель для тура, когда на странице
            // подсвечивать нечего — список пуст на свежем экземпляре.
            // Атрибут ставится из того же списка, что и сам пункт, поэтому
            // он есть ровно у разделов, доступных этой роли (components/Tour.tsx)
            <NavLink key={to} to={to} end={end} data-tour={`nav:${to}`}>
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
