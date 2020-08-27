import { PlayableAnimation } from './PlayableAnimation';
import { PlayableAnimationOptions } from './options/PlayableAnimationOptions';

/** Event arguments for a frame based animation. */
export interface FrameBasedAnimationEvent {
    /** The event type. */
    type: string;

    /** The animation the event occurered on. */
    animation: FrameBasedAnimationTimer;

    /** The index of the frame if using the frame based animation timer. */
    frameIdx?: number;

    /** The number of frames in the animation. */
    numFrames?: number;
}

/** A class for frame based animations. */
export class FrameBasedAnimationTimer extends PlayableAnimation {

    private _numberOfFrames: number = 0;
    private _onFrame: (frameIdx: number) => void;
    private _currentFrameIdx = -1;

    /**
     * An class for frame based animations.
     * @param numberOfFrames The number of frames in the animation.
     * @param onFrame A callback function to trigger when the frame index changes.
     * @param options Animation options. 
     */
    constructor(numberOfFrames: number, onFrame: (frameIdx: number) => void, options?: PlayableAnimationOptions){
        super(options);

        this._numberOfFrames = numberOfFrames;
        this._onFrame = onFrame;

        if(options && options.autoPlay){
            this.play();
        }
    }

    /** Gets the current frame index of the animation. Returns -1 if animation hasn't started, or if there is 0 frames. */
    public getCurrentFrameIdx(): number {
        if(this._numberOfFrames <= 0){
            return -1;
        }

        return this._currentFrameIdx;
    }

    /** Gets the number of frames in the animation. */
    public getNumberOfFrames(): number {
        return this._numberOfFrames;
    }

    /**
     * Sets the frame index of the animation.
     * @param frameIdx The frame index to advance to.
     */
    public setFrameIdx(frameIdx: number): void {
        if(frameIdx >= 0 || frameIdx < this._numberOfFrames){
            this.seek(this._numberOfFrames / frameIdx)
        }
    }

    /**
     * Sets the number of frames in the animation.
     * @param numberOfFrames The number of frames in the animation.
     */
    public setNumberOfFrames(numberOfFrames: number): void {
        if(typeof numberOfFrames === 'number' && this._numberOfFrames !== numberOfFrames){
            this._numberOfFrames = Math.max(numberOfFrames, 0);
            this._currentFrameIdx = (numberOfFrames < this._currentFrameIdx )? this._currentFrameIdx : 0;

            if(numberOfFrames <= 0){
                this._currentFrameIdx = -1;
            }

            this._triggerFrame(this._currentFrameIdx);
        }
    }

    /////////////////////////////
    // Abstract method override
    ////////////////////////////

    public onAnimationProgress(progress: number): { frameIdx: number } {
        let nf = this._numberOfFrames;

        if(nf > 0){
            //Need to get even spaced frame periods.
            let frameIdx = Math.round(progress * nf - 0.49999999999999999999999);

            if(frameIdx !== this._currentFrameIdx) {
                //When progress exactly 1, the frameIdx will be equal to the number of frames, but we want one less. This means that the last frame will be slightly longer (a couple of ms in a most cases).
                if(frameIdx === nf){
                    frameIdx--;
                } else if(frameIdx < 0){
                    //Unlikely to happen, but an extra check to be safe. Ignore any frames that are negative.
                    frameIdx = -1;
                }

                this._triggerFrame(frameIdx);

                return  { frameIdx: frameIdx };
            }
        }
        
        return null;
    }

    private _triggerFrame(frameIdx): void {
        if(this._onFrame && frameIdx !== -1){
            this._onFrame(frameIdx);
        } 

        this._currentFrameIdx = frameIdx;

        if(frameIdx !== -1){
            this._invokeEvent('onframe',  {
                type: 'onFrame',
                frameIdx: frameIdx,
                animation: this,
                numFrames: this._numberOfFrames
            });
        }
    }
}