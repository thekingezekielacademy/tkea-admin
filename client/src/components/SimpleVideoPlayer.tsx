import React, { useRef, useState, useEffect } from 'react';

interface SimpleVideoPlayerProps {
  videoId: string;
  title?: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

/**
 * ULTRA-SIMPLE: Basic video player for mini browser compatibility
 * No complex libraries, just native HTML5 video
 */
const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  videoId,
  title,
  poster,
  autoplay = false,
  onPlay,
  onPause,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = () => {
      setError('Failed to load video');
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onPlay, onPause, onEnded]);

  // Check if we need simple mode
  const needsSimpleMode = (window as any).__KEA_SIMPLE_BROWSER__?.needsSimpleMode || false;

  if (error) {
    return (
      <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center text-red-400">
        <div className="text-center">
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-auto"
        poster={poster}
        playsInline
        preload="metadata"
        controls
        autoPlay={autoplay && !needsSimpleMode} // Disable autoplay in mini browsers
        muted={autoplay && !needsSimpleMode} // Mute for autoplay
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block'
        }}
      >
        <source src={videoId} type="video/mp4" />
        <source src={videoId} type="video/webm" />
        <source src={videoId} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
      
      {title && (
        <div className="p-4 bg-gray-100">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
    </div>
  );
};

export default SimpleVideoPlayer;
