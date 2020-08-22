import * as azmaps from "azure-maps-control";
import { PathAnimationOptions } from './PathAnimationOptions';

/** Options for animating the map along a path. */
export interface MapPathAnimationOptions extends PathAnimationOptions {
    /** Map to animation along path. */
    map?: azmaps.Map;

    /** A fixed zoom level to snap the map to on each animation frame. By default the maps current zoom level is used. */
    zoom?: number;

    /** A pitch value to set on the map. By default this is not set. */
    pitch?: number;

    /** Specifies if the map should rotate such that the bearing of the map faces the direction the map is moving. Default: true */
    rotate?: boolean;

    /** When rotate is set to true, the animation will follow the animation. An offset of 180 will cause the camera to lead the animation and look back. Default: 0 */
    rotationOffset?: number;
}