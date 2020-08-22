import { PlayableAnimationOptions } from './PlayableAnimationOptions';

/** Options for animations that involve coordiates following a path. */
export interface PathAnimationOptions extends PlayableAnimationOptions {
    /** Specifies if a curved geodesic path should be used between points rather than a straight pixel path. Default: false */
    geodesic?: boolean;

    /** Specifies if metadata should be captured as properties of the shape. Potential metadata properties that may be captured: heading */
    captureMetadata?: boolean;
}