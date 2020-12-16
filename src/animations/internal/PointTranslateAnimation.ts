import * as azmaps from "azure-maps-control";
import { MapPathAnimationOptions } from '../options/MapPathAnimationOptions';
import { MapPathPlayableAnaimation } from './MapPathPlayableAnimation';
import { Utils } from '../../helpers/Utils';

/** Translates a Point object from one coordinate to another. */
export class PointTranslateAnimation extends MapPathPlayableAnaimation {
    /****************************
    * Private properties
    ***************************/

    private _shape: azmaps.Shape | azmaps.HtmlMarker;
    private _originPosition: azmaps.data.Position;
    private _destinationPosition: azmaps.data.Position;
    private _dx: number;
    private _heading: number;
    private _originPixel: azmaps.Pixel;

    /**************************
    * Constructor
    ***************************/

    /**
     * Animates the dropping of a point geometries.
     * @param shapes An array point geometry shapes to animatie dropping.
     * @param options Options for the animation.
     */
    constructor(shape: azmaps.Shape | azmaps.HtmlMarker, newPosition?: azmaps.data.Position, options?: MapPathAnimationOptions) {
        super();
        const self = this;

        let pos: azmaps.data.Position;
        if(shape instanceof azmaps.Shape){
            pos = shape.getCoordinates() as azmaps.data.Position;
        } else {
            pos = shape.getOptions().position;
        }

        self._originPosition = pos;
        self._shape = shape;
        self._destinationPosition = newPosition;

        self.setOptions(options);

        if (options && options.autoPlay) {
            self.play();
        }  
    }

    /**************************
    * Public Methods
    ***************************/

    /** Sets the options of the animation. */
    public setOptions(options: MapPathAnimationOptions): void {
        if(options){
            super.setOptions(options);
        }

        const self = this;
        const oPos = self._originPosition;
        const destPos = self._destinationPosition;
        const mapMath = azmaps.math;
        const azPixel = azmaps.Pixel;

        if(oPos && destPos){
            if (self._pathOptions.geodesic) {
                //Calculate the distance and heading between the points. 
                self._dx = mapMath.getDistanceTo(oPos, destPos);
                self._heading = mapMath.getHeading(oPos, destPos);
            } else {
                //Calculate the mercator pixels of the coordinates at zoom level 21.
                let pixels = mapMath.mercatorPositionsToPixels([oPos, destPos], 21);
                self._originPixel = pixels[0];

                //Ensure that the shortest path is taken between coordinates.
                if (Math.abs(oPos[0] - destPos[0]) > 180) {
                    let mapWidth = Math.pow(2, 21) * 512;

                    if (pixels[0][0] > pixels[1][0]) {
                        pixels[1][0] += mapWidth;
                    } else {
                        pixels[0][0] += mapWidth;
                    }
                }

                //Calculate the distance and heading between the pixels. 
                self._dx = azPixel.getDistance(pixels[0], pixels[1]);
                self._heading = azPixel.getHeading(pixels[0], pixels[1]);
            }

            if (self._pathOptions.captureMetadata) {
                Utils.setMetadata(self._shape, {
                    heading: self._heading
                });
            }
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
        const self = this;
        const oPos = self._originPosition;
        const heading = self._heading;
        const destPos = self._destinationPosition;
        const mapMath = azmaps.math;
        const opt = self._pathOptions;

        if(oPos && destPos && opt){
            let pos: azmaps.data.Position;
            let animateCamera = false;
            
            if (progress === 1) {
                //Animation is done.
                pos = destPos;
            } else if (progress === 0) {
                //Restart animation.
                pos = oPos;
            } else {
                let dx = self._dx * progress;

                //Calculate the coordinate part way between the origin and destination.
                if (opt.geodesic) {
                    pos = mapMath.getDestination(oPos, heading, dx);
                } else {
                    pos = mapMath.mercatorPixelsToPositions([azmaps.Pixel.getDestination(self._originPixel, heading, dx)], 21)[0];
                }

                animateCamera = true;
            }

            Utils.setCoordinates(self._shape, pos);

            if (opt.map) {
                self._setMapCamera(pos, heading, animateCamera);
            }

            return {
                position: pos,
                heading: heading
            };
        }

        return null;
    }
}