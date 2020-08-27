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

        if(shape instanceof azmaps.Shape){
            this._originPosition = shape.getCoordinates() as azmaps.data.Position;
        } else {
            this._originPosition = shape.getOptions().position;
        }
        
        this._shape = shape;
        this._destinationPosition = newPosition;

        this.setOptions(options);

        if (options && options.autoPlay) {
            this.play();
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

        if(this._originPosition && this._destinationPosition){
            if (this._pathOptions.geodesic) {
                //Calculate the distance and heading between the points. 
                this._dx = azmaps.math.getDistanceTo(this._originPosition, this._destinationPosition);
                this._heading = azmaps.math.getHeading(this._originPosition, this._destinationPosition);
            } else {
                //Calculate the mercator pixels of the coordinates at zoom level 21.
                let pixels = azmaps.math.mercatorPositionsToPixels([this._originPosition, this._destinationPosition], 21);
                this._originPixel = pixels[0];

                //Ensure that the shortest path is taken between coordinates.
                if (Math.abs(this._originPosition[0] - this._destinationPosition[0]) > 180) {
                    let mapWidth = Math.pow(2, 21) * 512;

                    if (pixels[0][0] > pixels[1][0]) {
                        pixels[1][0] += mapWidth;
                    } else {
                        pixels[0][0] += mapWidth;
                    }
                }

                //Calculate the distance and heading between the pixels. 
                this._dx = azmaps.Pixel.getDistance(pixels[0], pixels[1]);
                this._heading = azmaps.Pixel.getHeading(pixels[0], pixels[1]);
            }

            if (this._pathOptions.captureMetadata) {
                Utils.setMetadata(this._shape, {
                    heading: this._heading
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
        if(this._originPosition && this._destinationPosition && this._pathOptions){
            let pos: azmaps.data.Position;
            let animateCamera = false;
            
            if (progress === 1) {
                //Animation is done.
                pos = this._destinationPosition;
            } else if (progress === 0) {
                //Restart animation.
                pos = this._originPosition;
            } else {
                let dx = this._dx * progress;

                //Calculate the coordinate part way between the origin and destination.
                if (this._pathOptions.geodesic) {
                    pos = azmaps.math.getDestination(this._originPosition, this._heading, dx);
                } else {
                    pos = azmaps.math.mercatorPixelsToPositions([azmaps.Pixel.getDestination(this._originPixel, this._heading, dx)], 21)[0];
                }

                animateCamera = true;
            }

            Utils.setCoordinates(this._shape, pos);

            if (this._pathOptions.map) {
                this._setMapCamera(pos, this._heading, animateCamera);
            }

            return {
                position: pos,
                heading: this._heading
            };
        }

        return null;
    }
}