import React, { useRef, useState, useEffect } from 'react';

interface SimpleVideoPlayerProps {
  src: string; // YouTube video ID or direct video URL
  type?: "youtube" | "video";
  title?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  src,
  type = "youtube",
  title,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('v=')[1]?.split('&')[0] || url;
    } else if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0] || url;
    }
    return url; // Assume it's already a video ID
  };

  useEffect(() => {
    if (type === "youtube") {
      const videoId = getYouTubeVideoId(src);
      
      // Load YouTube API if not already loaded
      if (!window.YT) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
        
        window.onYouTubeIframeAPIReady = () => {
          initializePlayer(videoId);
        };
      } else {
        initializePlayer(videoId);
      }
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [src, type, autoplay]);

  const initializePlayer = (videoId: string) => {
    if (!containerRef.current) return;

    // Clear container
    containerRef.current.innerHTML = '';

    // Create player div
    const playerDiv = document.createElement('div');
    playerDiv.id = `youtube-player-${Date.now()}`;
    containerRef.current.appendChild(playerDiv);

    // Initialize YouTube player
    playerRef.current = new window.YT.Player(playerDiv.id, {
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 0, // Hide YouTube controls
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        fs: 1,
        disablekb: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: () => {
          setIsLoading(false);
        },
        onStateChange: (event: any) => {
          if (event.data === 1) { // Playing
            setIsPlaying(true);
            onPlay?.();
          } else if (event.data === 2 || event.data === 0) { // Paused or Ended
            setIsPlaying(false);
            onPause?.();
            if (event.data === 0) {
              onEnded?.();
            }
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
          setIsLoading(false);
        }
      }
    });
  };

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  if (type !== "youtube") {
    return (
      <div className="w-full bg-black rounded-lg overflow-hidden">
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <video 
            className="absolute inset-0 w-full h-full object-cover"
            controls
            autoPlay={autoplay}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
          >
            <source src={src} type="video/mp4" />
          </video>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden relative">
      <style>{`
        .simple-video-container {
          position: relative;
          width: 100%;
          height: 0;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          overflow: hidden;
        }
        
        .simple-video-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
        }
        
        /* Hide YouTube branding */
        .simple-video-container::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 40px;
          background: black;
          z-index: 10;
          pointer-events: none;
        }
        
        .simple-video-container::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 30px;
          background: black;
          z-index: 10;
          pointer-events: none;
        }
        
        .simple-play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .simple-play-button:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: translate(-50%, -50%) scale(1.1);
        }
        
        .simple-play-button svg {
          width: 32px;
          height: 32px;
          fill: white;
          margin-left: 4px;
        }
        
        .simple-loading-spinner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: simple-spin 1s linear infinite;
          z-index: 15;
        }
        
        @keyframes simple-spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
      
      <div className="simple-video-container" ref={containerRef}>
        {isLoading && (
          <div className="simple-loading-spinner"></div>
        )}
        
        {!isPlaying && !isLoading && (
          <button className="simple-play-button" onClick={togglePlay}>
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        )}
      </div>
      
      {title && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-medium z-30">
          {title}
        </div>
      )}
    </div>
  );
};

export default SimpleVideoPlayer;
