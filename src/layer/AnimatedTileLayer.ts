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
    constructor(options?: AnimatedTileLayerOptions) {
        super();

        const self = this;
        self._id = AnimationManager.instance.add(self);

        let numFrames = 0;

        if (options) {
            self.setOptions(options);

            if (options.tileLayerOptions) {
                numFrames = options.tileLayerOptions.length;
            }
        }

        self._animation = new FrameBasedAnimationTimer(numFrames, self._onFrame, options);
        self._onComplete = self._animation._onComplete;
    }

    /**************************
    * Public functions
    ***************************/

    /** Disposes the layer. */
    public dispose(): void {
        const self = this;
        self._animation.stop();
        AnimationManager.instance.remove(self);
        AnimationManager.instance.remove(self._animation);
        self._animation = undefined;
        self._onComplete = undefined;
        self._id = undefined;
        self._options = undefined;
    }

    /** Gets the duration of the animation. Returns Infinity if the animations loops forever. */
    public getDuration(): number {
        return (this._options.loop) ? Infinity : this._options.duration;
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
        const self = this;
        const animation = self._animation;
        const map = self._map;
        const opt = self._options;
        let tileLayers = self._tileLayers;

        if (options) {

            if (options.tileLayerOptions) {
                if (tileLayers.length > 0) {
                    if (map) {
                        map.layers.remove(tileLayers);
                    }

                    tileLayers = [];
                    self._tileLayers = tileLayers;
                    self._currentTileLayer = null;
                }

                options.tileLayerOptions.forEach(x => {
                    //Do not allow fade duration or visble to be changed in individual layers.
                    x.fadeDuration = 0;
                    x.visible = true;

                    //Make opacity 0 by default when rendering the layer. Toggling the opacity is smoother than visble for animations.
                    //Additionally, by having opacity set to 0, the map will still load the tiles, even if the layer isn't visible yet. 
                    //This is an easy way to pre-load tiles for better performance.
                    tileLayers.push(new azmaps.layer.TileLayer(Object.assign({}, x, { opacity: 0 })));
                });

                if (map) {
                    map.layers.add(tileLayers, self);
                }

                opt.tileLayerOptions = options.tileLayerOptions;

                if (animation) {
                    animation.setNumberOfFrames(opt.tileLayerOptions.length);
                }

                const frameIdx = (animation) ? self._animation.getCurrentFrameIdx() : 0;
                if (frameIdx >= 0) {
                    self._currentTileLayer = tileLayers[frameIdx];
                    self._currentTileLayer.setOptions({ fadeDuration: 0, visible: true });
                }
            }

            if (typeof options.visible === 'boolean') {
                opt.visible = options.visible;

                if (options.visible) {
                    let frameIdx = animation.getCurrentFrameIdx();
                    if (options.tileLayerOptions.length > 0) {
                        self._currentTileLayer.setOptions({ fadeDuration: 0, opacity: options.tileLayerOptions[frameIdx].opacity });
                    }
                } else {
                    tileLayers.forEach(l => l.setOptions({
                        opacity: 0
                    }));
                }
            }
        }

        if (animation) {
            //Check to see if the options contain any animation options.
            let updateAnimation = false;

            Object.keys(options).forEach(key => {
                switch (key) {
                    case 'tileLayerOptions':
                    case 'visible':
                        break;
                    default:
                        updateAnimation = true;
                        break;
                }
            });

            if (updateAnimation) {
                animation.setOptions(options);
            }
        }
    }

    public onAdd(map: azmaps.Map): void {
        const self = this;
        self._map = map;

        //Need to wait a moment in case someone adds the layer after removing it.
        map.layers.add(self._tileLayers, self);
    }

    public onRemove(): void {
        const self = this;
        self.pause();
        const m = self._map;
        self._map = null;

        //Need to remove sublayers, but after the map has removed this layer as maps dispose/clear will also try and remove the sublayers.
        setTimeout(() => {
            const mapLayers = m.layers.getLayers();

            self._tileLayers.forEach(tl => {
                if (mapLayers.indexOf(tl) > -1) {
                    m.layers.remove(tl);
                }
            });
        }, 0);
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
        var ids = [];
        this._tileLayers.forEach(t => {
            ids.push(t.getId());
        });
        return ids;//[this.id];
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
        const self = this;
        let o = self._options;

        if (self._map && o.visible && o.tileLayerOptions && o.tileLayerOptions.length > 0 && frameIdx < o.tileLayerOptions.length) {
            let m = self._map['map'];
            let ct = self._currentTileLayer;
            let id: string;

            if (ct) {
                id = ct.getId();

                //Use lower level options to change the opacity for more smoothness.
                m.setPaintProperty(id, 'raster-opacity-transition', { duration: 0, delay: 0 });
                m.setPaintProperty(id, 'raster-opacity', 0);
            }

            ct = self._tileLayers[frameIdx];
            self._currentTileLayer = ct;
            id = ct.getId();

            //Use lower level options to change the opacity for more smoothness.
            m.setPaintProperty(id, 'raster-opacity-transition', { duration: 0, delay: 0 });
            m.setPaintProperty(id, 'raster-opacity', o.tileLayerOptions[frameIdx].opacity);
        }
    }

    public _onAnimationProgress(timestamp: number): any {
        return null;
    }
}