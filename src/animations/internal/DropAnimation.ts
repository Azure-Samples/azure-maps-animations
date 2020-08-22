import * as azmaps from "azure-maps-control";
import { PlayableAnimationOptions } from '../options/PlayableAnimationOptions';
import { PlayableAnimation } from '../PlayableAnimation';

/** Animates the dropping of a point geometries. */
export class DropAnimation extends PlayableAnimation {
    /****************************
    * Private properties
    ***************************/
   
    private _height = 200;
    private _shapes: (azmaps.Shape | azmaps.HtmlMarker)[];
    private _x0: number[];
    private _y0: number[];

    /**************************
    * Constructor
    ***************************/

    /**
     * Animates the dropping of point geometries or HtmlMarkers.
     * @param shapes An array point geometry shapes or HtmlMarkers to animatie dropping.
     * @param dataSourceOrMap The map or data source to drop the shapes into.
     * @param height The height at which to drop the shape from. Default: 200 pixels
     * @param options Options for the animation.
     */
    constructor(shapes: azmaps.Shape[] | azmaps.HtmlMarker[], dataSourceOrMap?: azmaps.source.DataSource | azmaps.Map, height?: number, options?: PlayableAnimationOptions) {
        super(options);

        if (shapes && shapes.length > 0) {
            this._shapes = shapes;

            this._x0 = [];
            this._y0 = [];
            
            this._height = (typeof height === 'number' && height > 0) ? height : this._height;
            
            var needsAdding = [];
            var offset: number[];

            var ds:azmaps.source.DataSource;
            var map: azmaps.Map;
            var markers: azmaps.HtmlMarker[] = [];
            
            if(dataSourceOrMap instanceof azmaps.source.DataSource){
                ds = dataSourceOrMap;
            }

            if(dataSourceOrMap instanceof azmaps.Map){
                map = dataSourceOrMap;
                markers = map.markers.getMarkers();
            }

            //Extract the offsets for each shape.
            for (var i = 0, len = this._shapes.length; i < len; i++) {
                offset = null;

                if(this._shapes[i] instanceof azmaps.Shape){
                    var prop = (<azmaps.Shape>this._shapes[i]).getProperties();

                    offset = prop['offset'];
                } else {
                    offset = (<azmaps.HtmlMarker>this._shapes[i]).getOptions().pixelOffset;
                }

                if (offset && Array.isArray(offset) && offset.length >= 2) {
                    this._x0.push(offset[0]);
                    this._y0.push(offset[1]);
                } else {
                    this._x0.push(0);
                    this._y0.push(0);

                    offset = [0, 0];
                }

                offset[1] -= this._height;

                if(this._shapes[i] instanceof azmaps.Shape){
                    let s = (<azmaps.Shape>this._shapes[i]);
                    s.setProperties(Object.assign(s.getProperties(), {
                        offset: offset,
                        opacity: 0
                    }));
        
                    //Add the shape to the data source if it isn't already added.
                    if (ds && ds.getShapeById((<azmaps.Shape>this._shapes[i]).getId()) === null) {
                        needsAdding.push(this._shapes[i]);
                    }
                } else {
                    var m = <azmaps.HtmlMarker>this._shapes[i];
                    (m).setOptions({ pixelOffset: offset, visible: false });

                    if(map && markers && markers.indexOf(m) === -1){
                        map.markers.add(m);
                    }
                }
            }

            if(ds && needsAdding.length > 0){
                ds.add(needsAdding);
             }
    
            if (options && options.autoPlay) {
                this.play();
            }  
        } else {
            throw 'No shape specified for animation.';
        }
    }

    /**************************
    * Public Methods
    ***************************/

    /** 
     * The function that contains the animation frame logic.  
     * @param timestamp Timestamp from `performance.now()` that for the animation frame relative to the start time.
     */
    public onAnimationProgress(progress: number): any {
        var offset: number[];

        for (var i = 0, len = this._shapes.length; i < len; i++) {
            var y1 = this._y0[i] - this._height * (1 - progress);

            offset = [this._x0[i], y1];

            if(this._shapes[i] instanceof azmaps.Shape){
                let s = (<azmaps.Shape>this._shapes[i]);
                s.setProperties(Object.assign(s.getProperties(), {
                    offset: offset,
                    opacity: (progress !== 0)? 1 : 0
                }));
            } else {
                (<azmaps.HtmlMarker>this._shapes[i]).setOptions({ pixelOffset: offset, visible: progress !== 0 });
            }
        }

        return null;
    }
}