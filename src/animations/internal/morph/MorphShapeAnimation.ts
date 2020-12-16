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
    private _interp: GeometryInterpolator;
    private _heading: number;
    private _pixelHeading: number;

    /**************************
    * Constructor
    ***************************/

    constructor(shape: azmaps.Shape, newGeometry: azmaps.data.Geometry, options?: MapPathAnimationOptions) {
        super();
        const self = this;
        const bbox = azmaps.data.BoundingBox;

        self._shape = shape;

        var g = shape.toJson().geometry;

        //For circles, if the new geometry is not a point, then pass in a polygon of the circle.
        if(shape.isCircle() && newGeometry.type !== 'Point') {
            g = new azmaps.data.Polygon(shape.getCircleCoordinates());
        }

        self._interp = new GeometryInterpolator(shape.toJson().geometry, newGeometry);

        var lastCenter = bbox.getCenter(self._shape.getBounds());
        var newCenter = bbox.getCenter(bbox.fromData(newGeometry));

        self._heading = azmaps.math.getHeading(lastCenter, newCenter);

        var pixels = azmaps.math.mercatorPositionsToPixels([lastCenter, newCenter], 21);
        self._pixelHeading = Utils.getPixelHeading(pixels[0], pixels[1])

        if (options){
            self.setOptions(options);

            if(options.autoPlay) {
                self.play();
            }  
        }

        AnimationManager.instance.add(self);
    }

    /**************************
    * Public Methods
    ***************************/

    public onAnimationProgress(progress: number): {
        position: azmaps.data.Position,
        heading: number
    } {
        const self = this;
        const bbox = azmaps.data.BoundingBox;
        const g = self._interp.interpolate(progress);

        const newCenter = bbox.getCenter(bbox.fromData(g));

        let heading: number = 0;

        if(self._pathOptions.geodesic){
            heading = self._heading;
        } else {
            heading = self._pixelHeading;
        }

        if(self._pathOptions.map){
            self._setMapCamera(newCenter, heading, true);
        }

        let s = self._shape;

        if(self._pathOptions.captureMetadata){
            s.addProperty('heading', heading);
        }

        //If shape is a circle and geometry is a Point, just set coordinates.
        if(s.isCircle() && g.type === 'Point') {
            s.setCoordinates(g.coordinates);
        } else {
            //TODO: Update with supported function in future.
            s['data'].geometry.type = g.type;
            s.setCoordinates(g.coordinates);
        }

        return {
            position: newCenter,
            heading: heading
        };
    }
}