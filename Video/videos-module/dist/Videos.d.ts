export interface VideoConfig {
    container: HTMLElement;
    src: string;
    autoplay?: boolean;
    controls?: boolean;
    width?: number;
    height?: number;
}
declare class Videos {
    private video;
    private container;
    private config;
    private timeDisplay;
    private controls;
    private progressBar;
    private isPlaying;
    private animationId;
    private skipTime;
    constructor(config: VideoConfig);
    private createVideoElement;
    private createControls;
    private createButton;
    private createTimeDisplay;
    private setupStyles;
    private bindEvents;
    private animatePlayButton;
    private animatePauseButton;
    private updateTimeDisplay;
    private updateTotalTime;
    private updateProgressBar;
    private seekToPosition;
    private formatTime;
    play(): void;
    pause(): void;
    skip(seconds: number): void;
    private showSkipAnimation;
    getCurrentTime(): number;
    getDuration(): number;
    setVolume(volume: number): void;
    destroy(): void;
}
export default Videos;
//# sourceMappingURL=Videos.d.ts.map