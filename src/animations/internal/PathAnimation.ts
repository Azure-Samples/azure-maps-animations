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
        const self = this;

        self._shape = shape;
        self._positions = path;

        self.setOptions(Object.assign({
            rotate: true,
            rotationOffset: 0
        }, options || {}));

        if (options && options.autoPlay) {
            self.play();
        } 
    }

    /**************************
    * Public Methods
    ***************************/

    /** Gets the animation options. */
    public dispose(): void {
        Object.keys(this).forEach(k => {
            this[k] = undefined;
        });

        super.dispose();
    }

    /** Sets the options of the animation. */
    public setOptions(options: MapPathAnimationOptions): void {
        const self = this;

        if(options){
            super.setOptions(options);
        }

        let isPlaying = self.isPlaying();

        if(isPlaying){
            self.pause();
        }

        if(self._positions){
            
            let tl = 0;
            let distances = [];
            let heading = [];
            const pos = self._positions;
            const mapMath = azmaps.math;

            //Calculate the distances and headings between the positions.
            if (self._pathOptions.geodesic) {

                for (let i = 1, len = pos.length; i < len; i++) {
                    let d = mapMath.getDistanceTo(pos[i - 1], pos[i]);
                    tl += d;
                    distances.push(d);

                    let h = mapMath.getHeading(pos[i - 1], pos[i]);
                    heading.push(h);
                }
            } else {
                //Calculate the mercator pixels of the coordinates at zoom level 21.
                let pixels = mapMath.mercatorPositionsToPixels(pos, 21);
                self._pixels = pixels;

                for (let i = 1, len = pixels.length; i < len; i++) {
                    let d = azmaps.Pixel.getDistance(pixels[i - 1], pixels[i]);
                    tl += d;
                    distances.push(d);

                    let h = Utils.getPixelHeading(pixels[i - 1], pixels[i]);
                    heading.push(h);
                }
            }

            self._totalLength = tl;
            self._distances = distances;
            self._headings = heading;

            if (self._pathOptions.captureMetadata) {
                Utils.setMetadata(self._shape, { heading: self._headings[0] });
            }
        }  

        if(isPlaying){
            self.play();
        }
    }

    /** 
     * Callback function that contains the animation frame logic.  
     * @param progress The progress of the animation where 0 is start and 1 is the end.
     */
    public onAnimationProgress(progress: number): { position: azmaps.data.Position, heading: number} {
        const self = this;
        let pos: azmaps.data.Position;
        let heading: number;
        const shape = self._shape;

        const sourcePos = self._positions;
        const headings = self._headings;
        const distances = self._distances;
        const pathOptions = self._pathOptions;
        const totalLength = self._totalLength;
        const mapMath = azmaps.math;        

        if (progress === 1) {
            //Animation is done.
            pos = sourcePos[sourcePos.length - 1];
            heading = (headings.length > 0) ? headings[headings.length - 1] : undefined;

            if (pathOptions.map) {
                self._setMapCamera(pos, heading, false);
            } 

            Utils.setCoordinates(shape, pos, sourcePos);
        } else if (progress === 0) {
            pos = sourcePos[0];
            heading = (headings.length > 0)? headings[0] : undefined;

            if (pathOptions.map) {
                self._setMapCamera(pos, heading, false);
            } 

            Utils.setCoordinates(shape, pos, [pos, pos]);
        } else {
            const dx = totalLength * progress;
            let positions: azmaps.data.Position[] = null;

            //Calculate the coordinate part way between the origin and destination.
            if (pathOptions.geodesic) {

                if (dx > totalLength) {
                    heading = headings[headings.length - 1];
                    positions = sourcePos.slice(0);
                } else if (dx < 0) {
                    heading = headings[0];
                    positions = sourcePos.slice(0, 1);
                } else {
                    let travelled = 0;

                    for (let i = 0; i < distances.length; i++) {
                        if (travelled + distances[i] >= dx) {
                            heading = headings[i];
                            positions = sourcePos.slice(0, i + 1);
                            positions.push(mapMath.getDestination(sourcePos[i], heading, dx - travelled));
                            break;
                        } else {
                            travelled += distances[i];
                        }
                    }
                }
            } else {
                let px = null;
                const pixels = self._pixels;

                if (dx > totalLength) {
                    heading = headings[headings.length - 1];
                    px = Utils.getPixelDestination(pixels[pixels.length - 1], heading, dx - totalLength);
                    positions = sourcePos.slice(0);
                    positions.push(mapMath.mercatorPixelsToPositions([px], 21)[0]);
                } else if (dx < 0) {
                    heading = headings[0];
                    px = Utils.getPixelDestination(pixels[0], heading, dx);
                    positions = sourcePos.slice(0, 1);
                    positions.push(mapMath.mercatorPixelsToPositions([px], 21)[0]);
                } else {
                    let travelled = 0;

                    for (let i = 0; i < distances.length; i++) {
                        if (travelled + distances[i] >= dx) {
                            heading = headings[i];
                            px = Utils.getPixelDestination(pixels[i], heading, dx - travelled);
                            positions = sourcePos.slice(0, i + 1);
                            positions.push(mapMath.mercatorPixelsToPositions([px], 21)[0]);
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
                    self._setMapCamera(pos, heading, positions.length > 2);
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