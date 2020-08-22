import * as azmaps from "azure-maps-control";
import { MapPathAnimationOptions } from '../options/MapPathAnimationOptions';
import { Utils } from '../../helpers/Utils';
import { MapPathPlayableAnaimation } from './MapPathPlayableAnimation';

/** Translates a Point object along a path or animates a LineString as a snakeline. */
export class PathAnimation extends MapPathPlayableAnaimation {

    /**************************
    * Private Properties
    ***************************/

    private _totalLength: number;
    private _positions: azmaps.data.Position[];
    private _pixels: azmaps.Pixel[];
    private _distances: number[];
    private _headings: number[];
    private _shape: azmaps.Shape | azmaps.HtmlMarker;

    /**************************
    * Constructor
    ***************************/

    constructor(path: azmaps.data.Position[], shape?: azmaps.Shape | azmaps.HtmlMarker, options?: MapPathAnimationOptions) {
        super();

        this._shape = shape;
        this._positions = path;

        this.setOptions(Object.assign({
            rotate: true,
            rotationOffset: 0
        }, options || {}));

        if (options && options.autoPlay) {
            this.play();
        } 
    }

    /**************************
    * Public Methods
    ***************************/

    /** Gets the animation options. */
    public dispose(): void {
        this._totalLength = null;
        this._positions = null;
        this._pixels = null;
        this._distances = null;
        this._headings = null;
        this._shape = null;

        super.dispose();
    }

    /** Sets the options of the animation. */
    public setOptions(options: MapPathAnimationOptions): void {
        if(options){
            super.setOptions(options);
        }

        var isPlaying = this.isPlaying();

        if(isPlaying){
            this.pause();
        }

        if(this._positions){
            this._totalLength = 0;
            this._distances = [];
            this._headings = [];
            
            //Calculate the distances and headings between the positions.
            if (this._pathOptions.geodesic) {
                for (var i = 1, len = this._positions.length; i < len; i++) {
                    var d = azmaps.math.getDistanceTo(this._positions[i - 1], this._positions[i]);
                    this._totalLength += d;
                    this._distances.push(d);

                    var h = azmaps.math.getHeading(this._positions[i - 1], this._positions[i]);
                    this._headings.push(h);
                }
            } else {
                //Calculate the mercator pixels of the coordinates at zoom level 21.
                this._pixels = azmaps.math.mercatorPositionsToPixels(this._positions, 21);

                for (var i = 1, len = this._pixels.length; i < len; i++) {
                    var d = azmaps.Pixel.getDistance(this._pixels[i - 1], this._pixels[i]);
                    this._totalLength += d;
                    this._distances.push(d);

                    var h = Utils.getPixelHeading(this._pixels[i - 1], this._pixels[i]);
                    this._headings.push(h);
                }
            }

            if (this._pathOptions.captureMetadata) {
                Utils.setMetadata(this._shape, { heading: this._headings[0] });
            }
        }  

        if(isPlaying){
            this.play();
        }
    }

    /** 
     * Callback function that contains the animation frame logic.  
     * @param progress The progress of the animation where 0 is start and 1 is the end.
     */
    public onAnimationProgress(progress: number): {
        position: azmaps.data.Position,
        heading: number
    } {
        var pos: azmaps.data.Position;
        var heading: number;

        if (progress === 1) {
            //Animation is done.
            pos = this._positions[this._positions.length - 1];
            heading = (this._headings.length > 0) ? this._headings[this._headings.length - 1] : undefined;

            if (this._pathOptions.map) {
                this._setMapCamera(pos, heading, false);
            } 

            Utils.setCoordinates(this._shape, pos, positions);
        } else if (progress === 0) {
            pos = this._positions[0];
            heading = (this._headings.length > 0)? this._headings[0] : undefined;

            if (this._pathOptions.map) {
                this._setMapCamera(pos, heading, false);
            } 

            Utils.setCoordinates(this._shape, pos, [pos, pos]);
        } else {
            var dx = this._totalLength * progress;
            var positions: azmaps.data.Position[] = null;

            //Calculate the coordinate part way between the origin and destination.
            if (this._pathOptions.geodesic) {

                if (dx > this._totalLength) {
                    heading = this._headings[this._headings.length - 1];
                    positions = this._positions.slice(0);
                } else if (dx < 0) {
                    heading = this._headings[0];
                    positions = this._positions.slice(0, 1);
                } else {
                    var travelled = 0;

                    for (var i = 0; i < this._distances.length; i++) {
                        if (travelled + this._distances[i] >= dx) {
                            heading = this._headings[i];
                            positions = this._positions.slice(0, i + 1);
                            positions.push(azmaps.math.getDestination(this._positions[i], heading, dx - travelled));
                            break;
                        } else {
                            travelled += this._distances[i];
                        }
                    }
                }
            } else {
                var px = null;

                if (dx > this._totalLength) {
                    heading = this._headings[this._headings.length - 1];
                    px = Utils.getPixelDestination(this._pixels[this._pixels.length - 1], heading, dx - this._totalLength);
                    positions = this._positions.slice(0);
                    positions.push((azmaps.math.mercatorPixelsToPositions([px], 21)[0]));
                } else if (dx < 0) {
                    heading = this._headings[0];
                    px = Utils.getPixelDestination(this._pixels[0], heading, dx);
                    positions = this._positions.slice(0, 1);
                    positions.push(azmaps.math.mercatorPixelsToPositions([px], 21)[0]);
                } else {
                    var travelled = 0;

                    for (var i = 0; i < this._distances.length; i++) {
                        if (travelled + this._distances[i] >= dx) {
                            heading = this._headings[i];
                            px = Utils.getPixelDestination(this._pixels[i], heading, dx - travelled);
                            positions = this._positions.slice(0, i + 1);
                            positions.push(azmaps.math.mercatorPixelsToPositions([px], 21)[0]);
                            break;
                        } else {
                            travelled += this._distances[i];
                        }
                    }
                }
            }

            if (positions && positions.length > 0) {
                pos = positions[positions.length - 1];

                if (this._pathOptions.map) {
                    //Animate to the next view.
                    this._setMapCamera(pos, heading, positions.length > 2);
                } 

                Utils.setCoordinates(this._shape, pos, positions);
            }
        }

        if (this._pathOptions.captureMetadata) {
            Utils.setMetadata(this._shape, { heading: heading });
        }

        return {
            position: pos,
            heading: heading
        };
    }
}