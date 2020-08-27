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
            let no:MapPathAnimationOptions = {};

            if (typeof options.duration === 'number' && options.duration  > 0) {
                no.duration = options.duration || this._pathOptions.duration;
            }

            if (typeof options.captureMetadata === 'boolean') {
                no.captureMetadata = options.captureMetadata;
            }

            if (typeof options.geodesic === 'boolean') {
                no.geodesic = options.geodesic;
            }

            if (typeof options.reverse === 'boolean') {
                no.reverse = options.reverse;
            }

            if (typeof options.pitch === 'number') {
                no.pitch = options.pitch;
            }

            if (typeof options.zoom === 'number') {
                no.zoom = options.zoom;
            }

            if (typeof options.rotate === 'boolean') {
                no.rotate = options.rotate;
            }

            if (typeof options.rotationOffset === 'number') {
                no.rotationOffset = options.rotationOffset;
            }

            if (options.map || options.map === null) {
                no.map = options.map;
            }

            Object.assign(this._pathOptions, no);

            super.setOptions(options);
        }
    }

    /**************************
    * Protected functions
    ***************************/
 
    protected _setMapCamera(position: azmaps.data.Position, heading: number, animate: boolean): void {
        if (this._pathOptions.map && position) {
            let cam = <azmaps.CameraOptions>{
                center: position
            };

            if (typeof this._pathOptions.pitch === 'number') {
                cam.pitch = this._pathOptions.pitch;
            }

            if (typeof this._pathOptions.zoom === 'number') {
                cam.zoom = this._pathOptions.zoom;
            }

            if (this._pathOptions.rotate && typeof heading === 'number') {
                cam.bearing = (this._pathOptions.reverse)? heading + 180: heading;

                if (typeof this._pathOptions.rotationOffset === 'number') {
                    cam.bearing += this._pathOptions.rotationOffset;
                }
            }

            if (animate) {
                cam.type = 'fly';
                cam.duration = Math.min(60, this._pathOptions.duration);
            } else {
                cam.type = 'jump';
            }

            //Set the initial view of the map.
            this._pathOptions.map.setCamera(cam);
        }
    }

    public onAnimationProgress(progress: number): void {
        return null;
    }
}