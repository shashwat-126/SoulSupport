'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { getSeededFallbackUrls } from '@/lib/seededImage';
import { getDefaultAvatarPath } from '@/lib/avatar';

export function SeededImage({
  seed = '',
  category = 'wellness',
  alt = 'image',
  src,
  className,
  onError,
  ...props
}) {
  const fallbackChain = useMemo(() => {
    const urls = getSeededFallbackUrls(seed, category);
    if (category === 'avatar') {
      urls.push(getDefaultAvatarPath(seed));
      urls.push(getDefaultAvatarPath(`${seed}-alt`));
    }
    return src ? [src, ...urls] : urls;
  }, [seed, category, src]);

  const [index, setIndex] = useState(0);
  const currentSrc = fallbackChain[Math.min(index, fallbackChain.length - 1)];

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={(event) => {
        setIndex((prev) => (prev < fallbackChain.length - 1 ? prev + 1 : prev));
        if (typeof onError === 'function') {
          onError(event);
        }
      }}
    />
  );
}
