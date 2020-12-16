import * as azmaps from "azure-maps-control";
import { PlayableAnimation } from '../PlayableAnimation';
import { MapPathAnimationOptions } from '../options/MapPathAnimationOptions';

/** An abstract class which defines an animation that will animate the maps camera on each frame as part of a larger animation.  */
export abstract class MapPathPlayableAnaimation extends PlayableAnimation {

    /**************************
    * Private Properties
    ***************************/

    protected _pathOptions: MapPathAnimationOptions = {
        duration: 1000
    };

    /**************************
    * Constructor
    ***************************/

    constructor(options?: MapPathAnimationOptions) {
        super(options);

        this.setOptions(options);
    }

    /**************************
    * Public functions
    ***************************/

    /** Disposes the animation. */
    public dispose(): void {
        this._pathOptions = null;
        super.dispose();
    }
    
    /** Gets the animation options. */
    public getOptions(): MapPathAnimationOptions {
        return Object.assign({}, super.getOptions(), this._pathOptions);
    }

    /** Sets the options of the animation. */
    public setOptions(options: MapPathAnimationOptions): void {       
        if (options) {
            const self = this;
            const opt = self._pathOptions;

            if (typeof options.duration === 'number' && options.duration  > 0) {
                opt.duration = options.duration || opt.duration;
            }

            if (typeof options.captureMetadata === 'boolean') {
                opt.captureMetadata = options.captureMetadata;
            }

            if (typeof options.geodesic === 'boolean') {
                opt.geodesic = options.geodesic;
            }

            if (typeof options.reverse === 'boolean') {
                opt.reverse = options.reverse;
            }

            if (typeof options.pitch === 'number') {
                opt.pitch = options.pitch;
            }

            if (typeof options.zoom === 'number') {
                opt.zoom = options.zoom;
            }

            if (typeof options.rotate === 'boolean') {
                opt.rotate = options.rotate;
            }

            if (typeof options.rotationOffset === 'number') {
                opt.rotationOffset = options.rotationOffset;
            }

            if (options.map || options.map === null) {
                opt.map = options.map;
            }

            super.setOptions(options);
        }
    }

    /**************************
    * Protected functions
    ***************************/
 
    protected _setMapCamera(position: azmaps.data.Position, heading: number, animate: boolean): void {
        const opt = this._pathOptions;

        if (opt.map && position) {
            let cam = <azmaps.CameraOptions>{
                center: position
            };

            if (typeof opt.pitch === 'number') {
                cam.pitch = opt.pitch;
            }

            if (typeof opt.zoom === 'number') {
                cam.zoom = opt.zoom;
            }

            if (opt.rotate && typeof heading === 'number') {
                cam.bearing = (opt.reverse)? heading + 180: heading;

                if (typeof opt.rotationOffset === 'number') {
                    cam.bearing += opt.rotationOffset;
                }
            }

            if (animate) {
                cam.type = 'fly';
                cam.duration = Math.min(60, opt.duration);
            } else {
                cam.type = 'jump';
            }

            //Set the initial view of the map.
            opt.map.setCamera(cam);
        }
    }

    public onAnimationProgress(progress: number): void {
        return null;
    }
}