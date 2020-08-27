import { FrameBasedAnimationTimer } from '../animations/FrameBasedAnimationTimer';
import * as azmaps from "azure-maps-control";
import { AnimatedTileLayerOptions } from './AnimatedTileLayerOptions';
import { IPlayableAnimation } from '../animations/interfaces/IPlayableAnimation';
import { AnimationManager } from '../animations/internal/AnimationManager';

/** A layer that can smoothly animate through an array of tile layers. */
export class AnimatedTileLayer extends azmaps.layer.Layer implements IPlayableAnimation {

    /**************************
    * Internal properties
    ***************************/

    public _id: number;
    public _onComplete: () => void;
    
    /**************************
    * Private properties
    ***************************/

    private _tileLayers: azmaps.layer.TileLayer[] = [];
    private _currentTileLayer: azmaps.layer.TileLayer;
    private _map: azmaps.Map;
    private _animation: FrameBasedAnimationTimer;
    private _options: AnimatedTileLayerOptions = {
        tileLayerOptions: [],
        visible: true
    };

    /**************************
    * Constructor
    ***************************/

    /**
     * A layer that can smoothly animate through an array of tile layers.
     * @param options Options for the layer.
     */
    constructor(options?: AnimatedTileLayerOptions){
        super();

        this._id =  AnimationManager.instance.add(this);

        let numFrames = 0;

        if(options) {
            this.setOptions(options);

            if(options.tileLayerOptions){
                numFrames = options.tileLayerOptions.length;
            }
        }
        
        this._animation = new FrameBasedAnimationTimer(numFrames, this._onFrame, options);
        this._onComplete = this._animation._onComplete;
    }
    
    /**************************
    * Public functions
    ***************************/

    /** Disposes the layer. */
    public dispose(): void {       
        this._animation.stop();
        AnimationManager.instance.remove(this);
        AnimationManager.instance.remove(this._animation);
        this._animation = undefined;
        this._onComplete = undefined;
        this._id = undefined;
        this._options = undefined;        
    }

    /** Gets the duration of the animation. Returns Infinity if the animations loops forever. */
    public getDuration(): number {
        return (this._options.loop)? Infinity : this._options.duration;
    }

    /** Gets the options for the layer. */
    public getOptions(): AnimatedTileLayerOptions {
        return Object.assign({}, this._options, this._animation.getOptions());
    }

    /** Gets the underlying frame based animation instance. */
    public getPlayableAnimation(): FrameBasedAnimationTimer {
        return this._animation;
    }

    /**
     * Checks to see if the animaiton is playing.
     */
    public isPlaying(): boolean {
        return this._animation.isPlaying();
    }

    /**
     * Pauses the animation.
     */
    public pause(): void {
        this._animation.pause();
    }

    /**
     * Plays the animation.
     */
    public play(): void {
        this._animation.play();
    }

    /** Stops the animation and jumps back to the beginning the animation. */
    public reset(): void {
        this._animation.reset();
    }
    
    /** Stops the animation. */
    public stop(): void {
        this._animation.stop();
    }

    /**
     * Sets the frame index of the animation.
     * @param frameIdx The frame index to advance to.
     */
    public setFrameIdx(frmeIdx: number): void {
        this._animation.setFrameIdx(frmeIdx);
    }

    /** 
     * Sets the options of the layer.
     * @param options The options to apply to the layer.
     */
    public setOptions(options: AnimatedTileLayerOptions): void {
        if(options.tileLayerOptions) {
            if(this._tileLayers.length > 0){
                if(this._map){
                    this._map.layers.remove(this._tileLayers);
                }

                this._tileLayers = [];
                this._currentTileLayer = null;
            }

            options.tileLayerOptions.forEach(x => {
                //Do not allow fade duration or visble to be changed in individual layers.
                x.fadeDuration = 0;
                x.visible = true;

                //Make opacity 0 by default when rendering the layer. Toggling the opacity is smoother than visble for animations.
                //Additionally, by having opacity set to 0, the map will still load the tiles, even if the layer isn't visible yet. 
                //This is an easy way to pre-load tiles for better performance.
                this._tileLayers.push(new azmaps.layer.TileLayer(Object.assign({}, x, { opacity: 0 })));
            });            

            if(this._map){
                this._map.layers.add(this._tileLayers, this);
            }

            this._options.tileLayerOptions = options.tileLayerOptions;

            if(this._animation){
                this._animation.setNumberOfFrames(this._options.tileLayerOptions.length);
            }

            var frameIdx = (this._animation)? this._animation.getCurrentFrameIdx(): 0;
            if(frameIdx >= 0){
                this._currentTileLayer = this._tileLayers[frameIdx];
                this._currentTileLayer.setOptions({ fadeDuration: 0, visible: true });
            }
        }

        if(typeof options.visible === 'boolean') {
            this._options.visible = options.visible;
            
            if(options.visible){
                let frameIdx = this._animation.getCurrentFrameIdx();
                if(options.tileLayerOptions.length > 0){
                    this._currentTileLayer.setOptions({ fadeDuration: 0, opacity: options.tileLayerOptions[frameIdx].opacity });
                }
            } else {
                this._tileLayers.forEach(l => l.setOptions({
                    opacity: 0
                }));
            }
        }

        if(this._animation){
            //Check to see if the options contain any animation options.
            let updateAnimation = false;

            Object.keys(options).forEach(key => {
                switch(key){
                    case 'tileLayerOptions':
                    case 'visible':
                        break;
                    default:
                    updateAnimation = true;
                    break;
                }
            });       

            if(updateAnimation){
                this._animation.setOptions(options);
            }
        }
    }    

    public onAdd(map: azmaps.Map): void {
        this._map = map;
        map.layers.add(this._tileLayers, this);
    }

    public onRemove(): void {
        this._map.layers.remove(this._tileLayers);
        this._map = null;
    }

    /**
     * @internal
     */
    public _buildLayers(): any {
        return [];
    }

     /**
     * @internal
     */
    public _getLayerIds(): string[] {
        return [this.id];
    }

    /**
     * @internal
     */
    public _buildSource(): any {
        return null;
    }

    /**
     * @internal
     */
    public _getSourceId() {
        return null;
    }
    
    /**************************
    * Private functions
    ***************************/

    private _onFrame = (frameIdx: number): void => {
        let o = this._options;

        if(o.visible && o.tileLayerOptions && o.tileLayerOptions.length > 0 && frameIdx < o.tileLayerOptions.length) {
            let m = this._map['map'];
            let ct = this._currentTileLayer;
            let id: string;

            if(ct){
                id = ct.getId();

                //Use lower level options to change the opacity for more smoothness.
                m.setPaintProperty(id, 'raster-opacity-transition', { duration: 0,  delay: 0});
                m.setPaintProperty(id, 'raster-opacity', 0);
            } 

            ct = this._tileLayers[frameIdx];
            this._currentTileLayer = ct;
            id = ct.getId();
            
            //Use lower level options to change the opacity for more smoothness.
            m.setPaintProperty(id, 'raster-opacity-transition', { duration: 0,  delay: 0});
            m.setPaintProperty(id, 'raster-opacity', o.tileLayerOptions[frameIdx].opacity);
        }
    }

    public _onAnimationProgress(timestamp: number): any {
       return null;
    }
}