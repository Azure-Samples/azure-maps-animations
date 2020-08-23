
 /** Base animation options. */
 export interface PlayableAnimationOptions {
    /** The duration of the animation in ms. Default: 1000 ms */
    duration?: number;

    /** Specifies if the animation should start automatically or wait for the play function to be called. Default: false */
    autoPlay?: boolean;

    /** The easing of the animaiton. Default: linear */
    easing?: string | ((progress: number) => number);

    /** Specifies if the animation should loop infinitely. Default: false */
    loop?: boolean;

    /** Specifies if the animation should play backwards. Default: false */
    reverse?: boolean;

    /** A multiplier of the duration to speed up or down the animation. Default: 1 */
    speedMultiplier?: number;

    /** Specifies if the animation should dispose itself once it has completed. Default: false */
    disposeOnComplete?: boolean;
}
