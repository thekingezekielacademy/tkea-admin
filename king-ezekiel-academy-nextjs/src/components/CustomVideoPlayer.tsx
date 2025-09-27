import React, { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

interface CustomVideoPlayerProps {
  videoId: string; // YouTube video ID or direct video URL
  title?: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  videoId,
  title,
  poster,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate
}) => {
  console.log('CustomVideoPlayer render:', { videoId, title });
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize Plyr player
    const player = new Plyr(videoRef.current, {
      controls: [
        'play-large', // The large play button in the center
        'play', // Play/pause playback
        'progress', // The progress bar and scrubber for playback and buffering
        'current-time', // The current time of playback
        'duration', // The full duration of the media
        'mute', // Toggle mute
        'volume', // Volume control
        'captions', // Toggle captions
        'settings', // Settings menu
        'pip', // Picture-in-picture
        'airplay', // Airplay (currently Safari only)
        'fullscreen' // Toggle fullscreen
      ],
      autoplay,
      muted: autoplay, // Mute autoplay videos
      resetOnEnd: true,
      keyboard: { focused: true, global: true },
      tooltips: { controls: true, seek: true },
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      quality: { default: 720, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240] }
    });

    // Store player reference
    playerRef.current = player;

    // Add custom CSS for branding
    const style = document.createElement('style');
    style.id = 'plyr-custom-styling';
    style.textContent = `
      .plyr--video {
        --plyr-color-main: #6366f1 !important;
        --plyr-video-background: #000 !important;
        --plyr-video-control-color: #fff !important;
        --plyr-video-control-background-hover: rgba(99, 102, 241, 0.8) !important;
        --plyr-video-control-background: rgba(0, 0, 0, 0.6) !important;
        --plyr-video-control-color-hover: #fff !important;
        --plyr-video-control-border-radius: 8px !important;
        --plyr-video-control-spacing: 8px !important;
        --plyr-video-control-padding: 8px !important;
      }
      
      .plyr--video .plyr__control {
        border-radius: 8px !important;
        transition: all 0.2s ease !important;
      }
      
      .plyr--video .plyr__control:hover {
        background: var(--plyr-video-control-background-hover) !important;
        transform: scale(1.05) !important;
      }
      
      .plyr--video .plyr__progress__played {
        background: var(--plyr-color-main) !important;
      }
      
      .plyr--video .plyr__volume__display {
        background: var(--plyr-color-main) !important;
      }
      
      .plyr--video .plyr__menu__container {
        background: rgba(0, 0, 0, 0.9) !important;
        border-radius: 8px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }
      
      .plyr--video .plyr__menu__container .plyr__control {
        color: #fff !important;
      }
      
      .plyr--video .plyr__menu__container .plyr__control:hover {
        background: var(--plyr-video-control-background-hover) !important;
      }
    `;
    
    // Remove existing style if present
    const existingStyle = document.getElementById('plyr-custom-styling');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);

    // Event listeners
    player.on('ready', () => {
      setIsLoading(false);
      setError(null);
    });

    player.on('play', () => {
      onPlay?.();
    });

    player.on('pause', () => {
      onPause?.();
    });

    player.on('ended', () => {
      onEnded?.();
    });

    player.on('timeupdate', () => {
      onTimeUpdate?.(player.currentTime);
    });

    player.on('error', (event) => {
      console.error('Video player error:', event);
      setError('Failed to load video');
    });

    // Cleanup function
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      
      // Remove custom styles
      const customStyle = document.getElementById('plyr-custom-styling');
      if (customStyle) {
        customStyle.remove();
      }
    };
  }, [videoId, autoplay, poster, onPlay, onPause, onEnded, onTimeUpdate]);

  // Handle direct video files
  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      {error ? (
        <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center text-red-400">
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full"
            poster={poster}
            playsInline
            preload="metadata"
          >
            <source src={videoId} type="video/mp4" />
            <source src={videoId} type="video/webm" />
            <source src={videoId} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomVideoPlayer;
