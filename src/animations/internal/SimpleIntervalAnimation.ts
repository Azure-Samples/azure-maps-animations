import { IPlayableAnimation } from '../interfaces/IPlayableAnimation';
import { AnimationManager } from './AnimationManager';

/** A simple animation class that can replace the logic of setTimeout and setInterval. */
export class SimpleIntervalAnimation implements IPlayableAnimation {

    public _id: number;
    public _onComplete: () => void;
    
    private _start: number;

    private _intervalCallback: string | Function;
    private _delay: number = 1;
    private _numberOfIOntervals: number = Infinity;
    private _currentInterval: number = 0;
    private _arguments: any[];

    /**
     * A simple animation class that can replace the logic of setTimeout and setInterval.
     * @param intervalCallback The callback function for each interval.
     * @param delay The interval time in ms.
     * @param numberOfIOntervals The number of intervals.
     * @param arguments Any additional arguments to pass to the callback function.
     */
    constructor(intervalCallback: string | Function, delay: number, numberOfIOntervals?: number, ...args: any[]) {
        this._id =  AnimationManager.instance.add(this);
        this._intervalCallback = intervalCallback;
        this._arguments = args;

        if(delay >= 0){
            this._delay = delay;
        }

        if(numberOfIOntervals > 0){
            this._numberOfIOntervals = numberOfIOntervals;
        }
    }
    
    /** Disposes the animation. */
    public dispose(): void {
        AnimationManager.instance.remove(this);
        this._id = undefined;
        this._delay = undefined;
        this._start = undefined;
        this._intervalCallback = undefined;
        this._numberOfIOntervals = undefined;
        this._currentInterval = undefined;
        this._onComplete = undefined;
    }

    /** Gets the duration of the animation. Returns Infinity if the animations loops forever. */
    public getDuration(): number {
        return this._numberOfIOntervals * this._delay;
    }

    /** Checks to see if the animaiton is playing.  */
    public isPlaying(): boolean {
        return this._start != null;
    }

    /** Pauses the animation. */
    public pause(): void {
        this._start = null;
    }

    /** Plays the animation. */
    public play(): void {
        this._start = performance.now();
    }

    /** Stops the animation and resets the interval back to 0. */
    public reset(): void {
        this._start = null;
        this._currentInterval = 0;
    }

     /** Stops the animation and jumps to the last interval. */
    public stop(): void {
        this._start = null;
        this._currentInterval = this._numberOfIOntervals;
    }
    
    public _onAnimationProgress(timestamp: number): void {
        if (this._start) {
            let intervalIdx = Math.round((timestamp - this._start) / this._delay);

            if(intervalIdx !== this._currentInterval){
                this._currentInterval = intervalIdx;

                if(this._intervalCallback){
                    //Call setTimeout without any time, so that it calls the callback function asynchronously.
                    setTimeout(this._intervalCallback, 0, this._arguments);
                }

                if(intervalIdx >= this._numberOfIOntervals){
                    this._start = null;
                    
                    if(this._onComplete){
                        this._onComplete();
                        this.dispose();
                    }
                }
            }
        }
    }
}