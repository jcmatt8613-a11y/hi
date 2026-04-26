import type { CSSProperties } from 'react';

interface AvatarProps {
  src: string;
  size?: number;
  onClick?: () => void;
  style?: CSSProperties;
  hasStory?: boolean;
}

export default function Avatar({ src, size = 40, onClick, style, hasStory }: AvatarProps) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        border: hasStory ? '2px solid var(--accent)' : '2px solid transparent',
        padding: hasStory ? 2 : 0,
        ...style,
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          objectFit: 'cover',
          background: 'var(--bg-tertiary)',
        }}
      />
    </div>
  );
}
