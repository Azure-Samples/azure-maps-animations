import * as azmaps from "azure-maps-control";
import { PlayableAnimation } from './PlayableAnimation';
import { IPlayableAnimation } from './interfaces/IPlayableAnimation';
import { PlayableAnimationOptions } from './options/PlayableAnimationOptions';
import { MapPathAnimationOptions } from './options/MapPathAnimationOptions';
import { PathAnimationOptions } from './options/PathAnimationOptions';
import { DropAnimation } from './internal/DropAnimation';
import { PointTranslateAnimation } from './internal/PointTranslateAnimation';
import { Utils } from '../helpers/Utils';
import { PathAnimation } from './internal/PathAnimation';
import { MorphShapeAnimation } from './internal/morph/MorphShapeAnimation';
import { AnimationManager } from './internal/AnimationManager';
import { SimpleIntervalAnimation } from './internal/SimpleIntervalAnimation';
import { RoutePathAnimationOptions } from './options/RoutePathAnimationOptions';
import { RoutePathAnimation } from './internal/RoutePathAnimation';
import { Easings } from './internal/Easings';
import { FrameBasedAnimationTimer } from './FrameBasedAnimationTimer';
import { MovingDashLineOptions } from './options/MovingDashLineOptions';
import { OpacityAnimation } from "./internal/OpacityAnimation";

/**
 * Adds an offset array property to point shapes and animates it's y value to simulate dropping. 
 * Use with a symbol layer with the icon/text offset property set to ['get', 'offset'] and the opacity set to ['get', 'opacity'].
 * @param shapes A one or more point geometries or shapes to drop in. 
 * @param datasource The data source to drop the point shapes into.
 * @param height The height at which to drop the shape from. Default: 1000 pixels
 * @param options Options for the animation.
 */
export function drop(
    shapes: azmaps.data.Point | azmaps.data.Feature<azmaps.data.Point, any> | azmaps.Shape | (azmaps.data.Point | azmaps.data.Feature<azmaps.data.Point, any> | azmaps.Shape)[],
    dataSource?: azmaps.source.DataSource,
    height?: number,
    options?: PlayableAnimationOptions): PlayableAnimation {
    let s: azmaps.Shape[] = [];

    if (Array.isArray(shapes)) {
        for (let i = 0, len = shapes.length; i < len; i++) {
            if ((shapes[i]['type'] === 'Feature' && shapes[i]['geometry']['type'] === 'Point') || shapes[i]['type'] === 'Point') {
                s.push(new azmaps.Shape(shapes[i] as azmaps.data.Point));
            } else if (shapes[i] instanceof azmaps.Shape && (shapes[i] as azmaps.Shape).getType() === 'Point') {
                s.push(shapes[i] as azmaps.Shape);
            }
        }
    } else if ((shapes['type'] === 'Feature' && shapes['geometry']['type'] === 'Point') || shapes['type'] === 'Point') {
        s.push(new azmaps.Shape(shapes as azmaps.data.Point));
    } else if (shapes instanceof azmaps.Shape && shapes.getType() === 'Point') {
        s.push(shapes);
    }

    if (s.length > 0) {
        return new DropAnimation(s, dataSource, height, options);
    }

    throw 'No supported shapes specified.'
}

/**
 * Adds an offset to HtmlMarkers to animate it's y value to simulate dropping. Animation modifies `pixelOffset` value of HtmlMarkers. 
 * @param markers A one or more HtmlMarkers to drop in. 
 * @param map The map to drop the markers into.
 * @param height The height at which to drop the shape from. Default: 1000 pixels
 * @param options Options for the animation.
 */
export function dropMarkers(markers: azmaps.HtmlMarker | azmaps.HtmlMarker[], map?: azmaps.Map, height?: number, options?: PlayableAnimationOptions): PlayableAnimation {
    let s: azmaps.HtmlMarker[] = [];

    if (Array.isArray(markers)) {
        for (let i = 0, len = markers.length; i < len; i++) {
            if (markers[i] instanceof azmaps.HtmlMarker) {
                s.push(markers[i] as azmaps.HtmlMarker);
            }
        }
    } else if (markers instanceof azmaps.HtmlMarker) {
        s.push(markers as azmaps.HtmlMarker);
    }

    if (s.length > 0) {
        return new DropAnimation(s, map, height, options);
    }

    throw 'No markers specified.';
}

/**
 * Animates the update of coordinates on a shape or HtmlMarker. Shapes will stay the same type. Only base animation options supported for geometries other than Point. 
 * @param shape The shape to animate.
 * @param newCoordinates The new coordinates of the shape. Must be the same dimension as required by the shape or suitable subset will be picked. 
 * @param options Options for the animation.
 */
export function setCoordinates(shape: azmaps.Shape | azmaps.HtmlMarker, newCoordinates: azmaps.data.Position | azmaps.data.Position[] | azmaps.data.Position[][] | azmaps.data.Position[][][], options?: PathAnimationOptions | MapPathAnimationOptions): PlayableAnimation {
    let c = Utils.getSuitableCoordinates(shape, newCoordinates);

    if (shape instanceof azmaps.Shape) {
        let t = shape.getType();
        if (t === 'Point') {
            return new PointTranslateAnimation(shape, c as azmaps.data.Position, options);
        } else if (t !== 'GeometryCollection') {
            return new MorphShapeAnimation(shape, {
                type: shape.getType(),
                coordinates: c
            }, options);
        }
    }

    return new PointTranslateAnimation(shape, c as azmaps.data.Position, options);
}

/**
 * Animates the path of a LineString. 
 * @param shape A LineString shape to animate.
 * @param options Options for the animation.
 */
export function snakeline(shape: azmaps.Shape, options?: PathAnimationOptions | MapPathAnimationOptions): PlayableAnimation {
    if (shape && shape.getType() === 'LineString') {
        return new PathAnimation((shape.getCoordinates() as azmaps.data.Position[]).slice(0), shape, options);
    }

    throw 'Specified shape is not a LineString type, or no map specified.';
}

/**
 * Animates a map and/or a Point shape, or marker along a path. 
 * @param path The path to animate the point along. Must be either an array of positions, or a LineString geometry/shape.
 * @param shape A Point shape or marker to animate along the path.
 * @param options Options for the animation.
 */
export function moveAlongPath(path: azmaps.data.Position[] | azmaps.data.LineString | azmaps.Shape, shape?: azmaps.Shape | azmaps.HtmlMarker, options?: PathAnimationOptions | MapPathAnimationOptions): PlayableAnimation {
    if ((shape && (shape instanceof azmaps.HtmlMarker || (shape instanceof azmaps.Shape && shape.getType() === 'Point'))) || (options && options['map'])) {
        let p: azmaps.data.Position[];

        if (path) {
            if (Array.isArray(path)) {
                //Must be an array of positions.
                p = path;
            } else if (path instanceof azmaps.Shape) {
                if (path.getType() === 'LineString') {
                    p = <azmaps.data.Position[]>path.getCoordinates();
                } else if (path.getType() === 'Polygon') {
                    const c = <azmaps.data.Position[][]>path.getCoordinates();

                    if (c.length > 0) {
                        p = c[0];
                    }
                }
            } else if (path.type === 'LineString') {
                p = path.coordinates;
            }
        }

        if (p.length < 2) {
            throw 'Invalid path option specified.'
        }

        return new PathAnimation(p, shape, options);
    }

    throw 'Specified shape is not a Point type, or not map specified.';
}

/**
 * Animates a map and/or a Point shape along a route path. The movement will vary based on timestamps within the point feature properties. All points must have a `timestamp` property that is a `Date.getTime()` value. Use the `extractRoutePoints` function to preprocess data.
 * @param shape A Point shape to animate.
 * @param route The route path to animate the point along. Each feature must have a `_timestamp` property.
 * @param options Options for the animation.
 */
export function moveAlongRoute(route: azmaps.data.Feature<azmaps.data.Point, any>[], shape?: azmaps.Shape | azmaps.HtmlMarker, options?: RoutePathAnimationOptions): RoutePathAnimation {
    if (route.length < 2) {
        throw 'Invalid path option specified.'
    }

    return new RoutePathAnimation(route, shape, options);
}

/**
 * Extracts points from a shapes or features that form a time based route and sorts them by time. 
 * Timestamps must parsable by the `atlas.math.parseTimestamp` function.
 * All extracted points will have a `_timestamp` property that contains the Date.getTime() value.
 * Features must be a Point, MultiPoint, or LineString and must contain properties that include timestamp information. 
 * If a timestamp property name is not specified, `_timestamp` will be used.
 * If a feature collection is passed in, the first shape with a matching timestamp property will dictate what is extracted. 
 * If the first shape is a Point, all points in the colleciton with the timestamp property will be extracted. 
 * If the first shape is a LineString or MultiLineString;
 * - If it contains a timestamp property with an array of values the same length as coordinates in the feature, new Point features will be created from a combination of the coordinates and timestamp values.
 * - If the feature has a `waypoints` property that contains an array of Point features with the timestamp property and the same number of coordinates, then these p will be extracted.
 * @param shapes The shapes to extract the route points from.
 * @param timestampProperty The name of the property that contains the timestamp for each feature. If not specified, defaults to `_timestamp`.
 */
export function extractRoutePoints(shapes: azmaps.data.FeatureCollection | azmaps.Shape | azmaps.data.Feature<azmaps.data.Geometry, any> | (azmaps.Shape | azmaps.data.Feature<azmaps.data.Geometry, any>)[], timestampProperty?: string): azmaps.data.Feature<azmaps.data.Point, any>[] {
    timestampProperty = timestampProperty || '_timestamp';

    let route: azmaps.data.Feature<azmaps.data.Point, any>[];

    if (Array.isArray(shapes)) {
        route = [];
        let mode: string;

        for (let i = 0, len = shapes.length; i < len; i++) {
            let f: azmaps.data.Feature<azmaps.data.Geometry, any>;

            if (shapes[i] instanceof azmaps.Shape) {
                f = (<azmaps.Shape>shapes[i]).toJson();
            } else {
                f = <azmaps.data.Feature<azmaps.data.Geometry, any>>shapes[i];
            }

            if (!mode &&
                ['Polygon', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'].indexOf(f.geometry.type) === -1 &&
                ((f.properties[timestampProperty] || typeof f.properties._timestamp === 'number') ||
                    (f.geometry.type !== 'Point' && f.properties.waypoints))) {
                mode = f.geometry.type;
            }

            if (mode) {
                //Only allow one LineString or MultiPoint through.
                if (route.length === 0 || f.geometry.type === 'Point') {
                    let r = this.extractRoutePoints(f, timestampProperty);
                    if (r) {
                        route = route.concat(r);

                        if (mode !== 'Point') {
                            break;
                        }
                    }
                }
            }
        };
    } else if (shapes instanceof azmaps.Shape) {
        route = Utils.extractRoutePointsFromFeature(shapes.toJson(), timestampProperty);
    } else if (shapes.type === 'FeatureCollection') {
        route = this.extractRoutePoints((<azmaps.data.FeatureCollection>shapes).features, timestampProperty);
    } else if (shapes.type) {
        route = Utils.extractRoutePointsFromFeature(<azmaps.data.Feature<azmaps.data.Geometry, any>>shapes, timestampProperty);
    }

    if (route) {
        //Sort the points by the _timestamp property.
        route = route.sort((a: azmaps.data.Feature<azmaps.data.Point, any>, b: azmaps.data.Feature<azmaps.data.Point, any>) => {
            return a.properties._timestamp - b.properties._timestamp;
        });
    }

    return (route.length > 0) ? route : null;
}

/**
 * Animates the morphing of a shape from one geometry type or set of coordinates to another.
 * @param shape The shape to animate.
 * @param newGeometry The new geometry to turn the shape into.
 * @param options Options for the animation.
 */
export function morph(shape: azmaps.Shape, newGeometry: azmaps.data.Geometry, options?: PlayableAnimationOptions): PlayableAnimation {
    return new MorphShapeAnimation(shape, newGeometry, options);
}

/**
 * Creates a playable animation delay. This is useful for group animations. 
 * @param timeout The time, in milliseconds (thousandths of a second), to delay before reaching the end of the animation.
 * @param callback A callback function that is called after the delay period.
 */
export function delay(timeout: number, callback?: string | Function): IPlayableAnimation {
    return new SimpleIntervalAnimation(callback, timeout, 1);
}

/**
 * Creates a playable animation that triggers a callback function on constant interval.    
 * @param period The interval time between calls to the callback.
 * @param callback The callback function to trigger on each interval.
 * @param numberOfIntervals The number of intervals to trigger in the animation. DEfault: Infinity
 */
export function interval(period: number, callback?: string | Function, numberOfIntervals?: number): IPlayableAnimation {
    return new SimpleIntervalAnimation(callback, period, Math.max(numberOfIntervals || Infinity, 1));
}

/**
 * A version of the setInterval function based on requestAnimationFrame.
 * @param callback The callback function to trigger on each interval.
 * @param timeout The time, in milliseconds (thousandths of a second), the timer should delay in between executions of the specified callback function.
 */
export function setInterval(callback: string | Function, timeout: number, ...args: any[]): number {
    const animation = new SimpleIntervalAnimation(callback, timeout, Infinity, args);
    animation.play();
    return animation._id;
}

/**
 * Disposes a setInterval instance.
 * @param intervalId The ID from the creation of a setInterval.
 */
export function clearInterval(intervalId: number): void {
    const animation = AnimationManager.instance.getById(intervalId);
    if (animation) {
        animation.stop();
    }
}

/**
 * A version of the setTimeout function based on requestAnimationFrame.
 * @param callback The callback function to trigger after a period of time.
 * @param timeout The time, in milliseconds (thousandths of a second), the timer should delay before executioning the specified callback function.
 */
export function setTimeout(callback: string | Function, timeout: number, ...args: any[]): number {
    const animation = new SimpleIntervalAnimation(callback, timeout, 1, args);
    animation.play();
    return animation._id;
}

/**
 * Disposes a setTimeout instance.
 * @param timeoutId The ID of the setTimeout instance.
 */
export function clearTimeout(timeoutId: number): void {
    clearInterval(timeoutId);
}

/**
 * Retrieves an easing function by name, or null if a matching easing function is not found.
 * @param easing Name of the easing function to retrieve.
 */
export function getEasingFn(easing: string): (progress: number) => number {
    return Easings[easing] || null;
}

/**
 * Retrieves the name of all the built in easing functions.
 */
export function getEasingNames(): string[] {
    return Object.keys(Easings);
}

/**
 * Animates the dash-array of a line layer to make it appear to flow. 
 * The lineCap option of the layer must not be 'round'. If it is, it will be changed to 'butt'.
 * @param layer The layer to animate.
 * @param options Animation options.
 */
export function flowingDashedLine(layer: azmaps.layer.LineLayer, options?: MovingDashLineOptions): IPlayableAnimation {
    //From: https://stackoverflow.com/questions/43057469/dashed-line-animations-in-mapbox-gl-js

    //Round lineCap will cause an error, change to butt cap.
    if (layer.getOptions().lineCap === 'round') {
        layer.setOptions({
            lineCap: 'butt'
        });
    }

    const dashLength = options.dashLength || 4;
    const gapLength = options.gapLength || 4;

    //We divide the animation up into 40 steps to make careful use of the finite space in LineAtlas.
    const steps = 40;

    // A # of steps proportional to the dashLength are devoted to manipulating the dash.
    const dashSteps = steps * dashLength / (gapLength + dashLength);

    // A # of steps proportional to the gapLength are devoted to manipulating the gap.
    const gapSteps = steps - dashSteps;

    const animation = new FrameBasedAnimationTimer(40, (frameIdx) => {
        let t, a, b, c, d;

        if (frameIdx < dashSteps) {
            t = frameIdx / dashSteps;
            a = (1 - t) * dashLength;
            b = gapLength;
            c = t * dashLength;
            d = 0;
        } else {
            t = (frameIdx - dashSteps) / (gapSteps);
            a = 0;
            b = (1 - t) * gapLength;
            c = dashLength;
            d = t * gapLength;
        }

        layer.setOptions({
            strokeDashArray: [a, b, c, d]
        });
    }, options);

    return animation;
}

/**
 * Fades an array of shapes in/out by adjusting its opacity. 
 * Use with a layer with the opacity/strokeOpacity/fillOpacity property set to ['get', 'opacity'].
 * Play in reverse to fade out.
 * @param shapes A one or more shapes to fade in/out. 
 * @param initialOpacity The initial opacity of the shape. Default: `0`
 * @param finalOpacity The final opacity of the shape. Default: `1`
 * @param options Options for the animation.
 */
export function fadeShapes(shapes: azmaps.Shape[], initialOpacity?: number, finalOpacity?: number, options?: PlayableAnimationOptions): PlayableAnimation {
    if (shapes.length > 0) {
        return new OpacityAnimation(shapes, initialOpacity, finalOpacity, options);
    }

    throw 'No supported shapes specified.'
}