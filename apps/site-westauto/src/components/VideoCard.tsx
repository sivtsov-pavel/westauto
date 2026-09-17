import { useState } from 'react';
import { useI18n } from '@/i18n';
import { PlayIcon } from './Icons';
import type { DictKey } from '@/content/dict';

/**
 * Видео с YouTube.
 *
 * Пока не нажали «play», показывается обложка и наша кнопка — iframe
 * не грузится. Шесть встроенных плееров на странице тянут мегабайты чужих
 * скриптов и ставят куки ещё до того, как человек решил смотреть.
 */
export function VideoCard({ id, titleKey }: { id: string; titleKey: string }) {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(false);
  const title = t(titleKey as DictKey);

  return (
    <div className="video">
      <div className="video-frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              width={480}
              height={360}
            />
            <button
              type="button"
              className="video-play"
              onClick={() => setPlaying(true)}
              aria-label={`${t('videos.play')}: ${title}`}
            >
              <span><PlayIcon /></span>
            </button>
          </>
        )}
      </div>
      <div className="video-caption">{title}</div>
    </div>
  );
}
