import { IPlayableAnimation } from '../interfaces/IPlayableAnimation';

/** An animation manager for classes that extend from the AnimatedShape class. */
export class AnimationManager {

    /****************************
    * Private Properties
    ***************************/

    private _animation: number = null;
    private _queue: IPlayableAnimation[] = [];
    private _lastTime: number;
    //Min frame rate
    private _minFR = 33; //roughly 30 frames per second is the fastest that the animation loop will update.
    private _stopped = true;
    private _idCounter = 1234567890;
    private _idTable: { [key: number]: IPlayableAnimation } = {};

    /****************************
    * Constructor
    ***************************/

    constructor() {
        this._lastTime = performance.now();
        this.enable();
    }

    /****************************
    * Public functions
    ***************************/

    /** Stops all animations. */
    public disable(): void {
        const self = this;
        if (!self._stopped) {
            self._stopped = true;
            cancelAnimationFrame(self._animation);
        }
    }

    /** Renables animations. Many will likely snap to the end of their animation. */
    public enable(): void {
        const self = this;

        if (self._stopped) {
            self._stopped = false;
            self._animation = requestAnimationFrame(self._animate.bind(self));
        }
    }

    /**
     * Adds an animated object to the animation queue.
     * @param animatable The object to animate.
     */
    public add(animatable: IPlayableAnimation): number {
        const self = this;

        if (!animatable._id) {
            animatable._id = self._getUuid();
        }

        const animation = self._idTable[animatable._id];

        //Only add the animation to the queue if it isn't already in it.
        if (!animation) {
            self._queue.push(animatable);
            self._idTable[animatable._id] = animatable;
        }

        return animatable._id;
    }

    /**
     * Gets an animation by ID.
     * @param id The ID of the animation to get.
     */
    public getById(id: number): IPlayableAnimation {
        return this._idTable[id];
    }

    /**
     * Removes a object from the animation queue.
     * @param animatable The object to remove from the queue.
     */
    public remove(animatable: IPlayableAnimation): void {
        const self = this;

        //Verify animation is in queue.
        if (animatable) {
            const id = animatable._id;

            if (self._idTable[id]) {
                const q = self._queue;                

                //Loop through and find the index of the animation in the array.
                for (let i = q.length - 1; i >= 0; i--) {
                    if (id === q[i]._id) {
                        //Remove it from the queue.
                        self._queue = q.splice(i, 1);
                        //Remove it from the lookup table.
                        self._idTable[id] = undefined;
                        break;
                    }
                }
            }
        }
    }

    /**
     * Removes an animation from the queue by ID.
     * @param id The ID of the animation to remove.
     */
    public removeById(id: number): void {
        this.remove(this._idTable[id]);
    }

    /****************************
    * Public static properties
    ***************************/

    /** A blobal static instance of the AnimationManager. */
    public static instance = new AnimationManager();

    /****************************
    * Private functions
    ***************************/

    /** Loops through the queue and animates a frame for each animatable object. */
    private _animate(): void {
        const self = this;
        if (!self._stopped) {
            let t = performance.now();

            if (t - self._lastTime >= self._minFR) {
                const q = self._queue;
                //Iterate backwards over queue incase the _onTriggerFrameAnimation asks to remove the animation. 
                for (let i = q.length - 1; i >= 0; i--) {
                    try {
                        q[i]._onAnimationProgress(t);
                    } catch{ }
                }

                //Request the next frame of the animation.
                self._lastTime = t;
            }

            self._animation = requestAnimationFrame(self._animate.bind(self));
        }
    }

    /** Retrieves a unique ID from the animation manager. */
    private _getUuid(): number {
        return this._idCounter++;
    }
}