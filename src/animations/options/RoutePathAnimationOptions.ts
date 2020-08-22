import { MapPathAnimationOptions } from './MapPathAnimationOptions';
import { PointPairValueInterpolation } from '../interfaces/PointPairValueInterpolation';

/** Options for animating the map along a path. */
export interface RoutePathAnimationOptions extends MapPathAnimationOptions {
    /** Interpolation calculations to perform on property values between points during the animation. Requires `captureMetadata` to be enabled. */
    valueInterpolations?: PointPairValueInterpolation[];
}