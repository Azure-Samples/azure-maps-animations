import { IPlayableAnimation } from './interfaces/IPlayableAnimation';
import * as azmaps from "azure-maps-control";
import { GroupAnimationOptions } from './options/GroupAnimationOptions';
import { setTimeout } from './static';

/** The events supported by the `GroupAnimation`. */
export interface GroupAnimationEvents {

    /** Event fired when the animation has completed. */
    oncomplete: void;
}

/** Group animation handler. */
export class GroupAnimation extends azmaps.internal.EventEmitter<GroupAnimationEvents> {
    
    private _animations: (IPlayableAnimation | GroupAnimation)[];
    private _cancelAnimations = false;
    private _isPlaying = false;

    private _options: GroupAnimationOptions = {
        playType: 'together',
        interval: 100,
        autoPlay: false
    };
    
    public _onComplete = () => {};

    /**************************
    * Constructor
    ***************************/

    /**
     * Group animation handler.
     * @param animations Array of animations to handle.
     */
    constructor(animations: (IPlayableAnimation | GroupAnimation)[], options?: GroupAnimationOptions) {
        super();
        const self = this;

        self._animations = animations;

        if(options){
            self.setOptions(options);
        } else {
            self._calculateDuration();
        }
    }

    /**************************
    * Public functions
    ***************************/

    /** Disposes the animation. */
    public dispose(): void {
        const self = this;
        self.stop();
        self._options = null;
        self._animations = null;
        self._onComplete = null;
        self._isPlaying = null;
        self._cancelAnimations = null;
    }

    /** Gets the duration of the animation. */
    public getDuration(): number {
        return this._calculateDuration();
    }

    /** Gets the animation options. */
    public getOptions(): GroupAnimationOptions {
        return Object.assign({}, this._options);
    }

    /** Checks to see if the animaiton is playing. */
    public isPlaying(): boolean {
        return this._isPlaying;
    }

    /**
     * Plays the group of animations.
     * @param reset Specifies if the animation should reset before playing.
     */
    public play(reset?: boolean): void {
        const self = this;

        if(reset) {
            self.reset();
        }
        
        self._cancelAnimations = false;

        switch(self._options.playType){
            case 'together':
                self._playTogether();
                break;
            case 'sequential':
                self._playSeq();    
                break;
            case 'interval':
                self._playInterval();
                break;
        }
    }

    /** 
     * Stops all animations and jumps back to the beginning of each animation.
     */
    public reset(): void {
        const self = this;
        //Prevent any queued animations from starting.
        self._cancelAnimations = true;

        const animations = self._animations;

        //Stop all animations that are playing. 
        if (animations && animations.length > 0) {
            for (let i = 0; i < animations.length; i++) {
                animations[i].reset();
            }
        }

        self._isPlaying = false;
    }

    /** Stops all animations and jumps to the final state of each animation. */
    public stop(): void {
        const self = this;
        //Prevent any queued animations from starting.
        self._cancelAnimations = true;

        const animations = self._animations;

        //Stop all animations that are playing. 
        if (animations && animations.length > 0) {
            for (let i = 0; i <animations.length; i++) {
                animations[i].stop();
            }
        }

        self._isPlaying = false;
    }

    /**
     * Sets the options of the animation.
     * @param options Options to apply to the animation.
     */
    public setOptions(options: GroupAnimationOptions): void {
        if(options){
            const self = this;
            const opt = self._options;
            let isPlaying = self._isPlaying;

            if(isPlaying){
                self.stop();
            }

            if(options.playType && ['together', 'sequential', 'interval'].indexOf(options.playType) !== -1){
                opt.playType = options.playType;
            }

            if (typeof options.autoPlay === 'boolean') {
                opt.autoPlay = options.autoPlay;

                if(!isPlaying && options.autoPlay){
                    isPlaying = true;
                }
            }

            if(typeof options.interval === 'number'){
                opt.interval = (options.interval > 0) ? Math.abs(options.interval) : 100;
            }

            self._calculateDuration();

            if(isPlaying){
                self.play();
            }
        }
    }

    /**************************
    * Private functions
    ***************************/

    /**
     * Plays an array of animations together at the same time.
     */
    private _playTogether(): void {
        const self = this;
        const animations = this._animations;

        if (animations && animations.length > 0) {
            self._isPlaying = true;

            for (let i = 0; i < animations.length; i++) {
                if(i === animations.length - 1){
                    animations[i]._onComplete = () => {
                        self._isPlaying = false;

                        //Animations complete.
                        self._invokeEvent('oncomplete', null);
                    };
                }

                animations[i].play();
            }
        }
    }

    /**
     * Plays an array of animations sequentially. Looping of any animation will be disabled.
     */
    private _playSeq(): void {
        const self = this;
        const animations = self._animations;

        if (animations && animations.length > 0) {
            self._isPlaying = true;
            let idx = 0;

            let callback = () => {
                if(self._isPlaying){
                    if (idx > 0) {
                        //Only use the callback once.
                        animations[idx - 1]._onComplete = null;
                    }

                    if (!self._cancelAnimations && idx < animations.length) {
                        animations[idx]._onComplete = callback;
                        animations[idx].play();
                        idx++;
                    } else {
                        self._isPlaying = false;

                        //Animations complete.
                        self._invokeEvent('oncomplete', null);
                    }
                }
            };

            callback();
        }
    }

    /**
     * Plays an array of animations one by one based on an interval. 
     */
    private _playInterval(): void {
        const self = this;
        const animations = self._animations;

        if (animations && animations.length > 0) {
            self._isPlaying = true;            

            let idx = 0;
            let p = function () {
                if(self._isPlaying){
                    if (!self._cancelAnimations && idx < animations.length) {
                        if(idx === animations.length - 1){
                            animations[idx]._onComplete = () => {
                                if(self._isPlaying){
                                    self._isPlaying = false;

                                    //Animations complete.
                                    self._invokeEvent('oncomplete', null);
                                }
                            };
                        }

                        animations[idx].play();
                        idx++;

                        setTimeout(function () {
                            p();
                        }, self._options.interval);
                    } else if (self._cancelAnimations && self._isPlaying){
                        self._isPlaying = false;

                        //Animations complete.
                        self._invokeEvent('oncomplete', null);
                    }
                }
            }
            p();
        }
    }

    /** Calculates the total duration of the animation. */
    private _calculateDuration(): number {
        const self = this;
        let maxPostInterval = 0;
        let intervalRemaining = 0;
        let max = 0;
        let sum = 0;
        const options = self._options;
        const animations = self._animations;
        const totalInterval = options.interval * animations.length;

        animations.forEach((a, i, arr) => {
            const d = a.getDuration();

            intervalRemaining = totalInterval - i * options.interval;

            if(intervalRemaining < d){
                maxPostInterval = Math.max(maxPostInterval, d - intervalRemaining);
            }

            max = Math.max(max, d);
            sum += d;
        });

        let duration = 0;

        switch(options.playType){
            case 'together':
                duration = max;
                break;
            case 'sequential':
                duration = sum;
                break;
            case 'interval':                
                duration = maxPostInterval + totalInterval;
                break;
        }

        return duration;
    }
}