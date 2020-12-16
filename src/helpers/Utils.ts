import * as azmaps from "azure-maps-control";
import { PointPairValueInterpolation } from '../animations/interfaces/PointPairValueInterpolation';

export class Utils {
    /**
     * Calculates the progress of an animation based on the current timestamp, start time and duration.
     * @param timestamp The current timestamp.
     * @param start The time the animation started.
     * @param duration The duration of the animation.
     * @param speed The speed of the animation.
     */
    public static getProgress(timestamp: number, start: number, duration: number, speed: number): number {
        return Math.max(Math.min((timestamp - start) * speed / duration, 1), 0);
    }

    /**
     * Calculates the start time of an animation based on the progress and duration.
     * @param progress Progress of an animation.
     * @param duration Duration of an animation.
     * @param speed The speed of the animation.
     */
    public static getStartTime(progress: number, duration: number, speed: number): number {
        return performance.now() - Math.round((duration * progress) / speed);
    }

    /**
     * 
     * @param coords The coordinate set.
     * @returns 0 - point, 1 - linestring/multipoint, 2 - polygon/multilinestring, 3 - multipolygon.
     */
    public static getDimensions(coords: any): number {
        if (coords && Array.isArray(coords) && coords.length > 0) {
            if (typeof coords[0] === 'number') {
                return 0; //Point
            } else if (Array.isArray(coords[0]) && coords[0].length > 0) {
                if (typeof coords[0][0] === 'number') {
                    return 1; //MultiPoint or Linestring
                } else if (Array.isArray(coords[0][0]) && coords[0][0].length > 0) {
                    if (typeof coords[0][0][0] === 'number') {
                        return 2; //polygon or multilinestring
                    } else if (Array.isArray(coords[0][0][0]) && coords[0][0][0].length > 0) {
                        if (typeof coords[0][0][0][0] === 'number') {
                            return 3; //MultiPolygon
                        }
                    }
                }
            }
        }

        return -1;
    }

    public static getSuitableCoordinates(shape: azmaps.Shape | azmaps.HtmlMarker, coords: any): any {
        let geomType = 'Point';

        if(shape instanceof azmaps.Shape){
            geomType = shape.getType();
        } 

        if(coords){
            const dim = Utils.getDimensions(coords);

            switch (geomType) {
                case 'Point':
                    switch(dim){
                        case 0:
                            return coords;
                        case 1: 
                            return coords[0];
                        case 2: 
                            return coords[0][0];
                        case 3: 
                            return coords[0][0][0];
                    }    
                    break;
                case 'MultiPoint':
                case 'LineString':
                    switch(dim){
                        case 0:
                            return (geomType === 'MultiPoint')?[coords] : [coords, coords];
                        case 1: 
                            return coords;
                        case 2: 
                            return coords[0];
                        case 3: 
                            return coords[0][0];
                    }    
                    break;
                case 'MultiLineString':
                case 'Polygon':                    
                    switch(dim){
                        case 0:
                            return [[coords, coords, coords]];
                        case 1: 
                            return [coords];
                        case 2: 
                            return coords;
                        case 3: 
                            return coords[0];
                    }    
                    break;
                case 'MultiPolygon':
                    switch(dim){
                        case 0:
                            return [[[coords, coords, coords]]];
                        case 1: 
                            return [[coords]];
                        case 2: 
                            return [coords];
                        case 3: 
                            return coords;
                    }  
                    break;
            }
        }

        return null;
    }

    public static getPixelHeading(origin: azmaps.Pixel, destination: azmaps.Pixel): number {
        const dx = (destination[0] - origin[0]) * Math.PI / 180;
        const dy = (origin[1] - destination[1]) * Math.PI / 180;

        return ((5 / 2 * Math.PI) - Math.atan2(dy, dx)) * 180 / Math.PI % 360;
    }

    public static getPixelDestination(origin: azmaps.Pixel, heading: number, distance: number): azmaps.Pixel {
        return [
            origin[0] + distance * Math.cos((heading + 270) * Math.PI / 180),
            origin[1] + distance * Math.sin((heading + 270) * Math.PI / 180),
        ];
    }

    /** Adds metadata to a shape. */
    public static setMetadata(shape: azmaps.Shape | azmaps.HtmlMarker, metadata: Object): void {
        if(shape && metadata){
            if(shape instanceof azmaps.Shape){
                shape.setProperties(Object.assign(shape.getProperties(), metadata));
            } else if (shape instanceof azmaps.HtmlMarker){
                shape['metadata'] = Object.assign(shape['metadata'] || {}, metadata);
            }
        }
    }

    /** Updates the coordinates of a point or line shape, or an HTML marker. */
    public static setCoordinates(shape: azmaps.Shape | azmaps.HtmlMarker, pos: azmaps.data.Position, positions?: azmaps.data.Position[]): void {
        if (shape) {
            if(shape instanceof azmaps.Shape){
                switch (shape.getType()) {
                    case 'Point':
                        shape.setCoordinates(pos);
                        break;
                    case 'LineString':
                        if(positions){
                            shape.setCoordinates(positions);
                        }
                        break;
                }
            } else if (shape instanceof azmaps.HtmlMarker){
                shape.setOptions({
                    position: pos
                });
            }
        }
    }

    /**
     * Takes a formatted property path string, and breaks it up into its parts.
     * @param path Property path string.
     */
    public static getPropertyPath(path: string): string[] {
        return path.split('/');
    }

    /**
     * Sets a value on an object based on property path.
     * @param obj The object to add the value to.
     * @param propertyPath The path to the property.
     * @param value The value.     
     */
    public static setValue(obj: Object, propertyPath: string[], value: any): void {
        if (propertyPath.length > 1) {
            const key = propertyPath.shift();
            Utils.setValue(obj[key] =
                Object.prototype.toString.call(obj[key]) === '[object Object]' ? obj[key]: {},
                propertyPath,
                value);
        } else {
            obj[propertyPath[0]] = value;
        }
    }
    
    /**
     * Retrieves the value of an object using its path.
     * @param obj The object to get the value from.
     * @param propertyPath The path of the property.
     */
    public static getValue(obj: Object, propertyPath: string[]): any {
        const len = propertyPath.length;

        if (len > 0 && obj) {
            let o = obj[propertyPath[0]];

            if (o != null) {
                let i: number;

                // Step through the property.
                for (i = 1; i < len; i++) {
                    o = o[propertyPath[i]];

                    if (o == null) {
                        break;
                    }
                }

                // Make sure that all properties were stepped through.
                if (i === len && o != null) {
                    return o;
                }
            }
        }

        return null;
    }

    /**
     * Grabs the properties of two points and performs an interpolation between them.
     * @param p1 The first point feature.
     * @param p2 The second point feature.
     * @param offset The offset between the first point and the second point.
     * @param intpr The interpolation expression.
     */
    public static interpolateValue(p1: azmaps.data.Feature<azmaps.data.Point, any>, p2: azmaps.data.Feature<azmaps.data.Point, any>, offset: number, intpr: PointPairValueInterpolation, obj: Object): void {
        if(p1 && p2 && intpr){
            intpr.interpolation = intpr.interpolation || 'linear';
            
            const propertyPath = Utils.getPropertyPath(intpr.propertyPath);
            let v1 = Utils.getValue(p1.properties, propertyPath);
            let v2 = Utils.getValue(p2.properties, propertyPath);

            const t1: string = typeof v1;
            const t2: string = typeof v2;

            if(t1 !== 'undefined' && t2 !== 'undefined' && t1 === t2){
                let tOut: string;

                if(v1 instanceof Date){
                    v1 = v1.getTime();
                    tOut = 'Date';
                }

                if(v2 instanceof Date){
                    v2 = v2.getTime();

                    //If tOut is not set to date, v1 is a different type.
                    if(tOut !== 'Date'){
                        return null;
                    }
                }

                let val: any;                

                if(t1 === 'number' && t2 === 'number'){
                    switch(intpr.interpolation){
                        case 'linear':
                            val = v1 + (v2 - v1) * offset;
                            break;
                        case 'min':
                            val =  Math.min(v1, v2);
                            break;
                        case 'max':
                            val =  Math.max(v1, v2);
                            break;
                        case 'avg':
                            val =  (v1 + v2) * 0.5;
                            break;
                    }
                } else if(intpr.interpolation === 'nearest') {
                    val = (offset < 0.5)? v1 : v2;
                }

                if(typeof val !== 'undefined'){
                    if(tOut === 'Date'){
                        val = new Date(val);
                    } 

                    Utils.setValue(obj, propertyPath, val);
                }
            }
        }

        return null;
    }

    public static extractRoutePointsFromFeature(feature: azmaps.data.Feature<azmaps.data.Geometry, any>, timestampProperty: string): azmaps.data.Feature<azmaps.data.Point, any>[] {
        let pts = [];
        let pt: azmaps.data.Feature<azmaps.data.Point, any>;
        let t: Date;

        switch(feature.geometry.type){
            case 'Point':
                pt = Utils.extractRoutePointFromPoint(<azmaps.data.Feature<azmaps.data.Point, any>>feature, timestampProperty);
                if(pt){
                    pts = [pt];
                }
                break;
            case 'LineString':
            case 'MultiPoint':
                if(feature.properties[timestampProperty] && 
                    Array.isArray(feature.properties[timestampProperty]) && 
                    feature.geometry.coordinates.length === feature.properties[timestampProperty]) {

                    for(let i = 0, len = feature.geometry.coordinates.length; i < len; i++){
                        t = azmaps.math.parseTimestamp(feature.properties[timestampProperty]);

                        if(t){
                            pts.push(new azmaps.data.Feature(new azmaps.data.Point((<azmaps.data.Position[]>feature.geometry.coordinates)[i]), {
                                _timestamp: t.getTime()
                            }));
                        }
                    }
                } 
                //Check to see if the feature has waypoints in its properties which may contain the route point info.
                else if(
                    feature.properties.waypoints && 
                    Array.isArray(feature.properties.waypoints) && 
                    feature.geometry.coordinates.length === feature.properties.waypoints.length && 
                    feature.properties.waypoints.length > 0 &&
                    feature.properties.waypoints[0].geometry) {

                    for(let i = 0, len = feature.geometry.coordinates.length; i < len; i++){
                        if(feature.properties.waypoints[i].geometry.type === 'Point'){
                            pt = Utils.extractRoutePointFromPoint(feature.properties.waypoints[i], timestampProperty);

                            if(pt){
                                pts.push(pt);
                            }
                        }
                    }
                }
                break;
            case 'Polygon':
            case 'MultiPolygon':
            case 'MultiLineString':
                //Do nothing.
                break;
        }

        if(pts.length > 0){
            return pts;
        }

        return null;
    }

    public static extractRoutePointFromPoint(feature: azmaps.data.Feature<azmaps.data.Point, any>, timestampProperty: string): azmaps.data.Feature<azmaps.data.Point, any> {
        //Check to see if the feature has the timestampProperty.
        if(feature.properties[timestampProperty]){
            let t = azmaps.math.parseTimestamp(feature.properties[timestampProperty]);
            
            if(typeof t !== 'undefined'){
                feature.properties._timestamp = t.getTime();
                return feature;
            }
        }

        return null;
    }
}