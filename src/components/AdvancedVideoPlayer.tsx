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
      <div className="relative w-full h-full" style={{ minHeight: '280px' }}>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${src}${autoplay ? '?autoplay=1' : ''}`}
          title={title || 'Video player'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
        
        {/* YouTube branding removal overlay - covers any remaining elements */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-black z-40 pointer-events-none"></div>
        
        {/* Additional overlay to completely cover any YouTube branding at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-black via-black to-transparent z-50 pointer-events-none"></div>
      </div>
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

