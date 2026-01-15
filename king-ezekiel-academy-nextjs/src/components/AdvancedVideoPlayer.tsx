'use client';
import React, { useEffect, useRef, useState } from "react";

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface AdvancedVideoPlayerProps {
  src: string; // YouTube video ID or direct video URL
  type?: "youtube" | "video";
  title?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onProgress?: (progressData: { played: number; playedSeconds: number }) => void;
}

const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({
  src,
  type = "youtube",
  title,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
  onProgress,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenMessage, setShowFullscreenMessage] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [availableSpeeds, setAvailableSpeeds] = useState<number[]>([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Load YouTube Player API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onload = () => {
        window.onYouTubeIframeAPIReady = () => {
          console.log('YouTube API loaded');
        };
      };
      document.head.appendChild(script);
    };

    if (type === 'youtube') {
      loadYouTubeAPI();
    }
  }, [type]);

  // Reset loading state when src changes
  useEffect(() => {
    setIsLoading(true);
    setShowFullscreenMessage(true);
    // Hide fullscreen message after 5 seconds
    const timer = setTimeout(() => {
      setShowFullscreenMessage(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [src]);

  // Cleanup branding interval on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current && (playerRef.current as any)._brandingInterval) {
        clearInterval((playerRef.current as any)._brandingInterval);
      }
    };
  }, []);

  // Function to hide YouTube branding and native controls
  // Function to hide YouTube branding and native controls
  const hideYouTubeBranding = () => {
    if (!containerRef.current) return;
    
    try {
      // Hide YouTube logo and branding
      const iframe = containerRef.current.querySelector('iframe[src*="youtube.com"]') as HTMLIFrameElement;
      if (iframe) {
        // Add CSS to hide YouTube elements
        iframe.style.pointerEvents = 'none';
        iframe.style.filter = 'brightness(0.8)';
        
        // Try to access iframe content and hide elements (may not work due to CORS)
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            // Hide YouTube's native play button
            const playButton = iframeDoc.querySelector('.ytp-large-play-button');
            if (playButton) {
              (playButton as HTMLElement).style.display = 'none';
            }
            
            // Hide YouTube's "Watch on YouTube" text
            const watchOnYoutube = iframeDoc.querySelector('.ytp-title');
            if (watchOnYoutube) {
              (watchOnYoutube as HTMLElement).style.display = 'none';
            }
            
            // Hide YouTube logo
            const logo = iframeDoc.querySelector('.ytp-youtube-button');
            if (logo) {
              (logo as HTMLElement).style.display = 'none';
            }
            
            // Hide any other YouTube UI elements
            const youtubeElements = iframeDoc.querySelectorAll('[class*="ytp-"]');
            youtubeElements.forEach((element) => {
              if (element instanceof HTMLElement) {
                element.style.display = 'none';
              }
            });
          }
        } catch (e) {
          // CORS error expected, continue with CSS approach
          console.log('Cannot access iframe content due to CORS, using CSS approach');
        }
      }
    } catch (error) {
      console.warn('Error hiding YouTube branding:', error);
    }
  };

  // Main YouTube player initialization
  useEffect(() => {
    if (type === "youtube") {
      const videoId = src.includes('youtube.com') || src.includes('youtu.be') 
        ? src.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1] || src
        : src;
      
      const playerDiv = document.createElement('div');
      playerDiv.id = `youtube-player-${Date.now()}`;
      playerDiv.style.position = 'absolute';
      playerDiv.style.top = '0';
      playerDiv.style.left = '0';
      playerDiv.style.width = '100%';
      playerDiv.style.height = '100%';
      playerDiv.style.zIndex = '0';
      playerDiv.style.borderRadius = '0';
      playerDiv.style.overflow = 'hidden';
      
      if (containerRef.current) {
        const wrapperDiv = containerRef.current.querySelector('.absolute.inset-0');
        if (wrapperDiv) {
          wrapperDiv.appendChild(playerDiv);
        } else {
          containerRef.current.appendChild(playerDiv);
        }
      }
      
      setIsLoading(true);
      
      const initPlayer = () => {
        if (window.YT && window.YT.Player) {
          playerRef.current = new window.YT.Player(playerDiv.id, {
            videoId: videoId,
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
              cc_load_policy: 0,
              fs: 1,
              disablekb: 1,
              playsinline: 1,
              enablejsapi: 1,
              origin: window.location.origin,
              wmode: 'opaque',
              html5: 1,
              start: 0,
              end: 0
            },
            events: {
              onReady: (event: any) => {
                setTimeout(() => {
        setIsLoading(false);
                  setIsPlayerReady(true);
                  hideYouTubeBranding();
                  
                  const brandingInterval = setInterval(() => {
                    hideYouTubeBranding();
                  }, 1000);
                  
                  (playerRef.current as any)._brandingInterval = brandingInterval;
                }, 500);
                
                if (playerRef.current && playerRef.current.getAvailablePlaybackRates) {
                  try {
                    const rates = playerRef.current.getAvailablePlaybackRates();
                    setAvailableSpeeds(rates);
                  } catch (error) {
                    console.warn('Could not get available playback rates:', error);
                  }
                }
              },
              onStateChange: (event: any) => {
                if (event.data === 1) {
        setIsPlaying(true);
        onPlay?.();
                } else if (event.data === 2 || event.data === 0) {
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
        } else {
          setTimeout(initPlayer, 100);
        }
      };
      
      initPlayer();
      
      const interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          setCurrentTime(currentTime);
          setDuration(duration);
          
          // Call progress callback if provided
          if (onProgress && duration > 0) {
            const played = currentTime / duration;
            const playedSeconds = currentTime;
            onProgress({ played, playedSeconds });
          }
        }
      }, 1000);
      
      intervalRef.current = interval;

      return () => {
        clearInterval(intervalRef.current);
        if (playerRef.current && playerRef.current.destroy) {
          playerRef.current.destroy();
        }
        const container = containerRef.current;
        if (container && playerDiv && playerDiv.parentNode === container) {
          try {
            container.removeChild(playerDiv);
          } catch (error) {
            console.warn('Could not remove player div:', error);
          }
        }
      };
    }
  }, [src, type, autoplay, onPlay, onPause, onEnded, onProgress]);

  // Reset timer when video changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [src]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const togglePlay = () => {
    // Check if player is ready
    if (!isPlayerReady || !playerRef.current) {
      console.warn('YouTube player not ready yet. Please wait for the player to load.');
      return;
    }

    // Double-check that the required methods exist
    if (typeof playerRef.current.playVideo !== 'function' || typeof playerRef.current.pauseVideo !== 'function') {
      console.warn('YouTube player methods not available. Player may still be initializing.');
      return;
    }

    // Execute play/pause with error handling
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
        onPause?.();
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
        onPlay?.();
        
        // Hide YouTube branding after starting playback
        setTimeout(() => {
          hideYouTubeBranding();
        }, 100);
      }
    } catch (error) {
      console.error('Error controlling YouTube player:', error);
      // Reset playing state on error
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    setCurrentTime(newTime);
    
    // Seek the YouTube player to the new time
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(newTime, true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // If unmuting, update the YouTube player volume
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
      if (playerRef.current && playerRef.current.unMute) {
        playerRef.current.unMute();
      }
    }
    
    // Set volume on YouTube player
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVolume * 100);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Mute/unmute the YouTube player
    if (playerRef.current) {
      if (newMutedState) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    }
  };

  const handleSeekForward = () => {
    const newTime = Math.min(currentTime + 10, duration);
    setCurrentTime(newTime);
    
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(newTime, true);
    }
  };

  const handleSeekBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    setCurrentTime(newTime);
    
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(newTime, true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
    
    // Set playback rate on YouTube player
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      try {
        playerRef.current.setPlaybackRate(speed);
        console.log(`Set playback rate to: ${speed}x`);
        
        // Check if the actual rate was set correctly
        setTimeout(() => {
          if (playerRef.current && playerRef.current.getPlaybackRate) {
            const actualRate = playerRef.current.getPlaybackRate();
            if (actualRate !== speed) {
              console.warn(`Requested ${speed}x but got ${actualRate}x - speed may not be supported`);
              setPlaybackRate(actualRate);
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error setting playback rate:', error);
      }
    }
  };

  const toggleFullscreen = () => {
    // Check if we're on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (isIOS && isSafari && videoRef.current) {
        // iOS Safari fallback - use webkitEnterFullscreen for video element
        try {
          (videoRef.current as any).webkitEnterFullscreen();
        } catch (error) {
          console.log('iOS Safari fullscreen not supported, falling back to standard API');
          // Fallback to standard API
          if (containerRef.current) {
            if (containerRef.current.requestFullscreen) {
              containerRef.current.requestFullscreen();
            } else if ((containerRef.current as any).webkitRequestFullscreen) {
              (containerRef.current as any).webkitRequestFullscreen();
            } else if ((containerRef.current as any).mozRequestFullScreen) {
              (containerRef.current as any).mozRequestFullScreen();
            } else if ((containerRef.current as any).msRequestFullscreen) {
              (containerRef.current as any).msRequestFullscreen();
            }
          }
        }
      } else {
        // Standard fullscreen API for other browsers
        if (containerRef.current) {
          if (containerRef.current.requestFullscreen) {
            containerRef.current.requestFullscreen();
          } else if ((containerRef.current as any).webkitRequestFullscreen) {
            (containerRef.current as any).webkitRequestFullscreen();
          } else if ((containerRef.current as any).mozRequestFullScreen) {
            (containerRef.current as any).mozRequestFullScreen();
          } else if ((containerRef.current as any).msRequestFullscreen) {
            (containerRef.current as any).msRequestFullscreen();
          }
        }
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
      document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Handle fullscreen change events and keyboard shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.fullscreenElement) {
        // ESC key exits fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (showSpeedMenu) {
        const target = event.target as Element;
        // Don't close if clicking on the speed menu or speed button
        if (!target.closest('.speed-menu') && !target.closest('[data-speed-control]')) {
          // Add a small delay for mobile to prevent accidental closing
              setTimeout(() => {
            setShowSpeedMenu(false);
              }, 100);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSpeedMenu]);

  if (type === "youtube") {
    return (
      <div 
        className="w-full bg-black overflow-hidden relative video-container" 
        ref={containerRef}
        style={{ 
          margin: 0, 
          padding: 0,
          position: 'relative',
          overflow: 'hidden',
          isolation: 'isolate',
          contain: 'layout style paint',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (window.innerWidth > 768) {
            hoverTimeoutRef.current = setTimeout(() => {
              setIsHovered(false);
            }, 2000);
          }
        }}
        onTouchStart={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setIsHovered(true);
        }}
        onTouchEnd={(e) => {
          if (showSpeedMenu) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          
          if (window.innerWidth <= 768) {
            setIsHovered(true);
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
          } else {
            hoverTimeoutRef.current = setTimeout(() => {
              setIsHovered(false);
            }, 2000);
          }
        }}
        onClick={(e) => {
          if (window.innerWidth <= 768) {
            e.preventDefault();
            e.stopPropagation();
            
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            
            setIsHovered(true);
          }
        }}
      >
        <div className="relative w-full" style={{ paddingTop: '56.25%', position: 'relative', overflow: 'hidden' }}>
          <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ 
            clipPath: 'inset(0)',
            contain: 'layout style paint'
          }}>
          <style>{`
            .video-container:fullscreen {
              background: #000;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .video-container:-webkit-full-screen {
              background: #000;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .video-container:-moz-full-screen {
              background: #000;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .video-container:-ms-fullscreen {
              background: #000;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            iframe[src*="youtube.com"] {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              border: none !important;
              outline: none !important;
              overflow: hidden !important;
              z-index: 1 !important;
              object-fit: contain !important;
              transform: scale(1) !important;
              transform-origin: center center !important;
            }
            
            .video-container iframe {
              border: none !important;
              outline: none !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              overflow: hidden !important;
              z-index: 1 !important;
              object-fit: contain !important;
            }
            
            .video-container {
              position: relative !important;
              overflow: hidden !important;
              width: 100% !important;
              height: 100% !important;
              max-width: 100% !important;
              max-height: 100% !important;
            }
            
            .video-container > div {
              position: relative !important;
              width: 100% !important;
              height: 100% !important;
              overflow: hidden !important;
              max-width: 100% !important;
              max-height: 100% !important;
            }
            
            .video-container * {
              max-width: 100% !important;
              max-height: 100% !important;
              box-sizing: border-box !important;
            }
            
            .video-container iframe {
              clip-path: inset(0) !important;
              clip: rect(0, auto, auto, 0) !important;
            }
            
            /* Top-right small mask to reduce YouTube logo visibility without covering controls */
            .video-container::after {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              width: 80px;
              height: 28px;
              background: black;
              z-index: 10;
              pointer-events: none;
            }
            
            /* Remove bottom-right mask so it doesn't overlap custom controls */
            .video-container::before {
              content: '';
              position: absolute;
              bottom: 0;
              right: 0;
              width: 0;
              height: 0;
              background: transparent;
              z-index: 0;
              pointer-events: none;
            }
            
            .video-container iframe[src*="youtube.com"] {
              pointer-events: none !important;
            }
            
            .video-container iframe[src*="youtube.com"]::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: black;
              z-index: 15;
              pointer-events: none;
            }
            
            .video-container iframe[src*="youtube.com"] {
              filter: brightness(0.8) !important;
            }
            
            .video-container iframe[src*="youtube.com"]::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: transparent;
              z-index: 20;
              pointer-events: none;
            }
            
            .video-container .youtube-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: transparent;
              z-index: 20;
              pointer-events: none;
            }
            
            @media (max-width: 768px) {
              .controls-overlay {
                background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%) !important;
                padding: 20px 10px 10px 10px !important;
                opacity: 1 !important;
                z-index: 50 !important;
              }
            }
            
            .controls-overlay {
              z-index: 70 !important;
              position: absolute !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              top: auto !important;
              transform: none !important;
            }
            
            /* Force controls to bottom even if parent has relative positioning */
            .video-container .controls-overlay {
              position: absolute !important;
              bottom: 0 !important;
              top: auto !important;
            }
              
              .controls-overlay button {
                min-height: 44px !important;
                min-width: 44px !important;
                padding: 8px !important;
                font-size: 16px !important;
              }
              
              .controls-overlay input[type="range"] {
                height: 8px !important;
                -webkit-appearance: none !important;
              }
              
              .controls-overlay input[type="range"]::-webkit-slider-thumb {
                height: 20px !important;
                width: 20px !important;
                -webkit-appearance: none !important;
                background: #3B82F6 !important;
                border-radius: 50% !important;
                cursor: pointer !important;
              }
            }
          `}</style>
          {/* YouTube Branding Blocker Overlay - Lower z-index */}
          <div className="absolute inset-0 z-5 pointer-events-none">
            {/* Cover any YouTube branding that might appear */}
            <div className="absolute top-0 right-0 w-20 h-8 bg-black opacity-0"></div>
            <div className="absolute bottom-0 right-0 w-32 h-6 bg-black opacity-0"></div>
          </div>

          {/* Additional YouTube UI Hider Overlay - Lower z-index */}
          <div className="youtube-overlay absolute inset-0 z-10 pointer-events-none">
            {/* Cover the center area where YouTube's play button appears */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-black opacity-0"></div>
            {/* Cover the bottom area where "Watch on YouTube" text appears - but not over controls */}
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-48 h-8 bg-black opacity-0"></div>
          </div>

          {/* Fullscreen Experience Message */}
          {showFullscreenMessage && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
              📱 Experience is better on full screen landscape mode
            </div>
          )}

          {/* Fullscreen button - Both mobile and desktop */}
          <button 
            onClick={toggleFullscreen}
            className="absolute top-16 right-4 z-[100] bg-black bg-opacity-30 text-white p-3 rounded-lg hover:bg-opacity-50 transition-all duration-200 shadow-lg border border-white border-opacity-50 backdrop-blur-sm"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            style={{ zIndex: 100 }}
          >
            {isFullscreen ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            )}
          </button>

          {/* Mobile/center play indicator - make it clickable to start playback */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 md:hidden"
               onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 if (isPlayerReady && !isPlaying && !isLoading) {
                   togglePlay();
                 }
               }}
               onTouchEnd={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 if (isPlayerReady && !isPlaying && !isLoading) {
                   togglePlay();
                 }
               }}
               role="button"
               aria-label="Play video"
               style={{ cursor: isPlayerReady && !isPlaying && !isLoading ? 'pointer' : 'default' }}>
            <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 transition-opacity duration-150"
                 style={{ opacity: isLoading ? 1 : (isPlaying ? 0 : 1), pointerEvents: isPlayerReady && !isPlaying && !isLoading ? 'auto' : 'none' }}>
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Mobile touch hint */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-40 md:hidden">
            <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-xs opacity-0 transition-opacity duration-150 pointer-events-none"
                 style={{ opacity: isLoading ? 1 : (isPlaying ? 0 : 1) }}>
              {isLoading ? 'Loading...' : 'Tap to play'}
            </div>
          </div>
          <style>
            {`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 16px;
                width: 16px;
                border-radius: 50%;
                background: #3B82F6;
                cursor: pointer;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
                border: 2px solid white;
              }
              .slider::-moz-range-thumb {
                height: 16px;
                width: 16px;
                border-radius: 50%;
                background: #3B82F6;
                cursor: pointer;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
                border: 2px solid white;
              }
              
              @media (max-width: 768px) {
                .slider::-webkit-slider-thumb {
                  height: 20px;
                  width: 20px;
                }
                .slider::-moz-range-thumb {
                  height: 20px;
                  width: 20px;
                }
                
                .controls-overlay button {
                  min-width: 44px;
                  min-height: 44px;
                  padding: 8px;
                }
                
                .controls-overlay {
                  padding: 12px 16px 8px 16px;
                }
                
                .slider {
                  height: 6px;
                  margin: 8px 0;
                }
              }
              
              @media (min-width: 1024px) {
                .controls-overlay {
                  padding: 16px 20px 12px 20px;
                }
                
                .controls-overlay button:hover {
                  transform: scale(1.1);
                  transition: transform 0.2s ease;
                }
                
                .controls-overlay button {
                  transition: all 0.2s ease;
                }
              }
              
              .speed-menu {
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              }
              
              .speed-menu button {
                white-space: nowrap;
                min-height: 36px;
                display: flex;
                align-items: center;
                justify-content: flex-start;
              }
              
              @media (max-width: 768px) {
                .speed-menu {
                  min-width: 120px !important;
                  padding: 6px !important;
                  bottom: 28px !important;
                  left: 0 !important;
                  right: auto !important;
                  max-height: none !important;
                  overflow-y: visible !important;
                  touch-action: manipulation !important;
                }
                
                .speed-menu button {
                  min-height: 44px !important;
                  padding: 12px 16px !important;
                  font-size: 14px !important;
                  touch-action: manipulation !important;
                  -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3) !important;
                  cursor: pointer !important;
                  pointer-events: auto !important;
                }
              }
              
              .speed-menu {
                position: absolute !important;
                z-index: 9999 !important;
                transform: translateY(0) !important;
                min-height: auto !important;
                max-height: 200px !important;
                overflow-y: auto !important;
              }
              
              @media (min-width: 769px) {
                .speed-menu {
                  min-width: 120px !important;
                  max-height: 180px !important;
                }
                
                .speed-menu button {
                  min-height: 28px !important;
                  padding: 4px 8px !important;
                  font-size: 11px !important;
                }
              }
            `}
          </style>
          {/* Custom title overlay */}
          {title && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-medium z-25">
              {title}
            </div>
          )}
          
          {/* Hidden video element for controls */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            playsInline
          />
          
          {/* Clickable overlay for play/pause - Below controls */}
          <div 
            className={`absolute inset-0 z-15 ${isPlayerReady ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={(e) => {
              // Only handle click if not clicking on controls
              const target = e.target as HTMLElement;
              if (!target.closest('.controls-overlay') && isPlayerReady) {
                togglePlay();
              }
            }}
            style={{ pointerEvents: isPlayerReady ? 'auto' : 'none' }}
          />
          
          {/* Custom video placeholder */}
          <div 
            className={`absolute inset-0 w-full h-full bg-black flex items-center justify-center transition-all duration-75 z-20 ${
              isLoading || !isPlayerReady ? 'opacity-100' : (isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100')
            } ${isPlayerReady ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={isPlayerReady ? togglePlay : undefined}
          >
            <div className="text-center text-white">
              <p className="text-xl md:text-2xl font-medium mb-2">{title || 'Video Player'}</p>
              <p className="text-sm text-gray-400 opacity-75">
                {isLoading ? 'Loading video...' : !isPlayerReady ? 'Initializing player...' : 'Tap anywhere to play'}
              </p>
            </div>
          </div>
          
          {/* Custom controls overlay - Above YouTube branding blocker */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent px-3 pb-2 pt-2 z-70 transition-opacity duration-300 controls-overlay ${
            isLoading ? 'opacity-100' : (isPlaying ? (window.innerWidth <= 768 ? 'opacity-100' : (isHovered ? 'opacity-100' : 'opacity-0')) : 'opacity-100')
          }`}>
            {/* Progress bar */}
            <div className="mb-0">
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${duration ? (currentTime / duration) * 100 : 0}%, #374151 ${duration ? (currentTime / duration) * 100 : 0}%, #374151 100%)`,
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }}
              />
            </div>
            
            {/* Control buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2 md:space-x-4">
                {/* Seek Backward Button */}
                <button 
                  onClick={handleSeekBackward}
                  className="hover:text-blue-400 transition-colors p-1 md:p-0"
                  title="Rewind 10s"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                  </svg>
                </button>

                <button 
                  onClick={togglePlay} 
                  disabled={!isPlayerReady || isLoading}
                  className={`hover:text-blue-400 transition-colors transition-opacity p-1 md:p-0 ${
                    isLoading || !isPlayerReady ? 'opacity-100' : (isPlaying ? (window.innerWidth <= 768 ? 'opacity-100' : (isHovered ? 'opacity-100' : 'opacity-0')) : 'opacity-100')
                  } ${!isPlayerReady ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {!isPlayerReady ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isPlaying ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Seek Forward Button */}
                <button 
                  onClick={handleSeekForward}
                  className="hover:text-blue-400 transition-colors p-1 md:p-0"
                  title="Forward 10s"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                  </svg>
                </button>
                
                {/* Speed Control Button */}
                <div className="relative">
                  <button 
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="hover:text-blue-400 transition-colors p-1 md:p-0 text-xs md:text-sm font-medium"
                    title="Playback Speed"
                    data-speed-control
                  >
                    {playbackRate}x
                  </button>
                  
                  {/* Speed Menu */}
                  {showSpeedMenu && (
                    <div 
                      className="speed-menu absolute bottom-24 left-0 bg-black bg-opacity-95 rounded-lg p-2 space-y-1 min-w-[100px] z-50 shadow-xl border border-gray-500 max-h-[200px] overflow-y-auto"
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {availableSpeeds.map((speed) => (
                        <button
                          key={speed}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSpeedChange(speed);
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSpeedChange(speed);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-xs font-medium transition-all duration-200 cursor-pointer ${
                            playbackRate === speed 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'text-gray-200 hover:bg-blue-600 hover:text-white'
                          }`}
                          style={{ 
                            pointerEvents: 'auto',
                            touchAction: 'manipulation',
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            userSelect: 'none'
                          }}
                          data-speed-control
                        >
                          {speed}x
                        </button>
                      ))}
                      {availableSpeeds.length <= 8 && (
                        <div className="text-xs text-gray-400 px-3 py-2 border-t border-gray-600 mt-1">
                          Max: {Math.max(...availableSpeeds)}x
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={toggleMute} 
                    className="hover:text-blue-400 transition-colors p-1 md:p-0"
                  >
                    {isMuted ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 0018 10a6 6 0 00-6-6 6 6 0 00-1.477 1.89L8 8.586l-2.523-2.523A6 6 0 002 10a6 6 0 006 6 6 6 0 001.477-1.89L12 11.414l1.477 1.477z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.923L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4.017-2.923a1 1 0 011.617.923z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-12 md:w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(isMuted ? 0 : volume) * 100}%, #374151 ${(isMuted ? 0 : volume) * 100}%, #374151 100%)`,
                      boxShadow: isMuted ? 'none' : '0 0 5px rgba(59, 130, 246, 0.3)'
                    }}
                  />
                </div>

              </div>
              
              <div className="flex items-center space-x-2">
                {/* Time Display */}
                <div className="text-xs md:text-sm text-gray-300 font-mono">
                  {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>
          
          {/* YouTube branding removal overlay - covers any remaining elements */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-black z-40 pointer-events-none"></div>
          
          {/* Additional overlay to completely cover any YouTube branding at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-black via-black to-transparent z-50 pointer-events-none"></div>
          </div>
        </div>
      </div>
    );
  }

  // For direct video files
  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          playsInline
          controls
        >
          <source src={src} type="video/mp4" />
        </video>
        
        {title && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-medium z-10">
            {title}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedVideoPlayer;
