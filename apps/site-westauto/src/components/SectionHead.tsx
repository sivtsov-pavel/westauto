import type { CSSProperties, ReactNode } from 'react';
import type { DictKey } from '@/content/texts';
import { useI18n } from '@/i18n';

/**
 * Заголовок секции: надзаголовок, заголовок и пояснение.
 *
 * Один компонент на все секции и на обе темы. Темы расходятся только
 * выравниванием и риской под заголовком — это целиком CSS, поэтому разметка
 * здесь общая и у классической вёрстки остаётся прежней.
 */
export function SectionHead({
  eyebrow,
  title,
  lead,
  leadStyle,
  aside,
}: {
  eyebrow: DictKey;
  title: DictKey;
  lead?: DictKey;
  leadStyle?: CSSProperties;
  aside?: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="section-head">
      <div className="stack">
        <div className="eyebrow">{t(eyebrow)}</div>
        <h2 className="display h2 rule">{t(title)}</h2>
        {lead ? <p className="lead" style={leadStyle}>{t(lead)}</p> : null}
      </div>
      {aside}
    </div>
  );
}
