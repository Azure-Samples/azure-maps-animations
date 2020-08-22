 /** Easing functions for animations. */
export class Easings {
    //From http://andrewraycode.github.io/easing-utils/gh-pages/

    /**
     * A linear easing function.
     * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
     */
    public static linear(progress: number): number {
        return progress;
    }

    /**
    * Slight acceleration from zero to full speed. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInSine(progress: number): number {
        return 1 - Math.cos(progress * Math.PI * 0.5);
    }

    /**
    * Slight deceleration at the end. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeOutSine(progress: number): number {
        return Math.sin(progress * Math.PI * 0.5);
    }

    /**
    * Slight acceleration at beginning and slight deceleration at end. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInOutSine(progress: number): number {
        return -0.5 * (Math.cos(Math.PI * progress) - 1);
    }

    /**
    * Accelerating from zero velocity. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInQuad(progress: number): number {
        return progress * progress;
    }

    /**
    * Decelerating to zero velocity. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeOutQuad(progress: number): number {
        return progress * (2 - progress);
    }

    /**
    * Acceleration until halfway, then deceleration. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInOutQuad(progress: number): number {
        if (progress < 0.5) {
            return 2 * progress * progress;
        }

        return - 1 + (4 - 2 * progress) * progress;
    }

    /**
    * Accelerating from zero velocity. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInCubic(progress: number): number {
        return progress * progress * progress;
    }

    /**
    * Decelerating to zero velocity. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeOutCubic(progress: number): number {
        const t1 = progress - 1;
        return t1 * t1 * t1 + 1;
    }

    /**
    * Acceleration until halfway, then deceleration. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInOutCubic(progress: number): number {
        if (progress < 0.5) {
            return 4 * progress * progress * progress;
        }

        return (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
    }

    /**
    * Accelerating from zero velocity. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInQuart(progress: number): number {
        return progress * progress * progress * progress;
    }

    /**
    * Decelerating to zero velocity. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeOutQuart(progress: number): number {
        const t1 = progress - 1;
        return 1 - t1 * t1 * t1 * t1;
    }

    /**
    * Acceleration until halfway, then deceleration. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInOutQuart(progress: number): number {
        if (progress < 0.5) {
            return 8 * progress * progress * progress * progress;
        }

        const t1 = progress - 1;
        return 1 - 8 * t1 * t1 * t1 * t1;
    }

    /**
    * Accelerating from zero velocity. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInQuint(progress: number): number {
        return progress * progress * progress * progress * progress;
    }

    /**
    * Decelerating to zero velocity. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeOutQuint(progress: number): number {
        const t1 = progress - 1;
        return 1 + t1 * t1 * t1 * t1 * t1;
    }

    /**
    * Acceleration until halfway, then deceleration. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInOutQuint(progress: number): number {
        if (progress < 0.5) {
            return 16 * progress * progress * progress * progress * progress;
        }

        const t1 = progress - 1;
        return 1 + 16 * t1 * t1 * t1 * t1 * t1;
    }

    /**
    * Accelerate exponentially until finish. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInExpo(progress: number): number {
        if (progress === 0) {
            return 0;
        }

        return Math.pow(2, 10 * (progress - 1));
    }

    /**
    * Initial exponential acceleration slowing to stop. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeOutExpo(progress: number): number {
        if (progress === 1) {
            return 1;
        }

        return 1 - Math.pow(2, -10 * progress);
    }

    /**
    * Exponential acceleration and deceleration. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInOutExpo(progress: number): number {
        if (progress === 0 || progress === 1) {
            return progress;
        }

        const scaledTime1 = progress * 2 - 1;

        if (scaledTime1 < 0) {
            return 0.5 * Math.pow(2, 10 * scaledTime1);
        }

        return 0.5 * (2 - Math.pow(2, -10 * scaledTime1));
    }

    /**
    * Increasing velocity until stop. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInCirc(progress: number): number {
        return -1 * (Math.sqrt(1 - progress * progress) - 1);
    }

    /**
    * Start fast, decreasing velocity until stop. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeOutCirc(progress: number): number {
        const t1 = progress - 1;
        return Math.sqrt(1 - t1 * t1);
    }

    /**
    * Fast increase in velocity, fast decrease in velocity. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInOutCirc(progress: number): number {
        const scaledTime = progress * 2;

        if (scaledTime < 1) {
            return -0.5 * (Math.sqrt(1 - scaledTime * scaledTime) - 1);
        }

        const scaledTime1 = scaledTime - 2;

        return 0.5 * (Math.sqrt(1 - scaledTime1 * scaledTime1) + 1);
    }

    /**
    * Slow movement backwards then fast snap to finish. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    * @param magnitude The magnitude of the easing.
    */
    public static easeInBack(progress, magnitude?: number): number {
        magnitude = magnitude || 1.70158;

        return progress * progress * ((magnitude + 1) * progress - magnitude);
    }

    /**
    * Fast snap to backwards point then slow resolve to finish. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    * @param magnitude The magnitude of the easing.
    */
    public static easeOutBack(progress, magnitude?: number): number {
        magnitude = magnitude || 1.70158;

        const scaledTime = progress - 1;

        return (
            scaledTime * scaledTime * ((magnitude + 1) * scaledTime + magnitude)
        ) + 1;
    }

    /**
    * Slow movement backwards, fast snap to past finish, slow resolve to finish. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    * @param magnitude The magnitude of the easing.
    */
    public static easeInOutBack(progress, magnitude?: number): number {
        magnitude = magnitude || 1.70158;

        const scaledTime = progress * 2;
        const s = magnitude * 1.525;

        if (scaledTime < 1) {
            return 0.5 * scaledTime * scaledTime * (
                ((s + 1) * scaledTime) - s
            );
        }

        const scaledTime2 = scaledTime - 2;

        return 0.5 * (
            scaledTime2 * scaledTime2 * ((s + 1) * scaledTime2 + s) + 2
        );
    }

    /**
    * Bounces slowly then quickly to finish. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    * @param magnitude The magnitude of the easing.
    */
    public static easeInElastic(progress, magnitude?: number): number {
        if (progress === 0 || progress === 1) {
            return progress;
        }

        magnitude = magnitude || 0.7;

        const scaledTime1 = progress - 1;
        const p = 1 - magnitude;
        const s = p / (2 * Math.PI) * Math.asin(1);

        return -(
            Math.pow(2, 10 * scaledTime1) *
            Math.sin((scaledTime1 - s) * (2 * Math.PI) / p)
        );
    }

    /**
    * Fast acceleration, bounces to zero. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    * @param magnitude The magnitude of the easing.
    */
    public static easeOutElastic(progress: number, magnitude?: number): number {
        if (progress === 0 || progress === 1) {
            return progress;
        }

        magnitude = magnitude || 0.7;

        const p = 1 - magnitude;
        const scaledTime = progress * 2;
        const s = p / (2 * Math.PI) * Math.asin(1);

        return (
            Math.pow(2, -10 * scaledTime) *
            Math.sin((scaledTime - s) * (2 * Math.PI) / p)
        ) + 1;
    }

    /**
    * Slow start and end, two bounces sandwich a fast motion. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    * @param magnitude The magnitude of the easing.
    */
    public static easeInOutElastic(progress: number, magnitude?: number): number {
        if (progress === 0 || progress === 1) {
            return progress;
        }

        magnitude = magnitude || 0.65;

        const p = 1 - magnitude;
        const scaledTime1 = progress * 2 - 1;
        const s = p / (2 * Math.PI) * Math.asin(1);

        if (scaledTime1 < 0) {
            return -0.5 * (
                Math.pow(2, 10 * scaledTime1) *
                Math.sin((scaledTime1 - s) * (2 * Math.PI) / p)
            );
        }

        return (
            Math.pow(2, -10 * scaledTime1) *
            Math.sin((scaledTime1 - s) * (2 * Math.PI) / p) * 0.5
        ) + 1;
    }

    /**
    * Bounce to completion. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeOutBounce(progress: number): number {
        if (progress < (1 / 2.75)) {
            return 7.5625 * progress * progress;
        } else if (progress < (2 / 2.75)) {
            const scaledTime2 = progress - (1.5 / 2.75);
            return (7.5625 * scaledTime2 * scaledTime2) + 0.75;
        } else if (progress < (2.5 / 2.75)) {
            const scaledTime2 = progress - (2.25 / 2.75);
            return (7.5625 * scaledTime2 * scaledTime2) + 0.9375;
        } else {
            const scaledTime2 = progress - (2.625 / 2.75);
            return (7.5625 * scaledTime2 * scaledTime2) + 0.984375;
        }
    }

    /**
    * Bounce increasing in velocity until completion. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInBounce(progress: number): number {
        return 1 - Easings.easeOutBounce(1 - progress);
    }

    /**
    * Bounce in and bounce out. 
    * @param progress The progress of the animation. A value between 0 and 1 where 0 is the start of the animation and 1 is the end.
    */
    public static easeInOutBounce(progress: number): number {
        if (progress < 0.5) {
            return Easings.easeInBounce(progress * 2) * 0.5;
        }

        return (Easings.easeOutBounce((progress * 2) - 1) * 0.5) + 0.5;
    }
}