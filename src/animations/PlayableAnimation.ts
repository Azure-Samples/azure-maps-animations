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

        this._id = AnimationManager.instance.add(this);
        this.setOptions(options);       
    }

    /**************************
    * Public Methods
    ***************************/

    /** Disposes the animation. */
    public dispose(): void {
        this.stop();
        AnimationManager.instance.remove(this);
        this._options = null;
        this._easing = null;
        this._start = null;
        this._onComplete = null;
        this._id = undefined;
        this._rawProgress = null;
    }

    /** Gets the duration of the animation. Returns Infinity if the animations loops forever. */
    public getDuration(): number {
        return (this._options.loop)? Infinity : this._options.duration / this._options.speedMultiplier;
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
     */
    public play(): void {

        if (this._rawProgress >= 1){
            //Animation is complete, restart.
            this._rawProgress = 0;
        }

        if(this._rawProgress > 0){
            //Animation is paused, calculated offset start time of animation.
            this._start = Utils.getStartTime(this._rawProgress, this._options.duration, this._options.speedMultiplier);
        } else {
            this._start = performance.now();
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
        if(typeof progress === 'number') {
            var isPLaying = this.isPlaying();

            if(isPLaying){
                this.pause();
            }

            this._rawProgress = Math.min(Math.max(progress, 0), 1) / this._options.speedMultiplier;
            this._processFrame();

            if(isPLaying){
                this.play();
            }
        }
    }

    /** Sets the options of the animation. */
    public setOptions(options: PlayableAnimationOptions): void {
        if(options){
            if (options.easing){
                if(typeof options.easing === 'string' && Easings[options.easing]) {
                    this._easing = Easings[options.easing];
                    this._options.easing = options.easing;
                } else if(options.easing instanceof Function){
                    this._easing = options.easing;
                    this._options.easing = options.easing;
                }
            }

            if (typeof options.loop === 'boolean') {
                this._options.loop = options.loop;
            }

            if (typeof options.disposeOnComplete === 'boolean') {
                this._options.disposeOnComplete = options.disposeOnComplete;
            }

            if (typeof options.reverse === 'boolean') {
                this._options.reverse = options.reverse;
            }

            if (typeof options.speedMultiplier === 'number' &&  options.speedMultiplier > 0) {
                this._options.speedMultiplier = options.speedMultiplier;
            }

            let hasDuration = typeof options.duration === 'number' &&  options.duration > 0 && this._options.duration !== options.duration;
            let hasAutoPlay = typeof options.autoPlay === 'boolean';

            if (hasDuration || hasAutoPlay) {
                var isPlaying = this.isPlaying();
                
                if(isPlaying){
                    this.pause();
                }

                if(hasAutoPlay){
                    this._options.autoPlay = options.autoPlay || this._options.autoPlay;

                    if(!isPlaying && options.autoPlay){
                        isPlaying = true;
                    }
                }

                if(hasDuration){
                    this._options.duration = options.duration || this._options.duration;
                }

                if(isPlaying){
                    this.play();
                }
            }
        }
    }

    /** 
     * Stops the animation and jumps back to the end of the animation.
     */
    public stop(): void {        
        //Jump to the end of the animation. 
        this._rawProgress = 1;
        this._processFrame();
        this._start = null;
    }

    /** 
     * Stops the animation and jumps back to the beginning of the animation.
     */
    public reset(): void {
         //Jump to the beginning of the animation. 
         this._start = null;
         this._rawProgress = 0;         
         this._processFrame();         
    }

    /** 
     * Callback function that contains the animation frame logic.  
     * @param progress The progress of the animation where 0 is start and 1 is the end.
     */
    public _onAnimationProgress(timestamp: number): void {
        if (this._start) {
            this._rawProgress = Utils.getProgress(timestamp, this._start, this._options.duration, this._options.speedMultiplier);
            this._processFrame();
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
        if(typeof this._id !== 'undefined'){
            var progress = this._rawProgress || 0;

            //Animation reached the end.
            if (this._rawProgress >= 1) {
                if(this._options.loop){
                    //Restart the animation.
                    this._rawProgress = 0;    
                    this._start = performance.now();
                } else {
                    //Stop animating. 
                    this._rawProgress = 1;    
                    this._start = null;

                    if (this._onComplete) {
                        this._onComplete();
                    }
                }
            }

            var playProgress = (this._options.reverse)? 1 - this._rawProgress: this._rawProgress;

            if (this._easing) {
                progress = this._easing(playProgress);
            }

            var state = this.onAnimationProgress(progress);

            var eventArgs = Object.assign({
                progress: playProgress,
                easingProgress: progress,
                animation: this
            }, state || {});

            this._invokeEvent('onprogress', Object.assign({ type: 'onprogress'}, eventArgs));

            //Check to see if the animation is complete.
            if(this._start === null){
                this._invokeEvent('oncomplete',  Object.assign({ type: 'oncomplete'}, eventArgs));
            }

            if(this._options.disposeOnComplete){
                this.dispose();
            }
        }
    }
}