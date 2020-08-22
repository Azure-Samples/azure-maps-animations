import * as azmaps from "azure-maps-control";
import { MapPathAnimationOptions } from '../../options/MapPathAnimationOptions';
import { AnimationManager } from '../AnimationManager';
import { Utils } from '../../../helpers/Utils';
import { GeometryInterpolator } from './GeometryInterpolator';
import { MapPathPlayableAnaimation } from '../MapPathPlayableAnimation';

/** Animates the morphing of a shape from one geometry type or set of coordinates to another. */
export class MorphShapeAnimation extends MapPathPlayableAnaimation {
    
    /**************************
    * Private Properties
    ***************************/

    private _shape: azmaps.Shape;
    private _interpolator: GeometryInterpolator;
    private _heading: number;
    private _pixelHeading: number;

    /**************************
    * Constructor
    ***************************/

    constructor(shape: azmaps.Shape, newGeometry: azmaps.data.Geometry, options?: MapPathAnimationOptions) {
        super();

        this._shape = shape;

        var g = shape.toJson().geometry;

        //For circles, if the new geometry is not a point, then pass in a polygon of the circle.
        if(shape.isCircle() && newGeometry.type !== 'Point') {
            g = new azmaps.data.Polygon(shape.getCircleCoordinates());
        }

        this._interpolator = new GeometryInterpolator(shape.toJson().geometry, newGeometry);

        var lastCenter = azmaps.data.BoundingBox.getCenter(this._shape.getBounds());
        var newCenter = azmaps.data.BoundingBox.getCenter(azmaps.data.BoundingBox.fromData(newGeometry));

        this._heading = azmaps.math.getHeading(lastCenter, newCenter);

        var pixels = azmaps.math.mercatorPositionsToPixels([lastCenter, newCenter], 21);
        this._pixelHeading = Utils.getPixelHeading(pixels[0], pixels[1])

        if (options){
            this.setOptions(options);

            if(options.autoPlay) {
                this.play();
            }  
        }

        AnimationManager.instance.add(this);
    }

    /**************************
    * Public Methods
    ***************************/

    public onAnimationProgress(progress: number): {
        position: azmaps.data.Position,
        heading: number
    } {
        var g = this._interpolator.interpolate(progress);

        var newCenter = azmaps.data.BoundingBox.getCenter(azmaps.data.BoundingBox.fromData(g));

        var heading: number = 0;

        if(this._pathOptions.geodesic){
            heading = this._heading;
        } else {
            heading = this._pixelHeading;
        }

        if(this._pathOptions.map){
            this._setMapCamera(newCenter, heading, true);
        }

        if(this._pathOptions.captureMetadata){
            this._shape.addProperty('heading', heading);
        }

        //If shape is a circle and geometry is a Point, just set coordinates.
        if(this._shape.isCircle() && g.type === 'Point') {
            this._shape.setCoordinates(g.coordinates);
        } else {
            //TODO: Update with supported function in future.
            this._shape['data'].geometry.type = g.type;
            this._shape.setCoordinates(g.coordinates);
        }

        return {
            position: newCenter,
            heading: heading
        };
    }
}