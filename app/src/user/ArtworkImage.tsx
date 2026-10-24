import { useState, type ImgHTMLAttributes } from 'react';

const FALLBACK_ARTWORK = '/artworks/artwork-placeholder.svg';

type ArtworkImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
};

export default function ArtworkImage({ src, ...props }: ArtworkImageProps) {
  const requestedSource = src || FALLBACK_ARTWORK;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const displayedSource = requestedSource === failedSource ? FALLBACK_ARTWORK : requestedSource;

  return (
    <img
      {...props}
      src={displayedSource}
      onError={() => {
        if (displayedSource !== FALLBACK_ARTWORK) setFailedSource(displayedSource);
      }}
    />
  );
}
