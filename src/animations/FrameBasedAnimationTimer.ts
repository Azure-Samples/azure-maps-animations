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

    private _numFrames: number = 0;
    private _onFrame: (frameIdx: number) => void;
    private _curFrameIdx = -1;

    /**
     * An class for frame based animations.
     * @param numberOfFrames The number of frames in the animation.
     * @param onFrame A callback function to trigger when the frame index changes.
     * @param options Animation options. 
     */
    constructor(numberOfFrames: number, onFrame: (frameIdx: number) => void, options?: PlayableAnimationOptions){
        super(options);
        const self = this;

        self._numFrames = numberOfFrames;
        self._onFrame = onFrame;

        if(options && options.autoPlay){
            self.play();
        }
    }

    /** Gets the current frame index of the animation. Returns -1 if animation hasn't started, or if there is 0 frames. */
    public getCurrentFrameIdx(): number {
        if(this._numFrames <= 0){
            return -1;
        }

        return this._curFrameIdx;
    }

    /** Gets the number of frames in the animation. */
    public getNumberOfFrames(): number {
        return this._numFrames;
    }

    /**
     * Sets the frame index of the animation.
     * @param frameIdx The frame index to advance to.
     */
    public setFrameIdx(frameIdx: number): void {
        const self = this;
        if(frameIdx >= 0 || frameIdx < self._numFrames){
            self.seek(self._numFrames / frameIdx)
        }
    }

    /**
     * Sets the number of frames in the animation.
     * @param numberOfFrames The number of frames in the animation.
     */
    public setNumberOfFrames(numberOfFrames: number): void {
        const self = this;
        if(typeof numberOfFrames === 'number' && self._numFrames !== numberOfFrames){
            self._numFrames = Math.max(numberOfFrames, 0);
            self._curFrameIdx = (numberOfFrames < self._curFrameIdx )? self._curFrameIdx : 0;

            if(numberOfFrames <= 0){
                self._curFrameIdx = -1;
            }

            self._triggerFrame(self._curFrameIdx);
        }
    }

    /////////////////////////////
    // Abstract method override
    ////////////////////////////

    public onAnimationProgress(progress: number): { frameIdx: number } {
        const self = this;
        let nf = self._numFrames;

        if(nf > 0){
            //Need to get even spaced frame periods.
            let frameIdx = Math.round(progress * nf - 0.49999999999999999999999);

            if(frameIdx !== self._curFrameIdx) {
                //When progress exactly 1, the frameIdx will be equal to the number of frames, but we want one less. This means that the last frame will be slightly longer (a couple of ms in a most cases).
                if(frameIdx === nf){
                    frameIdx--;
                } else if(frameIdx < 0){
                    //Unlikely to happen, but an extra check to be safe. Ignore any frames that are negative.
                    frameIdx = -1;
                }

                self._triggerFrame(frameIdx);

                return  { frameIdx: frameIdx };
            }
        }
        
        return null;
    }

    private _triggerFrame(frameIdx): void {
        const self = this;
        if(self._onFrame && frameIdx !== -1){
            self._onFrame(frameIdx);
        } 

        self._curFrameIdx = frameIdx;

        if(frameIdx !== -1){
            self._invokeEvent('onframe',  {
                type: 'onFrame',
                frameIdx: frameIdx,
                animation: self,
                numFrames: self._numFrames
            });
        }
    }
}