import * as azmaps from "azure-maps-control";
import { PlayableAnimationOptions } from '../animations/options/PlayableAnimationOptions';

/** An object that defines the options for an AnimatedTileLayer. */
export interface AnimatedTileLayerOptions extends PlayableAnimationOptions {
    /** The array of tile layers options to animate through. Note that fadeDuration and visible options are ignored. */
    tileLayerOptions?: azmaps.TileLayerOptions[];

    /** A boolean specifying if the animated tile layer is visible or not. Default: true */
    visible?: boolean;
}