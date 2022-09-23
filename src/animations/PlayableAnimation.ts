import { PlayableAnimationOptions } from './options/PlayableAnimationOptions';
import { Easings } from './internal/Easings';
import { Utils } from '../helpers/Utils';
import * as azmaps from "azure-maps-control";
import { AnimationManager } from './internal/AnimationManager';
import { FrameBasedAnimationEvent } from './FrameBasedAnimationTimer';
import { IPlayableAnimation } from './interfaces/IPlayableAnimation';

/** The events supported by the `PlayableAnimation`. */
export interface PlayableAnimationEvents {
    /** Event fired when the animation progress changes. */
    onprogress: PlayableAnimationEvent;

    /** Event fired when the animation has completed. */
    oncomplete: azmaps.TargetedEvent;

    /** Event fired when a frame in a frame based animation is fired. */
    onframe: FrameBasedAnimationEvent;
}

/** Playable animation event argument. */
export interface PlayableAnimationEvent {
    /** The event type. */
    type: string;
    
    /** The animation the event occurered on. */
    animation: PlayableAnimation;

    /** Progress of the animation where 0 is the start and 1 is the end. */
    progress: number;

    /** The progress of the animation after being passed through an easing function. */
    easingProgress: number;

    /** The focal position of an animation frame. Returned by path animations.  */
    position?: azmaps.data.Position;

    /** The focal heading of an animation frame. Returned by path animations. */
    heading?: number;
}

/** An abstract class which defines an animation that supports a play function. */
export abstract class PlayableAnimation extends azmaps.internal.EventEmitter<PlayableAnimationEvents> implements IPlayableAnimation {

    /**************************
    * Internal properties
    ***************************/
    
    public _onComplete: () => void;

    /** Internal: A unique ID for the animation. Need to ensure that two animaitons that do the same thing have a different signature for the Animation Manager. */
    public _id: number;

    /**************************
    * Private properties
    ***************************/

    private _start: number = null;

    private _rawProgress: number = 0;

    private _options: PlayableAnimationOptions = {
        duration: 1000,
        autoPlay: false,
        easing: 'linear',
        loop: false,
        reverse: false,
        speedMultiplier: 1,
        disposeOnComplete: false
    };

    private _easing = Easings.linear;

    /**************************
    * Constructor
    ***************************/

    /**
     * The base playable animation class.
     * @param options Animaiton options.
     */
    constructor(options?: PlayableAnimationOptions) {
        super();
        const self = this;

        self._id = AnimationManager.instance.add(self);
        self.setOptions(options);       
    }

    /**************************
    * Public Methods
    ***************************/

    /** Disposes the animation. */
    public dispose(): void {
        const self = this;
        self.stop();
        AnimationManager.instance.remove(self);
        self._options = null;
        self._easing = null;
        self._start = null;
        self._onComplete = null;
        self._id = undefined;
        self._rawProgress = null;
    }

    /** Gets the duration of the animation. Returns Infinity if the animations loops forever. */
    public getDuration(): number {
        const o = this._options;
        return (o.loop)? Infinity : o.duration / o.speedMultiplier;
    }

    /** Gets the animation options. */
    public getOptions(): PlayableAnimationOptions {
        return Object.assign({}, this._options);
    }

    /**
     * Checks to see if the animaiton is playing.
     */
    public isPlaying(): boolean {
        return this._start !== null;
    }

    /**
     * Plays the animation.
     * @param reset Specifies if the animation should reset before playing.
     */
    public play(reset?: boolean): void {
        const self = this;

        if(reset) {
            self.reset();
        }

        if (self._rawProgress >= 1){
            //Animation is complete, restart.
            self._rawProgress = 0;
        }

        if(self._rawProgress > 0){
            //Animation is paused, calculated offset start time of animation.
            self._start = Utils.getStartTime(self._rawProgress, self._options.duration, self._options.speedMultiplier);
        } else {
            self._start = performance.now();
        }
    }

    /**
     * Pauses the animation.
     */
    public pause(): void {
        //Stop the progress of the animation.
        this._start = null;
    }

    /**
     * Advances the animation to specific step. 
     * @param progress The progress of the animation to advance to. A value between 0 and 1.
     */
    public seek(progress: number): void {
        const self = this;
        if(typeof progress === 'number') {
            const isPLaying = self.isPlaying();

            if(isPLaying){
                self.pause();
            }

            self._rawProgress = Math.min(Math.max(progress, 0), 1) / self._options.speedMultiplier;
            self._processFrame();

            if(isPLaying){
                self.play();
            }
        }
    }

    /** Sets the options of the animation. */
    public setOptions(options: PlayableAnimationOptions): void {
        if(options){
            const self = this;
            const opt = self._options;

            if (options.easing){
                if(typeof options.easing === 'string' && Easings[options.easing]) {
                    self._easing = Easings[options.easing];
                    opt.easing = options.easing;
                } else if(options.easing instanceof Function){
                    self._easing = options.easing;
                    opt.easing = options.easing;
                }
            }

            if (typeof options.loop === 'boolean') {
                opt.loop = options.loop;
            }

            if (typeof options.disposeOnComplete === 'boolean') {
                opt.disposeOnComplete = options.disposeOnComplete;
            }

            if (typeof options.reverse === 'boolean') {
                opt.reverse = options.reverse;
            }

            if (typeof options.speedMultiplier === 'number' &&  options.speedMultiplier > 0) {
                opt.speedMultiplier = options.speedMultiplier;
            }

            let hasDuration = typeof options.duration === 'number' &&  options.duration > 0 && opt.duration !== options.duration;
            let hasAutoPlay = typeof options.autoPlay === 'boolean';

            if (hasDuration || hasAutoPlay) {
                let isPlaying = self.isPlaying();
                
                if(isPlaying){
                    self.pause();
                }

                if(hasAutoPlay){
                    opt.autoPlay = options.autoPlay || opt.autoPlay;

                    if(!isPlaying && options.autoPlay){
                        isPlaying = true;
                    }
                }

                if(hasDuration){
                    opt.duration = options.duration || opt.duration;
                }

                if(isPlaying){
                    self.play();
                }
            }
        }
    }

    /** 
     * Stops the animation and jumps back to the end of the animation.
     */
    public stop(): void {   
        const self = this;     
        //Jump to the end of the animation. 
        self._rawProgress = 1;
        self._processFrame();
        self._start = null;
    }

    /** 
     * Stops the animation and jumps back to the beginning of the animation.
     */
    public reset(): void {
        const self = this;
         //Jump to the beginning of the animation. 
         self._start = null;
         self._rawProgress = 0;         
         self._processFrame();         
    }

    /** 
     * Callback function that contains the animation frame logic.  
     * @param progress The progress of the animation where 0 is start and 1 is the end.
     */
    public _onAnimationProgress(timestamp: number): void {
        const self = this;
        if (self._start) {
            self._rawProgress = Utils.getProgress(timestamp, self._start, self._options.duration, self._options.speedMultiplier);
            self._processFrame();
        }
    }

    /** 
     * Callback function that contains the animation frame logic.  
     * @param progress The progress of the animation where 0 is start and 1 is the end.
     * @returns Any frame state information to pass to the onprogress event.
     */
    public abstract onAnimationProgress(progress: number): any;

    /**************************
    * Private functions
    ***************************/

    /**
     * Processes the animation frame for the raw progress.
     */
    private _processFrame(): void {
        const self = this;
        const opt = self._options;

        if(typeof self._id !== 'undefined'){
            let progress = self._rawProgress || 0;

            //Animation reached the end.
            if (progress >= 1) {
                if(opt.loop){
                    //Restart the animation.
                    self._rawProgress = 0;    
                    self._start = performance.now();
                } else {
                    //Stop animating. 
                    self._rawProgress = 1;    
                    self._start = null;

                    if (self._onComplete) {
                        self._onComplete();
                    }
                }
            }

            const playProgress = (opt.reverse)? 1 - self._rawProgress: self._rawProgress;

            if (self._easing) {
                progress = self._easing(playProgress);
            }

            const state = self.onAnimationProgress(progress);

            const eventArgs = Object.assign({
                progress: playProgress,
                easingProgress: progress,
                animation: self
            }, state || {});

            self._invokeEvent('onprogress', Object.assign({ type: 'onprogress'}, eventArgs));

            //Check to see if the animation is complete.
            if(self._start === null){
                self._invokeEvent('oncomplete',  Object.assign({ type: 'oncomplete'}, eventArgs));
            }

            if(opt.disposeOnComplete){
                self.dispose();
            }
        }
    }
}