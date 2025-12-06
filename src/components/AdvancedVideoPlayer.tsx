import React from 'react';

interface AdvancedVideoPlayerProps {
  src: string;
  type?: 'youtube' | 'video';
  title?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({
  src,
  type = 'youtube',
  title,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
}) => {
  if (type === 'youtube') {
    return (
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${src}${autoplay ? '?autoplay=1' : ''}`}
        title={title || 'Video player'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ minHeight: '280px' }}
      />
    );
  }

  return (
    <video
      src={src}
      controls
      autoPlay={autoplay}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      style={{ width: '100%', height: '100%', minHeight: '280px' }}
    >
      Your browser does not support the video tag.
    </video>
  );
};

export default AdvancedVideoPlayer;

