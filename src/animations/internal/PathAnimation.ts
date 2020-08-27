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

        let isPlaying = this.isPlaying();

        if(isPlaying){
            this.pause();
        }

        if(this._positions){
            
            let tl = 0;
            let distances = [];
            let heading = [];
            const pos = this._positions;

            //Calculate the distances and headings between the positions.
            if (this._pathOptions.geodesic) {

                for (let i = 1, len = pos.length; i < len; i++) {
                    let d = azmaps.math.getDistanceTo(pos[i - 1], pos[i]);
                    tl += d;
                    distances.push(d);

                    let h = azmaps.math.getHeading(pos[i - 1], pos[i]);
                    heading.push(h);
                }
            } else {
                //Calculate the mercator pixels of the coordinates at zoom level 21.
                let pixels = azmaps.math.mercatorPositionsToPixels(pos, 21);
                this._pixels = pixels;

                for (let i = 1, len = pixels.length; i < len; i++) {
                    let d = azmaps.Pixel.getDistance(pixels[i - 1], pixels[i]);
                    tl += d;
                    distances.push(d);

                    let h = Utils.getPixelHeading(pixels[i - 1], pixels[i]);
                    heading.push(h);
                }
            }

            this._totalLength = tl;
            this._distances = distances;
            this._headings = heading;

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
        let pos: azmaps.data.Position;
        let heading: number;
        let shape = this._shape;

        const sourcePos = this._positions;
        const headings = this._headings;
        const distances = this._distances;
        const pathOptions = this._pathOptions;
        const totalLength = this._totalLength;
        

        if (progress === 1) {
            //Animation is done.
            pos = sourcePos[sourcePos.length - 1];
            heading = (headings.length > 0) ? headings[headings.length - 1] : undefined;

            if (pathOptions.map) {
                this._setMapCamera(pos, heading, false);
            } 

            Utils.setCoordinates(shape, pos, positions);
        } else if (progress === 0) {
            pos = sourcePos[0];
            heading = (headings.length > 0)? headings[0] : undefined;

            if (pathOptions.map) {
                this._setMapCamera(pos, heading, false);
            } 

            Utils.setCoordinates(shape, pos, [pos, pos]);
        } else {
            var dx = totalLength * progress;
            var positions: azmaps.data.Position[] = null;

            //Calculate the coordinate part way between the origin and destination.
            if (pathOptions.geodesic) {

                if (dx > totalLength) {
                    heading = headings[headings.length - 1];
                    positions = sourcePos.slice(0);
                } else if (dx < 0) {
                    heading = headings[0];
                    positions = sourcePos.slice(0, 1);
                } else {
                    var travelled = 0;

                    for (var i = 0; i < distances.length; i++) {
                        if (travelled + distances[i] >= dx) {
                            heading = headings[i];
                            positions = sourcePos.slice(0, i + 1);
                            positions.push(azmaps.math.getDestination(sourcePos[i], heading, dx - travelled));
                            break;
                        } else {
                            travelled += distances[i];
                        }
                    }
                }
            } else {
                var px = null;
                const pixels = this._pixels;

                if (dx > totalLength) {
                    heading = headings[headings.length - 1];
                    px = Utils.getPixelDestination(pixels[pixels.length - 1], heading, dx - totalLength);
                    positions = sourcePos.slice(0);
                    positions.push((azmaps.math.mercatorPixelsToPositions([px], 21)[0]));
                } else if (dx < 0) {
                    heading = headings[0];
                    px = Utils.getPixelDestination(pixels[0], heading, dx);
                    positions = sourcePos.slice(0, 1);
                    positions.push(azmaps.math.mercatorPixelsToPositions([px], 21)[0]);
                } else {
                    var travelled = 0;

                    for (var i = 0; i < distances.length; i++) {
                        if (travelled + distances[i] >= dx) {
                            heading = headings[i];
                            px = Utils.getPixelDestination(pixels[i], heading, dx - travelled);
                            positions = sourcePos.slice(0, i + 1);
                            positions.push(azmaps.math.mercatorPixelsToPositions([px], 21)[0]);
                            break;
                        } else {
                            travelled += distances[i];
                        }
                    }
                }
            }

            if (positions && positions.length > 0) {
                pos = positions[positions.length - 1];

                if (pathOptions.map) {
                    //Animate to the next view.
                    this._setMapCamera(pos, heading, positions.length > 2);
                } 

                Utils.setCoordinates(shape, pos, positions);
            }
        }

        if (pathOptions.captureMetadata) {
            Utils.setMetadata(shape, { heading: heading });
        }

        return {
            position: pos,
            heading: heading
        };
    }
}