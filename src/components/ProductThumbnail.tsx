import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductThumbnailProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductThumbnail({ src, alt, size = 'md' }: ProductThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClass =
    size === 'sm'
      ? 'h-9 w-9 rounded-md'
      : size === 'lg'
        ? 'h-16 w-16 rounded-lg'
        : 'h-11 w-11 rounded-lg';

  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClass} shrink-0 flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-400`}
        aria-label={alt}
      >
        <Package className={iconSize} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${sizeClass} shrink-0 object-cover bg-slate-100 border border-slate-200`}
    />
  );
}
