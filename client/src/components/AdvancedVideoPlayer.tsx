import React, { useEffect, useRef, useState } from "react";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    if (type === "youtube" && videoRef.current) {
      // Create a sophisticated YouTube bypass system
      const video = videoRef.current;
      
      // Set up video source using YouTube's direct stream URL
      const videoId = src.includes('youtube.com') || src.includes('youtu.be') 
        ? src.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1] || src
        : src;
      

      
      // Create a hidden iframe for the actual YouTube stream
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&cc_load_policy=0&fs=0&disablekb=1&playsinline=1&enablejsapi=1&origin=${window.location.origin}`;
      
      // Set loading state when iframe starts loading
      setIsLoading(true);
      
      // Listen for iframe load event
      iframe.onload = () => {
        setIsLoading(false);
      };
      iframe.style.position = 'absolute';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.zIndex = '0'; // Lower z-index so it stays behind everything
      iframe.style.opacity = '1'; // Fully visible now
      iframe.style.pointerEvents = 'none';
              iframe.style.borderRadius = '0'; // No border radius to eliminate spacing
        iframe.style.overflow = 'hidden'; // Ensure it doesn't overflow
        iframe.style.maxWidth = '100%'; // Ensure it doesn't exceed container width
        iframe.style.maxHeight = '100%'; // Ensure it doesn't exceed container height
        iframe.style.objectFit = 'cover'; // Fill the container completely
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      
      // Store reference to iframe
      iframeRef.current = iframe;
      
      // Create a wrapper div to contain the iframe
      const iframeWrapper = document.createElement('div');
      iframeWrapper.style.position = 'absolute';
      iframeWrapper.style.top = '0';
      iframeWrapper.style.left = '0';
      iframeWrapper.style.width = '100%';
      iframeWrapper.style.height = '100%';
      iframeWrapper.style.overflow = 'hidden';
              iframeWrapper.style.borderRadius = '0';
      iframeWrapper.style.zIndex = '0';
      
      // Add iframe to wrapper
      iframeWrapper.appendChild(iframe);
      
      // Add the wrapper to the container
      if (containerRef.current) {
        containerRef.current.appendChild(iframeWrapper);
      }
      
             // Set up our custom video element without a source (we don't need it)
       video.muted = true;
       video.volume = 0;
      
             // Event listeners for our custom player
       video.addEventListener('play', () => {
         setIsPlaying(true);
         onPlay?.();
         // Trigger the hidden YouTube iframe to play
         iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
       });
       
       video.addEventListener('pause', () => {
         setIsPlaying(false);
         onPause?.();
         // Trigger the hidden YouTube iframe to pause
         iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
       });
       
       video.addEventListener('ended', () => {
         setIsPlaying(false);
         onEnded?.();
       });
       
       // Listen for YouTube player state changes
       const handleMessage = (event: MessageEvent) => {
         try {
           const data = JSON.parse(event.data);
           if (data.event === 'onStateChange') {
             // YouTube player state: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
             if (data.info === 1) {
               setIsPlaying(true);
               onPlay?.();
             } else if (data.info === 2 || data.info === 0) {
               setIsPlaying(false);
               onPause?.();
               if (data.info === 0) {
                 onEnded?.();
               }
             }
           }
         } catch (error) {
           // Ignore parsing errors
         }
       };
       
       // Add message listener
       window.addEventListener('message', handleMessage);
       
       // Set up interval for progress updates
       const interval = setInterval(() => {
         if (iframe.contentWindow) {
           iframe.contentWindow.postMessage('{"event":"command","func":"getCurrentTime","args":""}', '*');
         }
       }, 1000);
       
       // Store interval reference
       intervalRef.current = interval;
       
       // Set up hover timeout
       const hoverTimeout = setTimeout(() => {
         // Auto-hide controls after 3 seconds
       }, 3000);
       
       // Store hover timeout reference
       hoverTimeoutRef.current = hoverTimeout;
       
       // Cleanup function
       return () => {
         clearInterval(intervalRef.current);
         clearTimeout(hoverTimeoutRef.current);
         window.removeEventListener('message', handleMessage);
         // Store containerRef.current in a variable to avoid stale closure
         const container = containerRef.current;
         if (container && iframe.parentNode?.parentNode) {
           iframe.parentNode.parentNode.removeChild(iframe.parentNode);
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
    if (isPlaying) {
      // Pause the YouTube video
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          '*'
        );
      }
      setIsPlaying(false);
      onPause?.();
    } else {
      // Play the YouTube video
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          '{"event":"command","func":"playVideo","args":""}',
          '*'
        );
      }
      setIsPlaying(true);
      onPlay?.();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    setCurrentTime(newTime);
    
    // Seek the YouTube player to the new time
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        `{"event":"command","func":"seekTo","args":[${newTime}, true]}`,
        '*'
      );
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // If unmuting, update the YouTube player volume
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          '{"event":"command","func":"unMute","args":""}',
          '*'
        );
      }
    }
    
    // Set volume on YouTube player
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        `{"event":"command","func":"setVolume","args":[${newVolume * 100}]}`,
        '*'
      );
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Mute/unmute the YouTube player
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        `{"event":"command","func":"${newMutedState ? 'mute' : 'unMute'}","args":""}`,
        '*'
      );
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
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        `{"event":"command","func":"setPlaybackRate","args":[${speed}]}`,
        '*'
      );
    }
  };

  const handleSeekForward = () => {
    const newTime = Math.min(currentTime + 10, duration);
    setCurrentTime(newTime);
    
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        `{"event":"command","func":"seekTo","args":[${newTime}, true]}`,
        '*'
      );
    }
  };

  const handleSeekBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    setCurrentTime(newTime);
    
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        `{"event":"command","func":"seekTo","args":[${newTime}, true]}`,
        '*'
      );
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
        setShowSpeedMenu(false);
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
          }, 50); // 50ms delay before hiding (ultra fast)
        }}
        onTouchStart={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setIsHovered(true);
        }}
        onTouchEnd={() => {
          hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
          }, 150); // 150ms for touch devices
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
            
            /* Hide controls in fullscreen on mobile */
            @media (max-width: 768px) {
              .video-container:fullscreen .controls-overlay {
                opacity: 0 !important;
                pointer-events: none !important;
              }
              
              .video-container:-webkit-full-screen .controls-overlay {
                opacity: 0 !important;
                pointer-events: none !important;
              }
            }
          `}</style>
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
            className="absolute inset-0 z-15 cursor-pointer"
            onClick={togglePlay}
            style={{ pointerEvents: isPlaying ? 'auto' : 'auto' }}
          />
          
          {/* Custom video placeholder */}
          <div 
            className={`absolute inset-0 w-full h-full bg-black flex items-center justify-center transition-all duration-75 cursor-pointer z-20 ${
              isLoading ? 'opacity-100' : (isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100')
            }`}
            onClick={togglePlay}
          >
            <div className="text-center text-white">
              <p className="text-xl md:text-2xl font-medium mb-2">{title || 'Video Player'}</p>
              <p className="text-sm text-gray-400 opacity-75">
                {isLoading ? 'Loading video...' : 'Tap anywhere to play'}
              </p>
            </div>
          </div>
          
          {/* Custom controls overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent px-3 pb-0 pt-2 z-30 transition-opacity duration-75 controls-overlay ${
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
                  className={`hover:text-blue-400 transition-colors transition-opacity p-1 md:p-0 ${
                    isLoading ? 'opacity-100' : (isPlaying ? (isHovered ? 'opacity-100' : 'opacity-0') : 'opacity-100')
                  }`}
                >
                  {isPlaying ? (
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
                  >
                    {playbackRate}x
                  </button>
                  
                  {/* Speed Menu */}
                  {showSpeedMenu && (
                    <div className="absolute bottom-8 left-0 bg-black bg-opacity-90 rounded-lg p-2 space-y-1 min-w-[80px]">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors ${
                            playbackRate === speed ? 'bg-blue-600 text-white' : 'text-gray-300'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
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
