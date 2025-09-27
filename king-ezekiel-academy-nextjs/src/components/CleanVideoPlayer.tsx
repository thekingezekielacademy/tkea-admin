// CleanVideoPlayer.tsx - Custom Tutor LMS Style Video Player
import React, { useEffect, useRef, useState } from "react";

type Props = {
  videoId: string; // either YouTube video id (e.g. 'dQw4w9WgXcQ') or a direct file URL (ends with .mp4)
  title?: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
};

declare global {
  interface Window { YT: any; }
}

export default function CleanVideoPlayer({
  videoId,
  title,
  poster,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const isFile = /^https?:\/\/.*\.(mp4|webm|ogg)$/i.test(videoId);

  useEffect(() => {
    if (isFile) return; // no YT API for file playback
    
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // load YT script
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = () => initPlayer();
    }
    
    // cleanup
    return () => {
      if (playerRef.current) {
        if ((playerRef.current as any)._brandingInterval) {
          clearInterval((playerRef.current as any)._brandingInterval);
        }
        if (playerRef.current.destroy) {
          playerRef.current.destroy();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  function initPlayer() {
    if (!containerRef.current) return;
    
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        modestbranding: 1,    // Minimal branding
        rel: 0,               // No related videos
        controls: 0,          // Hide ALL native controls
        iv_load_policy: 3,    // Hide annotations
        playsinline: 1,       // Play inline on mobile
        disablekb: 1,         // Disable keyboard controls (we handle them)
        fs: 0,                // Disable fullscreen button
        showinfo: 0,          // Hide video info
        cc_load_policy: 0,    // Hide closed captions
        autoplay: autoplay ? 1 : 0,
      },
      events: {
        onReady: (e: any) => {
          const dur = e.target.getDuration();
          setDuration(dur || 0);
          setVolume(e.target.getVolume());
          
          // Mark player as ready
          (e.target as any)._isReady = true;
          setIsPlayerReady(true);
          
          // Hide YouTube branding elements
          hideYouTubeBranding();
          
          if (autoplay) {
            e.target.playVideo();
          }
        },
        onStateChange: (e: any) => {
          const state = e.data;
          // YouTube states: -1 unstarted, 0 ended, 1 playing, 2 paused
          if (state === 1) {
            setPlaying(true);
            onPlay?.();
            // Re-hide branding when playing
            setTimeout(hideYouTubeBranding, 100);
            // Continuous monitoring to hide branding - reduced frequency
            const brandingInterval = setInterval(hideYouTubeBranding, 2000);
            (playerRef.current as any)._brandingInterval = brandingInterval;
          } else if (state === 2) {
            setPlaying(false);
            onPause?.();
            // Clear branding interval when paused
            if ((playerRef.current as any)._brandingInterval) {
              clearInterval((playerRef.current as any)._brandingInterval);
            }
          } else if (state === 0) {
            setPlaying(false);
            onEnded?.();
            // Clear branding interval when ended
            if ((playerRef.current as any)._brandingInterval) {
              clearInterval((playerRef.current as any)._brandingInterval);
            }
          }
        },
      },
    });
    
    // Track time updates - reduced frequency for better performance
    const timeInterval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrent(playerRef.current.getCurrentTime());
      }
    }, 1000);
    
    // Store interval for cleanup
    (playerRef.current as any)._timeInterval = timeInterval;
  }

  // Hide YouTube branding elements
  const hideYouTubeBranding = () => {
    if (!containerRef.current || !document.contains(containerRef.current)) return;
    
    const iframe = containerRef.current.querySelector('iframe');
    if (!iframe) return;
    
    // Add CSS to hide YouTube elements
    const style = document.createElement('style');
    style.id = 'youtube-branding-hide';
    style.textContent = `
      /* Hide YouTube branding completely */
      iframe[src*="youtube.com"] {
        filter: brightness(1.1) contrast(1.1);
      }
      
      /* Overlay to hide YouTube elements */
      iframe[src*="youtube.com"]::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        pointer-events: none;
        z-index: 9999;
      }
      
      /* Additional YouTube branding hiding */
      .ytp-chrome-top,
      .ytp-chrome-bottom,
      .ytp-pause-overlay,
      .ytp-watermark,
      .ytp-show-cards-title,
      .ytp-title,
      .ytp-youtube-button,
      .ytp-button.ytp-youtube-button,
      .ytp-button.ytp-logo,
      .ytp-logo,
      .ytp-pause-overlay .ytp-button,
      .ytp-pause-overlay .ytp-text {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      
      /* Hide video suggestions and related content */
      .ytp-pause-overlay,
      .ytp-pause-overlay .ytp-text,
      .ytp-pause-overlay .ytp-button {
        display: none !important;
      }
    `;
    
    // Remove existing style if present
    const existingStyle = document.getElementById('youtube-branding-hide');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
    
    // Also try to hide elements directly in the iframe
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const elementsToHide = iframeDoc.querySelectorAll('.ytp-chrome-top, .ytp-chrome-bottom, .ytp-pause-overlay, .ytp-watermark, .ytp-show-cards-title, .ytp-title, .ytp-youtube-button, .ytp-button.ytp-youtube-button, .ytp-button.ytp-logo, .ytp-logo');
        elementsToHide.forEach(el => {
          (el as HTMLElement).style.display = 'none';
          (el as HTMLElement).style.opacity = '0';
          (el as HTMLElement).style.visibility = 'hidden';
        });
      }
    } catch (e) {
      // Cross-origin restrictions may prevent this
      console.log('YouTube branding hiding applied via CSS');
    }
  };

  // HTML5 file player refs & handlers
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        // Clear all intervals
        if ((playerRef.current as any)._timeInterval) {
          clearInterval((playerRef.current as any)._timeInterval);
        }
        if ((playerRef.current as any)._brandingInterval) {
          clearInterval((playerRef.current as any)._brandingInterval);
        }
        
        // Destroy player safely
        if (playerRef.current.destroy) {
          try {
            playerRef.current.destroy();
          } catch (error) {
            console.error('Error destroying player:', error);
          }
        }
      }
    };
  }, []);

  const togglePlay = () => {
    if (isFile) {
      if (videoElRef.current && document.contains(videoElRef.current)) {
        const vid = videoElRef.current;
        if (vid.paused) {
          vid.play().catch(error => {
            console.error('Failed to play video:', error);
          });
          setPlaying(true);
          onPlay?.();
        } else {
          vid.pause();
          setPlaying(false);
          onPause?.();
        }
      }
      return;
    }
    
    const p = playerRef.current;
    if (!p || !p.getPlayerState || !isPlayerReady) return; // Check if player is ready
    
    // Check if container is still connected to DOM
    if (!containerRef.current || !document.contains(containerRef.current)) return;
    
    try {
      const state = p.getPlayerState();
      if (state === 1) {
        p.pauseVideo();
      } else {
        p.playVideo();
        // Re-hide branding after a short delay
        setTimeout(hideYouTubeBranding, 100);
        // Continuous monitoring to hide branding
            const brandingInterval = setInterval(hideYouTubeBranding, 2000);
        (playerRef.current as any)._brandingInterval = brandingInterval;
      }
    } catch (error) {
      console.log('Player not ready yet, waiting...');
      // If player isn't ready, wait a bit and try again
      setTimeout(() => togglePlay(), 500);
    }
  };

  const seek = (seconds: number) => {
    if (isFile) {
      if (videoElRef.current && document.contains(videoElRef.current)) {
        videoElRef.current.currentTime = seconds;
        setCurrent(seconds);
      }
      return;
    }
    if (playerRef.current && isPlayerReady && containerRef.current && document.contains(containerRef.current)) {
      try {
        playerRef.current.seekTo(seconds, true);
        setCurrent(seconds);
      } catch (error) {
        console.error('Seek failed:', error);
      }
    }
  };

  const onVolumeChange = (v: number) => {
    setVolume(v);
    if (isFile) {
      if (videoElRef.current && document.contains(videoElRef.current)) {
        videoElRef.current.volume = v / 100;
      }
    } else {
      if (playerRef.current && isPlayerReady && containerRef.current && document.contains(containerRef.current)) {
        try {
          playerRef.current.setVolume(v);
        } catch (error) {
          console.error('Volume change failed:', error);
        }
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    // Check if element is still connected to DOM
    if (!document.contains(containerRef.current)) return;
    
    const el = containerRef.current.parentElement || containerRef.current;
    
    // Check if the target element is connected
    if (!document.contains(el)) return;
    
    try {
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) {
          el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          (el as any).webkitRequestFullscreen();
        } else if ((el as any).msRequestFullscreen) {
          (el as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
      // Don't show error to user, just log it
    }
  };

  const format = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleMouseEnter = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setTimeout(() => setShowControls(false), 2000);
    }
  };

  return (
    <div 
      className="relative w-full bg-black text-white rounded-lg overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Container */}
      <div className="relative bg-black w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
        {/* YouTube Player or HTML5 Video */}
        {!isFile ? (
          <div 
            ref={containerRef} 
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1 }}
          />
        ) : (
          <video
            ref={videoElRef}
            src={videoId}
            poster={poster}
            className="absolute inset-0 w-full h-full object-cover"
            onEnded={() => { setPlaying(false); onEnded?.(); }}
            onTimeUpdate={(e) => setCurrent((e.target as HTMLVideoElement).currentTime)}
            onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
            controls={false}
          />
        )}

        {/* Custom Play Button Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
            <button
              onClick={togglePlay}
              disabled={!isFile && !isPlayerReady}
              className={`w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center transition-all duration-200 transform ${
                !isFile && !isPlayerReady 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-opacity-100 hover:scale-110'
              }`}
            >
              {!isFile && !isPlayerReady ? (
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Title Overlay */}
        {title && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black bg-opacity-70 px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium z-20 max-w-[80%] truncate">
            {title}
          </div>
        )}

        {/* Custom Controls Overlay */}
        {showControls && (isFile || isPlayerReady) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 sm:p-4 z-20">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Play/Pause Button */}
              <button 
                onClick={togglePlay}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                {isPlaying ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* Time Display */}
              <div className="text-xs sm:text-sm text-white/90 min-w-[60px] sm:min-w-[80px]">
                {format(current)} / {format(duration)}
              </div>

              {/* Progress Bar */}
              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={current}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="w-full h-1 sm:h-2 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(current / (duration || 1)) * 100}%, rgba(255,255,255,0.3) ${(current / (duration || 1)) * 100}%)`
                  }}
                />
              </div>

              {/* Volume Control - Hidden on small screens */}
              <div className="hidden sm:flex items-center gap-2">
                <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Fullscreen Button */}
              <button 
                onClick={toggleFullscreen}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for slider styling */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
}
