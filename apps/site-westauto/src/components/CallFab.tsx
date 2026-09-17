import { CONTACTS } from '@/content/brand';
import { useI18n } from '@/i18n';
import { PhoneIcon } from './Icons';

/**
 * Плаваюча кнопка дзвінка на телефоні.
 *
 * На мобільному головна дія — подзвонити, і шукати номер у підвалі людина
 * не стане. На широких екранах кнопка прихована: там номер видно в шапці
 * і в підвалі без прокручування.
 */
export function CallFab() {
  const { t } = useI18n();
  return (
    <a className="call-fab" href={CONTACTS.phoneHref} aria-label={t('contacts.title')}>
      <PhoneIcon size={18} /> {CONTACTS.phone}
    </a>
  );
}
