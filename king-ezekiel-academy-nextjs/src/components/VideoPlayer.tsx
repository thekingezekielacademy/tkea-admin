import React, { useEffect, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

interface VideoPlayerProps {
  src: string; // video file URL or YouTube/Vimeo ID
  type?: "video" | "youtube" | "vimeo";
  title?: string; // optional title overlay
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  type = "video", 
  title,
  autoplay = false,
  onPlay,
  onPause,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement | HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      const player = new Plyr(videoRef.current, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "settings",
          "fullscreen",
        ],
        settings: ["speed"],
        speed: { selected: 1, options: [0.5, 1, 1.5, 2] },
        ratio: "16:9",
        clickToPlay: true,
        hideControls: true,
        autoplay: autoplay,
      });

      // Event listeners
      if (onPlay) player.on('play', onPlay);
      if (onPause) player.on('pause', onPause);
      if (onEnded) player.on('ended', onEnded);

      return () => {
        player.destroy();
      };
    }
  }, [src, autoplay, onPlay, onPause, onEnded]);

  if (type === "youtube" || type === "vimeo") {
    return (
      <div className="w-full bg-black rounded-lg overflow-hidden">
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <div className="video-container absolute inset-0 w-full h-full">
            <div
              ref={videoRef as React.RefObject<HTMLDivElement>}
              data-plyr-provider={type}
              data-plyr-embed-id={src}
              className="w-full h-full"
            ></div>
          </div>
          
          {/* Custom title overlay */}
          {title && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-medium z-10">
              {title}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <div className="video-container absolute inset-0 w-full h-full">
          <video ref={videoRef as React.RefObject<HTMLVideoElement>} playsInline controls>
            <source src={src} type="video/mp4" />
          </video>
        </div>
        
        {/* Custom title overlay */}
        {title && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-medium z-10">
            {title}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
