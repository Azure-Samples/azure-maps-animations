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
            const self = this;
            self._shapes = shapes;

            const x0 = [];
            self._x0 = x0;

            const y0 = [];            
            self._y0 = y0;
            
            self._height = (typeof height === 'number' && height > 0) ? height : self._height;
            
            const needsAdding = [];
            let offset: number[];

            let ds:azmaps.source.DataSource;
            let map: azmaps.Map;
            let markers: azmaps.HtmlMarker[] = [];
            
            if(dataSourceOrMap instanceof azmaps.source.DataSource){
                ds = dataSourceOrMap;
            }

            if(dataSourceOrMap instanceof azmaps.Map){
                map = dataSourceOrMap;
                markers = map.markers.getMarkers();
            }

            //Extract the offsets for each shape.
            for (let i = 0, len = shapes.length; i < len; i++) {
                offset = null;

                if(shapes[i] instanceof azmaps.Shape){
                    let prop = (<azmaps.Shape>shapes[i]).getProperties();

                    offset = prop['offset'];
                } else {
                    offset = (<azmaps.HtmlMarker>shapes[i]).getOptions().pixelOffset;
                }

                if (offset && Array.isArray(offset) && offset.length >= 2) {
                    x0.push(offset[0]);
                    y0.push(offset[1]);
                } else {
                    x0.push(0);
                    y0.push(0);

                    offset = [0, 0];
                }

                offset[1] -= self._height;

                if(shapes[i] instanceof azmaps.Shape){
                    const s = (<azmaps.Shape>shapes[i]);
                    s.setProperties(Object.assign(s.getProperties(), {
                        offset: offset,
                        opacity: 0
                    }));
        
                    //Add the shape to the data source if it isn't already added.
                    if (ds && ds.getShapeById((<azmaps.Shape>shapes[i]).getId()) === null) {
                        needsAdding.push(shapes[i]);
                    }
                } else {
                    const m = <azmaps.HtmlMarker>shapes[i];
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
                self.play();
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
        const self = this;
        const shapes = self._shapes;
        let offset: number[];
        let y1: number;

        for (let i = 0, len = shapes.length; i < len; i++) {
            y1 = self._y0[i] - self._height * (1 - progress);

            offset = [self._x0[i], y1];

            if(shapes[i] instanceof azmaps.Shape){
                let s = (<azmaps.Shape>shapes[i]);
                s.setProperties(Object.assign(s.getProperties(), {
                    offset: offset,
                    opacity: (progress !== 0)? 1 : 0
                }));
            } else {
                (<azmaps.HtmlMarker>shapes[i]).setOptions({ pixelOffset: offset, visible: progress !== 0 });
            }
        }

        return null;
    }
}