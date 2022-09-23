
/** Options for a group of animations. */
export interface GroupAnimationOptions {
    /** How to play the animations. Default: 'together' */
    playType: 'together' | 'sequential' | 'interval';

    /** If the `playType` is set to `interval`, this option specifies the time interval to start each animation in milliseconds. Default: `100` */
    interval?: number;

    /** Specifies if the animation should start automatically or wait for the play function to be called. Default: false */
    autoPlay?: boolean;
}