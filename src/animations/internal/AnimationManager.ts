import { IPlayableAnimation } from '../interfaces/IPlayableAnimation';

/** An animation manager for classes that extend from the AnimatedShape class. */
export class AnimationManager {

    /****************************
    * Private Properties
    ***************************/

    private _animation: number = null;
    private _queue: IPlayableAnimation[] = [];
    private _lastTime: number;
    private _minFrameRate = 33; //roughly 30 frames per second is the fastest that the animation loop will update.
    private _stopped = true;
    private _idCounter = 1234567890;
    private _idLookupTable: { [key: number]: IPlayableAnimation } = {};

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
        if (!this._stopped) {
            this._stopped = true;
            cancelAnimationFrame(this._animation);
        }
    }

    /** Renables animations. Many will likely snap to the end of their animation. */
    public enable(): void {
        if (this._stopped) {
            this._stopped = false;
            this._animation = requestAnimationFrame(this.animate.bind(this));
        }
    }

    /**
     * Adds an animated object to the animation queue.
     * @param animatable The object to animate.
     */
    public add(animatable: IPlayableAnimation): number {
        if(!animatable._id){
            animatable._id = this._getUuid();
        }

        let animation = this._idLookupTable[animatable._id];

        //Only add the animation to the queue if it isn't already in it.
        if (!animation) {
            this._queue.push(animatable);
            this._idLookupTable[animatable._id] = animatable;
        }

        return animatable._id;
    }

    /**
     * Gets an animation by ID.
     * @param id The ID of the animation to get.
     */
    public getById(id: number): IPlayableAnimation {
        return this._idLookupTable[id];
    }

    /**
     * Removes a object from the animation queue.
     * @param animatable The object to remove from the queue.
     */
    public remove(animatable: IPlayableAnimation): void {
        //Verify animation is in queue.
        if(animatable && this._idLookupTable[animatable._id]){
            //Loop through and find the index of the animation in the array.
            for(var i = this._queue.length -1; i >=0; i--){
                if(animatable._id === this._queue[i]._id){
                    //Remove it from the queue.
                    this._queue = this._queue.splice(i, 1);                    
                    //Remove it from the lookup table.
                    this._idLookupTable[animatable._id] = undefined;
                    break;
                }
            }
        }
    }

    /**
     * Removes an animation from the queue by ID.
     * @param id The ID of the animation to remove.
     */
    public removeById(id: number): void {
        this.remove(this._idLookupTable[id]);
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
    private animate(): void {
        if (!this._stopped) {
            let t = performance.now();

            if (t - this._lastTime >= this._minFrameRate) {
                //Iterate backwards over queue incase the _onTriggerFrameAnimation asks to remove the animation. 
                for (let i = this._queue.length - 1; i >= 0; i--) {
                    try {
                        this._queue[i]._onAnimationProgress(t);
                    } catch(e){ }
                }

                //Request the next frame of the animation.
                this._lastTime = t;
            }

            this._animation = requestAnimationFrame(this.animate.bind(this));
        }
    }

    /** Retrieves a unique ID from the animation manager. */
    private _getUuid(): number {
        return this._idCounter++;
    }
}