import * as azmaps from "azure-maps-control";
import { MapPathPlayableAnaimation as MapPathPlayableAnimation } from './MapPathPlayableAnimation';
import { RoutePathAnimationOptions } from '../options/RoutePathAnimationOptions';
import { Utils } from '../../helpers/Utils';
import { TimeSpan } from '../interfaces/TimeSpan';
import { PointPairValueInterpolation } from '../interfaces/PointPairValueInterpolation';

/** Event arguments for a RoutePathAnimation state. */
export interface RoutePathAnimationEvent {
    /** The current position on the path. */
    position?: azmaps.data.Position;

    /** The current heading on the path. */
    heading?: number;
    
    /** Average speed between points in meters per second. */
    speed?: number;

    /** Estimated timestamp in the animation based on the timestamp information provided for each point.  */
    timestamp?: number;
}

/** Animates a map and/or a Point shape along a route path. The movement will vary based on timestamps within the point feature properties. */
export class RoutePathAnimation extends MapPathPlayableAnimation {

    /**************************
    * Private Properties
    ***************************/
   
    private _shape: azmaps.Shape | azmaps.HtmlMarker;
    private _route: azmaps.data.Feature<azmaps.data.Point, any>[];

    /** Total time in ms. */
    private _totalTime: number;

    private _positions: azmaps.data.Position[];

    /** Time stamps as numbers for faster calculations. */
    private _timestamps: number[];

    /** Heading between each point. */
    private _headingInv: number[];    
    
    /** Average speed between positions. */
    private _speedInv: number[];

    /** Interval time between positions. */
    private _timeInv: number[];

    /** Interpolations to perform on custom data. */
    private _valueInterps: PointPairValueInterpolation[];

    /**************************
    * Constructor
    ***************************/

    constructor(route: azmaps.data.Feature<azmaps.data.Point, any>[], shape?: azmaps.Shape | azmaps.HtmlMarker, options?: RoutePathAnimationOptions) {
        super();

        const self = this;
        self._shape = shape;
        self._route = route;

        self.setOptions(Object.assign({
            rotate: true,
            rotationOffset: 0
        },  options || {}));

        if (options && options.autoPlay) {
            self.play();
        } 
    }

    /**************************
    * Public Methods
    ***************************/

    /** Disposes the animation. */
    public dispose(): void {
        const self = this;

        self._route = null;
        self._headingInv = null;
        self._positions = null;
        self._timestamps = null;
        self._timeInv = null;
        self._totalTime = null;
        self._shape = null;

        super.dispose();
    }

    /** Gets the duration of the animation. Returns Infinity if the animations loops forever. */
    public getDuration(): number {
        const self = this;

        if(typeof self._totalTime !== 'undefined'){
            return self._totalTime / self._pathOptions.speedMultiplier;
        }

        return super.getDuration();
    }

    /** Gets the animation options. */
    public getOptions(): RoutePathAnimationOptions {
        return Object.assign({}, <RoutePathAnimation>super.getOptions(), { 
            valueInterpolations: this._valueInterps
         });
    }

    /** Sets the options of the animation. */
    public setOptions(options: RoutePathAnimationOptions): void {
        if(options){
            const self = this;

            if(options.valueInterpolations && Array.isArray(options.valueInterpolations)){
                self._positions = null;
                self._valueInterps = options.valueInterpolations;
            }

            super.setOptions(options);

            let isPlaying = self.isPlaying();

            if(isPlaying){
                self.pause();
            }

            if(!self._positions){
                self._processPath();

                if (self._pathOptions.captureMetadata) {
                    if(self._headingInv.length > 0){
                        Utils.setMetadata(self._shape, {
                            heading: self._headingInv[0],
                            speed: self._speedInv[0], 
                            timestamp:self._timestamps[0]
                        });
                    }
                }
            }

            if(isPlaying){
                self.play();
            }
        }
    }

    /** Gets the time span of the animation. */
    public getTimeSpan(): TimeSpan {
        const timestamps = this._timestamps;
        if(timestamps.length > 0){
            return {
                begin: timestamps[0],
                end: timestamps[timestamps.length - 1]
            };
        }

        return null;
    }

    /** Gets the positions that form the route path. */
    public getPath(): azmaps.data.Position[] {
        return JSON.parse(JSON.stringify(this._positions));
    }

    /** 
     * Callback function that contains the animation frame logic.  
     * @param progress The progress of the animation where 0 is start and 1 is the end.
     */
    public onAnimationProgress(progress: number): RoutePathAnimationEvent {
        const self = this;
        const sourcePos = self._positions;

        if(sourcePos && sourcePos.length > 1){
            let state: RoutePathAnimationEvent = {};
            let idx = 0;
            let props: any;
            let offset = 0;

            const shape = self._shape;
            const pathOptions = self._pathOptions;
            const headings = self._headingInv;
            const speeds = self._speedInv;
            const timestamps= self._timestamps;
            const route = self._route;

            if (progress === 1) {
                //Animation is done.
                idx = headings.length - 1;
                state = {
                    position: sourcePos[idx + 1],
                    heading: headings[idx],
                    speed: speeds[idx],
                    timestamp: timestamps[idx + 1]
                };
               
                if (pathOptions.map) {
                    self._setMapCamera(state.position, state.heading, false);
                } 

                Utils.setCoordinates(shape, state.position, sourcePos);

                props = route[idx].properties;
                offset = 1;
            } else if (progress === 0) {
                idx = 0;
                state = {
                    position: sourcePos[0],
                    heading: headings[0],
                    speed: speeds[0],
                    timestamp: timestamps[0]
                };

                if (pathOptions.map) {
                    self._setMapCamera(state.position, state.heading, false);
                } 

                Utils.setCoordinates(shape, state.position, [state.position, state.position]);

                props = route[0].properties;
            } else {
                let dt = self._totalTime * progress;
                let pos: azmaps.data.Position[] = null;

                //Calculate the coordinate part way between the origin and destination.
                if (dt > self._totalTime) {
                    idx = headings.length - 1;
                    state = {
                        heading: headings[idx],
                        speed: speeds[idx],
                        timestamp: timestamps[idx + 1]
                    };
                    pos = sourcePos.slice(0);
                    props = route[idx + 1].properties;
                    offset = 1;
                } else if (dt < 0) {
                    state.heading = headings[0];
                    pos = sourcePos.slice(0, 1);
                } else {
                    let ellapsed = 0;
                    let ti = self._timeInv;

                    for (idx = 0; idx <headings.length; idx++) {
                        if (ellapsed + ti[idx] >= dt) {
                            state.heading = headings[idx];
                            state.speed = speeds[idx];
                            pos = sourcePos.slice(0, idx + 1);

                            //Time in ms remaining that forms sub-path.
                            const dt2 = dt - ellapsed;

                            //Distance travelled based on average speed. Note that dt2 is in ms and speed is in m/s, thus the conversion to seconds.
                            const dx = speeds[idx] * dt2 * 0.001;

                            //Get the offset distance from the last known point.
                            offset = dx / azmaps.math.getDistanceTo(sourcePos[idx], sourcePos[idx + 1]);

                            state.timestamp = timestamps[idx] + dt2;

                            pos.push(azmaps.math.getDestination(sourcePos[idx], state.heading, dx));
                            break;
                        } else {
                            ellapsed += ti[idx];
                        }
                    }
                }

                if (pos && pos.length > 0) {
                    state.position = pos[pos.length - 1];

                    if (pathOptions.map) {
                        //Animate to the next view.
                        self._setMapCamera(state.position, state.heading, pos.length > 2);
                    } 

                    Utils.setCoordinates(shape, state.position, pos);
                }
            }

            state = Object.assign(props || {}, state);

            if (pathOptions.captureMetadata){
                const obj = {};
                const vi = self._valueInterps;

                if(vi && Array.isArray(vi)){
                    vi.forEach(vi => {
                        Utils.interpolateValue(route[idx], route[idx + 1], offset, vi, obj);
                    });
                }

                Utils.setMetadata(shape, Object.assign(state, obj));
            }

            return state;
        }

        return null;
    }

    /**************************
    * Private Methods
    ***************************/

    private _processPath(): void {
        const self = this;
        const r = self._route;

        if(r){

            self._totalTime = 0;
            self._positions = null;

            const positions = [];
            const headingIntervals = [];
            const speedIntervals = [];
            const timeIntervals = [];
            const timestamps = [];
            const mapMath = azmaps.math;

            let f = r[0];

            if (f.type === 'Feature' && f.geometry.type === 'Point' && typeof f.properties._timestamp === 'number') {
                timestamps.push(f.properties._timestamp);
                positions.push(f.geometry.coordinates);

                for (let i = 1, len = r.length; i < len; i++) {
                    f = r[i];

                    if (f.type === 'Feature' && f.geometry.type === 'Point' && typeof f.properties._timestamp === 'number') {
                        positions.push(f.geometry.coordinates);

                        const d = mapMath.getDistanceTo(positions[i - 1], positions[i]);

                        timestamps.push(f.properties._timestamp);

                        const dt = timestamps[i] - timestamps[i - 1];
                        timeIntervals.push(dt);
                        self._totalTime += dt;

                        //Get speed in meters per second. Convert time from ms to seconds.
                        speedIntervals.push(d/(dt * 0.001));

                        const h = mapMath.getHeading(positions[i - 1], positions[i]);
                        headingIntervals.push(h);
                    }
                }
            } else {
                throw 'Feature is not a point or is missing a _timestamp value.';
            }

            if(r.length !== positions.length){
                self.dispose();
                throw 'Unable to process all points in route.';
            }
            
            self._headingInv = headingIntervals;
            self._speedInv = speedIntervals;
            self._timeInv = timeIntervals;
            self._timestamps = timestamps;
            self._positions = positions;

            super.setOptions({ duration: self._totalTime });
        }
    }
}