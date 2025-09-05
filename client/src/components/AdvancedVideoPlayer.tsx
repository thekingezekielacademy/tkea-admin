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
}

const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({
  src,
  type = "youtube",
  title,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
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
        return Promise.resolve();
      }
      
      return new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.onload = () => {
          window.onYouTubeIframeAPIReady = () => {
            resolve();
          };
        };
        document.head.appendChild(script);
      });
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


  useEffect(() => {
    if (type === "youtube") {
      // Create a sophisticated YouTube bypass system
      
      // Set up video source using YouTube's direct stream URL
      const videoId = src.includes('youtube.com') || src.includes('youtu.be') 
        ? src.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1] || src
        : src;
      

      
      // Create a div for the YouTube player
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
      
      // Add player div to container
      if (containerRef.current) {
        containerRef.current.appendChild(playerDiv);
      }
      
      // Set loading state
      setIsLoading(true);
      
      // Initialize YouTube Player
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
              fs: 0,
              disablekb: 1,
              playsinline: 1,
              origin: 'https://www.youtube.com',
              enablejsapi: 1,
              // Additional parameters for complete discretion
              start: 0,
              end: 0,
              loop: 0,
              playlist: '',
              // Hide YouTube branding completely
              widget_referrer: window.location.origin,
              // Prevent YouTube suggestions and branding
              hl: 'en',
              cc_lang_pref: 'en'
            },
            events: {
              onReady: (event: any) => {
                setIsLoading(false);
                setIsPlayerReady(true);
                console.log('YouTube player ready');
                
                // Check available playback rates for this video
                if (playerRef.current && playerRef.current.getAvailablePlaybackRates) {
                  try {
                    const rates = playerRef.current.getAvailablePlaybackRates();
                    console.log('Available playback rates:', rates);
                    setAvailableSpeeds(rates);
                  } catch (error) {
                    console.warn('Could not get available playback rates:', error);
                    // Keep default speeds
                  }
                }
                
                // Debug mobile playback
                console.log('Mobile device detected:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
                console.log('Video ID:', videoId);
                console.log('Player instance:', playerRef.current);
              },
              onStateChange: (event: any) => {
                // YouTube player state: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
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
              }
            }
          });
        } else {
          // Fallback: retry after a short delay
          setTimeout(initPlayer, 100);
        }
      };
      
      // Initialize player
      initPlayer();
      
      // Set up interval for progress updates
      const interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          setCurrentTime(currentTime);
          setDuration(duration);
        }
      }, 1000);
      
      // Store interval reference
      intervalRef.current = interval;
      
      // Cleanup function
      return () => {
        clearInterval(intervalRef.current);
        if (playerRef.current && playerRef.current.destroy) {
          playerRef.current.destroy();
        }
        // Store containerRef.current in a variable to avoid stale closure
        const container = containerRef.current;
        if (container && playerDiv.parentNode) {
          container.removeChild(playerDiv);
        }
      };
    }
    }, [src, type, autoplay, onPlay, onPause, onEnded]);
  
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
          setShowSpeedMenu(false);
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
          isolation: 'isolate', // Creates a new stacking context
          contain: 'layout style paint' // CSS containment for better isolation
        }}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
          }, 2000); // 2 seconds delay before hiding (gives users time to interact)
        }}
        onTouchStart={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setIsHovered(true);
        }}
        onTouchEnd={() => {
          // For mobile, keep controls visible longer and add tap-to-toggle
          if (window.innerWidth <= 768) {
            // On mobile, controls stay visible for 5 seconds
            hoverTimeoutRef.current = setTimeout(() => {
              setIsHovered(false);
            }, 5000);
          } else {
            // On desktop, 2 seconds
            hoverTimeoutRef.current = setTimeout(() => {
              setIsHovered(false);
            }, 2000);
          }
        }}
        onClick={(e) => {
          // Mobile-specific tap behavior
          if (window.innerWidth <= 768) {
            e.preventDefault();
            e.stopPropagation();
            
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            
            // Toggle controls on tap
            setIsHovered(!isHovered);
            
            // If showing controls, hide them after 5 seconds
            if (!isHovered) {
              hoverTimeoutRef.current = setTimeout(() => {
                setIsHovered(false);
              }, 5000);
            }
          }
        }}
      >
        <div className="relative w-full" style={{ paddingTop: '56.25%', position: 'relative', overflow: 'hidden' }}>
          <style>{`
            /* Fullscreen styles */
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
            
            /* Mobile fullscreen optimization */
            @media (max-width: 768px) {
              .video-container:fullscreen {
                padding-top: 0 !important;
                height: 100vh !important;
              }
              
              .video-container:-webkit-full-screen {
                padding-top: 0 !important;
                height: 100vh !important;
              }
            }
            
            /* Keep controls visible in fullscreen on mobile */
            @media (max-width: 768px) {
              .video-container:fullscreen .controls-overlay {
                opacity: 1 !important;
                pointer-events: auto !important;
                z-index: 60 !important;
              }
              
              .video-container:-webkit-full-screen .controls-overlay {
                opacity: 1 !important;
                pointer-events: auto !important;
                z-index: 60 !important;
              }
              
              /* Ensure YouTube iframe is properly hidden in fullscreen */
              .video-container:fullscreen iframe {
                z-index: 1 !important;
              }
              
              .video-container:-webkit-full-screen iframe {
                z-index: 1 !important;
              }
            }
            
            /* Complete YouTube branding removal */
            iframe[src*="youtube.com"] {
              /* Hide YouTube logo and branding */
              position: relative;
            }
            
            /* Hide YouTube watermark and branding elements */
            .video-container iframe {
              /* Ensure iframe doesn't show YouTube branding */
              border: none !important;
              outline: none !important;
              position: relative;
            }
            
            /* Hide YouTube logo overlay */
            .video-container::after {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              width: 100px;
              height: 40px;
              background: black;
              z-index: 5;
              pointer-events: none;
            }
            
            /* Hide YouTube channel name and branding */
            .video-container::before {
              content: '';
              position: absolute;
              bottom: 0;
              right: 0;
              width: 200px;
              height: 30px;
              background: black;
              z-index: 5;
              pointer-events: none;
            }
            
            /* Mobile-specific control improvements */
            @media (max-width: 768px) {
              .controls-overlay {
                background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%) !important;
                padding: 20px 10px 10px 10px !important;
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
          {/* YouTube Branding Blocker Overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Cover any YouTube branding that might appear */}
            <div className="absolute top-0 right-0 w-20 h-8 bg-black opacity-0"></div>
            <div className="absolute bottom-0 right-0 w-32 h-6 bg-black opacity-0"></div>
          </div>

          {/* Fullscreen Experience Message */}
          {showFullscreenMessage && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
              📱 Experience is better on full screen landscape mode
            </div>
          )}

          {/* Mobile fullscreen button */}
          <button 
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-50 md:hidden bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all duration-200"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Mobile touch indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 md:hidden">
            <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 transition-opacity duration-150 pointer-events-none"
                 style={{ opacity: isLoading ? 1 : (isPlaying ? (isHovered ? 1 : 0) : 1) }}>
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Mobile touch hint */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-40 md:hidden">
            <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-xs opacity-0 transition-opacity duration-150 pointer-events-none"
                 style={{ opacity: isLoading ? 1 : (isPlaying ? (isHovered ? 1 : 0) : 1) }}>
              {isLoading ? 'Loading...' : 'Tap to show/hide controls'}
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
              
                          /* Mobile optimizations */
            @media (max-width: 768px) {
              .slider::-webkit-slider-thumb {
                height: 20px;
                width: 20px;
              }
              .slider::-moz-range-thumb {
                height: 20px;
                width: 20px;
              }
              
              /* Larger touch targets for mobile */
              .controls-overlay button {
                min-width: 44px;
                min-height: 44px;
                padding: 8px;
              }
              
              /* Better spacing for mobile controls */
              .controls-overlay {
                padding: 12px 16px 8px 16px;
              }
              
              /* Optimize progress bar for touch */
              .slider {
                height: 6px;
                margin: 8px 0;
              }
            }
            
            /* Laptop/Desktop optimizations */
            @media (min-width: 1024px) {
              .controls-overlay {
                padding: 16px 20px 12px 20px;
              }
              
              .controls-overlay button:hover {
                transform: scale(1.1);
                transition: transform 0.2s ease;
              }
              
              /* Enhanced hover effects */
              .controls-overlay button {
                transition: all 0.2s ease;
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
          
          {/* Clickable overlay for play/pause */}
          <div 
            className={`absolute inset-0 z-15 ${isPlayerReady ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={isPlayerReady ? togglePlay : undefined}
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
          
          {/* Custom controls overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent px-3 pb-0 pt-2 z-30 transition-opacity duration-300 controls-overlay ${
            isLoading ? 'opacity-100' : (isPlaying ? (isHovered ? 'opacity-100' : 'opacity-0') : 'opacity-100')
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
                    isLoading || !isPlayerReady ? 'opacity-100' : (isPlaying ? (isHovered ? 'opacity-100' : 'opacity-0') : 'opacity-100')
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
                    <div className="speed-menu absolute bottom-8 left-0 bg-black bg-opacity-90 rounded-lg p-2 space-y-1 min-w-[80px] z-50">
                      {availableSpeeds.map((speed) => (
                        <button
                          key={speed}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSpeedChange(speed);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                            playbackRate === speed 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'text-gray-300 hover:bg-blue-600 hover:text-white'
                          }`}
                          style={{ pointerEvents: 'auto' }}
                          data-speed-control
                        >
                          {speed}x
                        </button>
                      ))}
                      {availableSpeeds.length <= 8 && (
                        <div className="text-xs text-gray-400 px-2 py-1 border-t border-gray-600 mt-1">
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
                {/* Desktop Fullscreen Button */}
                <button 
                  onClick={toggleFullscreen} 
                  className="hidden md:block hover:text-blue-400 transition-colors p-1 group"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? (
                    // Exit fullscreen icon (compress)
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    // Enter fullscreen icon (expand)
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Time Display */}
                <div className="text-xs md:text-sm text-gray-300 font-mono">
                  {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
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
