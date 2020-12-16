import { IPlayableAnimation } from '../interfaces/IPlayableAnimation';
import { AnimationManager } from './AnimationManager';

/** A simple animation class that can replace the logic of setTimeout and setInterval. */
export class SimpleIntervalAnimation implements IPlayableAnimation {

    public _id: number;
    public _onComplete: () => void;
    
    private _start: number;

    private _intervalCb: string | Function;
    private _delay: number = 1;
    private _numberOfInv: number = Infinity;
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
        const self = this;
        self._id =  AnimationManager.instance.add(self);
        self._intervalCb = intervalCallback;
        self._arguments = args;

        if(delay >= 0){
            self._delay = delay;
        }

        if(numberOfIOntervals > 0){
            self._numberOfInv = numberOfIOntervals;
        }
    }
    
    /** Disposes the animation. */
    public dispose(): void {
        const self = this;
        AnimationManager.instance.remove(self);
       
        Object.keys(self).forEach(k => {
            self[k] = undefined;
        });
    }

    /** Gets the duration of the animation. Returns Infinity if the animations loops forever. */
    public getDuration(): number {
        return this._numberOfInv * this._delay;
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
        const self = this;
        self._start = null;
        self._currentInterval = self._numberOfInv;
    }
    
    public _onAnimationProgress(timestamp: number): void {
        const self = this;

        if (self._start) {
            let intervalIdx = Math.round((timestamp - self._start) / self._delay);

            if(intervalIdx !== self._currentInterval){
                self._currentInterval = intervalIdx;

                if(self._intervalCb){
                    //Call setTimeout without any time, so that it calls the callback function asynchronously.
                    setTimeout(self._intervalCb, 0, self._arguments);
                }

                if(intervalIdx >= self._numberOfInv){
                    self._start = null;
                    
                    if(self._onComplete){
                        self._onComplete();
                        self.dispose();
                    }
                }
            }
        }
    }
}