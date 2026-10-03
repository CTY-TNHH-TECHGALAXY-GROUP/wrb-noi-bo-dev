'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_RATING_LABELS, type RatingLabels, type RatingScale } from '@/lib/ratingScale';

type RatingScaleConfig = { scale: RatingScale; labels: RatingLabels };

// One fetch per page load; a failed fetch is retried on the next mount.
let cached: Promise<RatingScaleConfig> | null = null;
const fetchRatingScale = () => cached ??= fetch('/api/config/rating', { cache: 'no-store' })
    .then(res => res.json())
    .then(json => ({ scale: (json?.scale === 5 ? 5 : 4) as RatingScale, labels: json?.labels || DEFAULT_RATING_LABELS }))
    .catch(() => { cached = null; return { scale: 4 as RatingScale, labels: DEFAULT_RATING_LABELS }; });

/** Rating scale + labels. `loaded` is false until the admin setting arrives — do not let customers rate before that. */
export const useRatingScale = () => {
    const [state, setState] = useState<RatingScaleConfig & { loaded: boolean }>({ scale: 4, labels: DEFAULT_RATING_LABELS, loaded: false });
    useEffect(() => {
        let alive = true;
        fetchRatingScale().then(config => { if (alive) setState({ ...config, loaded: true }); });
        return () => { alive = false; };
    }, []);
    return state;
};
