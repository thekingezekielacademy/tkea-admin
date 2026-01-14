import React, { useEffect, useRef, useState } from 'react';

interface YouTubeStreamPlayerProps {
  videoId: string; // YouTube video ID or full URL
  title?: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

const YouTubeStreamPlayer: React.FC<YouTubeStreamPlayerProps> = ({
  videoId,
  title,
  poster,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);

  // Extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset states when video changes
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setIsInitialized(false);
    setShowPlayButton(true);

    const ytVideoId = getYouTubeVideoId(videoId);
    console.log('Initializing YouTube stream player for:', ytVideoId);

    // Get YouTube embed URL with aggressive branding removal
    const getYouTubeEmbedUrl = (videoId: string): string => {
      const params = new URLSearchParams({
        rel: '0',                    // No related videos
        modestbranding: '1',         // Minimal branding
        showinfo: '0',               // No video info
        controls: '0',               // No YouTube controls
        disablekb: '0',              // Enable keyboard shortcuts for play
        iv_load_policy: '3',         // No annotations
        cc_load_policy: '0',         // No captions
        playsinline: '1',            // Play inline on mobile
        fs: '0',                     // No fullscreen button
        color: 'white',              // Player color
        autoplay: autoplay ? '1' : '0',
        loop: '0',                   // No looping
        playlist: videoId,           // Single video
        origin: window.location.origin,
        enablejsapi: '1',            // Enable JavaScript API
        widget_referrer: window.location.origin
      });
      
      return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    };

    // Create iframe for YouTube streaming
    const iframe = document.createElement('iframe');
    iframe.src = getYouTubeEmbedUrl(ytVideoId);
    iframe.title = title || 'Video';
    iframe.className = 'absolute inset-0 w-full h-full';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;

    // Add error handling for iframe
    iframe.onerror = () => {
      console.log('Iframe failed to load');
      if (!isInitialized) {
        setError('Failed to load video');
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    // Add load event handler
    iframe.onload = () => {
      console.log('Iframe loaded successfully');
      // Try to enable API after load
      setTimeout(() => {
        try {
          iframe.contentWindow?.postMessage('{"event":"listening"}', '*');
          // Also try to set up the player
          iframe.contentWindow?.postMessage('{"event":"command","func":"setLoop","args":"false"}', '*');
        } catch (e) {
          console.log('API setup attempt:', e);
        }
      }, 1000);
    };

    // Clear container and add iframe
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);

    // Add custom CSS to hide YouTube elements
    const style = document.createElement('style');
    style.id = 'youtube-branding-hide';
    style.textContent = `
      /* Hide all YouTube branding and controls */
      iframe[src*="youtube.com"] {
        filter: brightness(1.1) contrast(1.1);
      }
      
      /* Overlay to hide any remaining YouTube elements */
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
      
      /* Aggressive YouTube branding hiding */
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
      .ytp-pause-overlay .ytp-text,
      .ytp-pause-overlay .ytp-title,
      .ytp-pause-overlay .ytp-subtitle,
      .ytp-pause-overlay .ytp-description,
      .ytp-pause-overlay .ytp-embed,
      .ytp-pause-overlay .ytp-share,
      .ytp-pause-overlay .ytp-watch-later,
      .ytp-pause-overlay .ytp-addto,
      .ytp-pause-overlay .ytp-more,
      .ytp-pause-overlay .ytp-rewind,
      .ytp-pause-overlay .ytp-forward,
      .ytp-pause-overlay .ytp-replay,
      .ytp-pause-overlay .ytp-next,
      .ytp-pause-overlay .ytp-previous,
      .ytp-pause-overlay .ytp-skip,
      .ytp-pause-overlay .ytp-skip-button,
      .ytp-pause-overlay .ytp-skip-button-container,
      .ytp-pause-overlay .ytp-skip-button-container .ytp-skip-button,
      .ytp-pause-overlay .ytp-skip-button-container .ytp-skip-button .ytp-skip-button-icon,
      .ytp-pause-overlay .ytp-skip-button-container .ytp-skip-button .ytp-skip-button-text,
      .ytp-pause-overlay .ytp-skip-button-container .ytp-skip-button .ytp-skip-button-text .ytp-skip-button-text-content,
      .ytp-pause-overlay .ytp-skip-button-container .ytp-skip-button .ytp-skip-button-text .ytp-skip-button-text-content .ytp-skip-button-text-content-text {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        margin: -1px !important;
        padding: 0 !important;
        border: 0 !important;
      }
      
      /* Hide video suggestions and related content */
      .ytp-pause-overlay,
      .ytp-pause-overlay .ytp-text,
      .ytp-pause-overlay .ytp-button,
      .ytp-pause-overlay .ytp-title,
      .ytp-pause-overlay .ytp-subtitle,
      .ytp-pause-overlay .ytp-description,
      .ytp-pause-overlay .ytp-embed,
      .ytp-pause-overlay .ytp-share,
      .ytp-pause-overlay .ytp-watch-later,
      .ytp-pause-overlay .ytp-addto,
      .ytp-pause-overlay .ytp-more,
      .ytp-pause-overlay .ytp-rewind,
      .ytp-pause-overlay .ytp-forward,
      .ytp-pause-overlay .ytp-replay,
      .ytp-pause-overlay .ytp-next,
      .ytp-pause-overlay .ytp-previous,
      .ytp-pause-overlay .ytp-skip,
      .ytp-pause-overlay .ytp-skip-button,
      .ytp-pause-overlay .ytp-skip-button-container {
        display: none !important;
      }
      
      /* Hide any remaining YouTube elements */
      [class*="ytp-"],
      [id*="ytp-"],
      [data-ytp-] {
        display: none !important;
      }
      
      /* Hide specific bottom elements */
      .ytp-copy-link,
      .ytp-playlist,
      .ytp-logo,
      .ytp-youtube-button,
      .ytp-button.ytp-logo,
      .ytp-button.ytp-youtube-button,
      .ytp-chrome-bottom .ytp-button,
      .ytp-chrome-bottom .ytp-text,
      .ytp-chrome-bottom .ytp-title,
      .ytp-chrome-bottom .ytp-subtitle,
      .ytp-chrome-bottom .ytp-description,
      .ytp-chrome-bottom .ytp-embed,
      .ytp-chrome-bottom .ytp-share,
      .ytp-chrome-bottom .ytp-watch-later,
      .ytp-chrome-bottom .ytp-addto,
      .ytp-chrome-bottom .ytp-more,
      .ytp-chrome-bottom .ytp-rewind,
      .ytp-chrome-bottom .ytp-forward,
      .ytp-chrome-bottom .ytp-replay,
      .ytp-chrome-bottom .ytp-next,
      .ytp-chrome-bottom .ytp-previous,
      .ytp-chrome-bottom .ytp-skip,
      .ytp-chrome-bottom .ytp-skip-button,
      .ytp-chrome-bottom .ytp-skip-button-container {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        margin: -1px !important;
        padding: 0 !important;
        border: 0 !important;
      }
      
      /* Hide ALL remaining YouTube elements aggressively */
      .ytp-copy-link,
      .ytp-playlist,
      .ytp-logo,
      .ytp-youtube-button,
      .ytp-button.ytp-logo,
      .ytp-button.ytp-youtube-button,
      .ytp-chrome-bottom,
      .ytp-chrome-bottom *,
      .ytp-cued-thumbnail-overlay,
      .ytp-cued-thumbnail-overlay *,
      .ytp-pause-overlay,
      .ytp-pause-overlay *,
      .ytp-watermark,
      .ytp-watermark *,
      .ytp-show-cards-title,
      .ytp-show-cards-title *,
      .ytp-title,
      .ytp-title *,
      .ytp-subtitle,
      .ytp-subtitle *,
      .ytp-description,
      .ytp-description *,
      .ytp-embed,
      .ytp-embed *,
      .ytp-share,
      .ytp-share *,
      .ytp-watch-later,
      .ytp-watch-later *,
      .ytp-addto,
      .ytp-addto *,
      .ytp-more,
      .ytp-more *,
      .ytp-rewind,
      .ytp-rewind *,
      .ytp-forward,
      .ytp-forward *,
      .ytp-replay,
      .ytp-replay *,
      .ytp-next,
      .ytp-next *,
      .ytp-previous,
      .ytp-previous *,
      .ytp-skip,
      .ytp-skip *,
      .ytp-skip-button,
      .ytp-skip-button *,
      .ytp-skip-button-container,
      .ytp-skip-button-container * {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        margin: -1px !important;
        padding: 0 !important;
        border: 0 !important;
      }
      
      /* Force hide specific elements with multiple approaches */
      .ytp-copy-link,
      .ytp-playlist,
      .ytp-logo,
      .ytp-youtube-button,
      .ytp-button.ytp-logo,
      .ytp-button.ytp-youtube-button {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        margin: -1px !important;
        padding: 0 !important;
        border: 0 !important;
        transform: scale(0) !important;
        max-width: 0 !important;
        max-height: 0 !important;
        min-width: 0 !important;
        min-height: 0 !important;
        font-size: 0 !important;
        line-height: 0 !important;
        color: transparent !important;
        background: transparent !important;
        box-shadow: none !important;
        text-shadow: none !important;
        filter: blur(100px) !important;
        z-index: -9999 !important;
      }
      
      /* Hide entire bottom chrome area */
      .ytp-chrome-bottom {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        margin: -1px !important;
        padding: 0 !important;
        border: 0 !important;
        transform: scale(0) !important;
        max-width: 0 !important;
        max-height: 0 !important;
        min-width: 0 !important;
        min-height: 0 !important;
        font-size: 0 !important;
        line-height: 0 !important;
        color: transparent !important;
        background: transparent !important;
        box-shadow: none !important;
        text-shadow: none !important;
        filter: blur(100px) !important;
        z-index: -9999 !important;
      }
        
        /* Hide copy link and playlist icons - ALWAYS hidden regardless of video state */
        .ytp-copy-link,
        .ytp-playlist,
        .ytp-button[aria-label*="copy"],
        .ytp-button[aria-label*="playlist"],
        /* Target pause overlay elements that appear when video is paused */
        .ytp-pause-overlay .ytp-copy-link,
        .ytp-pause-overlay .ytp-playlist,
        .ytp-pause-overlay .ytp-button[aria-label*="copy"],
        .ytp-pause-overlay .ytp-button[aria-label*="playlist"],
        /* Target any element that might contain copy/playlist when paused */
        .ytp-pause-overlay *[class*="copy"],
        .ytp-pause-overlay *[class*="playlist"],
        .ytp-pause-overlay *[class*="share"],
        .ytp-pause-overlay *[class*="watch-later"],
        /* Target the entire pause overlay to hide all branding */
        .ytp-pause-overlay {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          transform: scale(0) !important;
          filter: blur(100px) !important;
          z-index: -9999 !important;
        }
    `;
    
    // Remove existing style if present
    const existingStyle = document.getElementById('youtube-branding-hide');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);

    // Set a timeout to stop loading if no message is received
    const loadingTimeout = setTimeout(() => {
      if (!isInitialized) {
        setIsLoading(false);
        setIsInitialized(true);
        console.log('YouTube player loaded (timeout fallback)');
      }
    }, 3000);

    // Set up message listener for iframe communication
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube-nocookie.com') return;
      
      try {
        const data = JSON.parse(event.data);
        console.log('YouTube message received:', data);
        
        switch (data.event) {
          case 'onReady':
            clearTimeout(loadingTimeout);
            if (!isInitialized) {
              setIsLoading(false);
              setIsInitialized(true);
              setError(null);
            }
            break;
          case 'onStateChange':
            console.log('YouTube state changed:', data.info);
            if (data.info === 1) { // Playing
              console.log('Video is now playing');
              setIsPlaying(true);
              onPlay?.();
            } else if (data.info === 2) { // Paused
              console.log('Video is now paused');
              setIsPlaying(false);
              onPause?.();
            } else if (data.info === 0) { // Ended
              console.log('Video ended');
              setIsPlaying(false);
              onEnded?.();
            } else if (data.info === 3) { // Buffering
              console.log('Video is buffering');
            } else if (data.info === 5) { // Video cued
              console.log('Video is cued');
            }
            break;
          case 'onError':
            clearTimeout(loadingTimeout);
            if (!isInitialized) {
              setError('Failed to load YouTube video');
              setIsLoading(false);
              setIsInitialized(true);
            }
            break;
        }
      } catch (e) {
        console.log('Message parsing error (ignored):', e);
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup function
    return () => {
      clearTimeout(loadingTimeout);
      window.removeEventListener('message', handleMessage);
      
      // Remove custom styles
      const customStyle = document.getElementById('youtube-branding-hide');
      if (customStyle) {
        customStyle.remove();
      }
    };
  }, [videoId, autoplay, title, onPlay, onPause, onEnded]);
  
  // Additional effect to continuously remove YouTube branding elements
  useEffect(() => {
    if (!containerRef.current) return;
    
    const removeYouTubeBranding = () => {
      const iframe = containerRef.current?.querySelector('iframe');
      if (!iframe || !iframe.contentDocument) return;
      
      try {
        // Remove copy link button
        const copyLink = iframe.contentDocument.querySelector('.ytp-copy-link, .ytp-button[aria-label*="copy"], .ytp-button[data-tooltip*="copy"]');
        if (copyLink) {
          copyLink.remove();
        }
        
        // Remove playlist button
        const playlist = iframe.contentDocument.querySelector('.ytp-playlist, .ytp-button[aria-label*="playlist"], .ytp-button[data-tooltip*="playlist"]');
        if (playlist) {
          playlist.remove();
        }
        
        // Remove any remaining branding elements
        const brandingElements = iframe.contentDocument.querySelectorAll('.ytp-logo, .ytp-youtube-button, .ytp-copy-link, .ytp-playlist');
        brandingElements.forEach(el => el.remove());
        
      } catch (error) {
        // Cross-origin restrictions might prevent this, but CSS should handle it
      }
    };
    
    // Try to remove branding immediately
    removeYouTubeBranding();
    
    // Set up a mutation observer to catch dynamically added elements
    const iframe = containerRef.current?.querySelector('iframe');
    if (iframe && iframe.contentDocument) {
      const observer = new MutationObserver(removeYouTubeBranding);
      observer.observe(iframe.contentDocument.body, {
        childList: true,
        subtree: true
      });
      
      return () => observer.disconnect();
    }
  }, [videoId]);
  
  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      {/* Video Container */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        {/* YouTube iframe container */}
        <div 
          ref={containerRef} 
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Clickable overlay for play functionality - only when showing play button */}
        {!autoplay && showPlayButton && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={() => {
              console.log('Overlay clicked to play!');
              // Hide play button immediately
              setShowPlayButton(false);
              
              const iframe = containerRef.current?.querySelector('iframe');
              if (iframe && iframe.contentWindow) {
                try {
                  // Send play command
                  iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                  console.log('Play command sent via overlay click');
                } catch (error) {
                  console.error('Overlay play command failed:', error);
                }
              }
            }}
          />
        )}

        {/* Clickable overlay for pause functionality - only when not showing play button */}
        {!autoplay && !showPlayButton && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={() => {
              console.log('Video clicked to pause!');
              // Show play button again
              setShowPlayButton(true);
              
              const iframe = containerRef.current?.querySelector('iframe');
              if (iframe && iframe.contentWindow) {
                try {
                  iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                  console.log('Pause command sent via video click');
                } catch (error) {
                  console.error('Pause command failed:', error);
                }
              }
            }}
          />
        )}
        
        {/* Custom overlay for branding */}
        {title && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-medium z-10">
            {title}
          </div>
        )}
        
        {/* Custom play button overlay - only show when paused */}
        {!autoplay && showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-20">
            <button
              onClick={() => {
                console.log('Play button clicked!');
                // Hide play button immediately
                setShowPlayButton(false);
                
                // Try multiple methods to play the video
                const iframe = containerRef.current?.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                  try {
                    // Method 1: YouTube iframe API command
                    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                    
                    // Method 2: Direct iframe click (fallback)
                    setTimeout(() => {
                      iframe.click();
                    }, 100);
                    
                    // Method 3: Simulate spacebar press
                    setTimeout(() => {
                      iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                    }, 200);
                    
                    // Method 4: Try to focus and send spacebar
                    setTimeout(() => {
                      try {
                        iframe.focus();
                        iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                      } catch (e) {
                        console.log('Focus method failed:', e);
                      }
                    }, 300);
                    
                    // Method 5: Last resort - try to access YouTube player directly
                    setTimeout(() => {
                      try {
                        // Try to access the YouTube player object
                        const player = (iframe.contentWindow as any)?.player;
                        if (player && typeof player.playVideo === 'function') {
                          player.playVideo();
                          console.log('Direct player access successful');
                        }
                      } catch (e) {
                        console.log('Direct player access failed:', e);
                      }
                    }, 500);
                    
                    console.log('All play commands sent to iframe');
                  } catch (error) {
                    console.error('Error sending play command:', error);
                  }
                }
              }}
              className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-lg cursor-pointer"
            >
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Pause button overlay - only show when not showing play button */}
        {!autoplay && !showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-20 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => {
                console.log('Pause button clicked!');
                // Show play button again
                setShowPlayButton(true);
                
                const iframe = containerRef.current?.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                  try {
                    iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                    console.log('Pause command sent to iframe');
                  } catch (error) {
                    console.error('Pause command failed:', error);
                  }
                }
              }}
              className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-lg cursor-pointer"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-white text-sm">Loading video...</p>
            </div>
          </div>
        )}
        
        {/* YouTube branding removal overlay - covers any remaining elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-black z-40 pointer-events-none"></div>
        
        {/* Additional overlay to completely cover any YouTube branding at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black to-transparent z-50 pointer-events-none"></div>
        
        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-40">
            <div className="text-center text-white">
              <svg className="h-16 w-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium mb-2">Video Error</p>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeStreamPlayer;
