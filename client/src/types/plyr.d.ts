declare module 'plyr' {
  interface PlyrOptions {
    controls?: string[];
    settings?: string[];
    i18n?: Record<string, string>;
    keyboard?: {
      focused?: boolean;
      global?: boolean;
    };
    tooltips?: {
      controls?: boolean;
      seek?: boolean;
    };
    hideControls?: boolean;
    resetOnEnd?: boolean;
    disableContextMenu?: boolean;
    loadSprite?: boolean;
    iconUrl?: string;
    iconPrefix?: string;
    blankVideo?: string;
    debug?: boolean;
    autoplay?: boolean;
    autopause?: boolean;
    playsinline?: boolean;
    seekTime?: number;
    volume?: number;
    muted?: boolean;
    clickToPlay?: boolean;
    hideControls?: boolean;
    resetOnEnd?: boolean;
    disableContextMenu?: boolean;
    loadSprite?: boolean;
    iconUrl?: string;
    iconPrefix?: string;
    blankVideo?: string;
    debug?: boolean;
    quality?: {
      default?: number;
      options?: number[];
      forced?: boolean;
      onChange?: (quality: number) => void;
    };
    loop?: {
      active?: boolean;
    };
    speed?: {
      selected?: number;
      options?: number[];
    };
    captions?: {
      active?: boolean;
      language?: string;
      update?: boolean;
    };
    fullscreen?: {
      enabled?: boolean;
      fallback?: boolean;
      iosNative?: boolean;
      container?: string | HTMLElement;
    };
    storage?: {
      enabled?: boolean;
      key?: string;
    };
    title?: string;
    ratio?: string;
    vimeo?: {
      byline?: boolean;
      portrait?: boolean;
      title?: boolean;
      transparent?: boolean;
      color?: string;
      dnt?: boolean;
    };
    youtube?: {
      noCookie?: boolean;
      rel?: number;
      showinfo?: number;
      iv_load_policy?: number;
      modestbranding?: number;
    };
  }

  interface Plyr {
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    restart(): void;
    rewind(time: number): void;
    forward(time: number): void;
    getCurrentTime(): number;
    setCurrentTime(time: number): void;
    getDuration(): number;
    getVolume(): number;
    setVolume(volume: number): void;
    isMuted(): boolean;
    mute(): void;
    unmute(): void;
    getPlaybackRate(): number;
    setPlaybackRate(rate: number): void;
    getPlaybackRates(): number[];
    getPlaybackQuality(): string;
    setPlaybackQuality(quality: string): void;
    getPlaybackQualities(): string[];
    getSeekTime(): number;
    setSeekTime(time: number): void;
    getBuffered(): TimeRanges;
    getPlayed(): TimeRanges;
    getSeekable(): TimeRanges;
    isReady(): boolean;
    isPlaying(): boolean;
    isPaused(): boolean;
    isEnded(): boolean;
    isSeeking(): boolean;
    isSeekable(): boolean;
    isLoaded(): boolean;
    isFullscreen(): boolean;
    enterFullscreen(): void;
    exitFullscreen(): void;
    toggleFullscreen(): void;
    on(event: string, callback: Function): void;
    off(event: string, callback?: Function): void;
    once(event: string, callback: Function): void;
    destroy(): void;
    source: string | object;
    poster: string;
    currentTime: number;
    duration: number;
    volume: number;
    muted: boolean;
    playbackRate: number;
    playbackQuality: string;
    seekTime: number;
    buffered: TimeRanges;
    played: TimeRanges;
    seekable: TimeRanges;
    ready: boolean;
    playing: boolean;
    paused: boolean;
    ended: boolean;
    seeking: boolean;
    seekable: boolean;
    loaded: boolean;
    fullscreen: boolean;
    options: PlyrOptions;
    media: HTMLMediaElement;
    container: HTMLElement;
    elements: {
      container: HTMLElement;
      wrapper: HTMLElement;
      media: HTMLMediaElement;
      poster: HTMLElement;
      controls: HTMLElement;
      progress: HTMLElement;
      currentTime: HTMLElement;
      duration: HTMLElement;
      mute: HTMLElement;
      volume: HTMLElement;
      fullscreen: HTMLElement;
      play: HTMLElement;
      pause: HTMLElement;
      stop: HTMLElement;
      restart: HTMLElement;
      rewind: HTMLElement;
      forward: HTMLElement;
      speed: HTMLElement;
      quality: HTMLElement;
      captions: HTMLElement;
      download: HTMLElement;
      pip: HTMLElement;
      airplay: HTMLElement;
      settings: HTMLElement;
      menu: HTMLElement;
      chapters: HTMLElement;
      markers: HTMLElement;
    };
  }

  interface PlyrStatic {
    new(media: HTMLMediaElement | HTMLDivElement | string, options?: PlyrOptions): Plyr;
    isSupported(media: HTMLMediaElement | HTMLDivElement | string, type?: string): boolean;
    setup(media: HTMLMediaElement | HTMLDivElement | string, options?: PlyrOptions): Plyr;
    setup(media: (HTMLMediaElement | HTMLDivElement | string)[], options?: PlyrOptions): Plyr[];
  }

  const Plyr: PlyrStatic;
  export default Plyr;
}
