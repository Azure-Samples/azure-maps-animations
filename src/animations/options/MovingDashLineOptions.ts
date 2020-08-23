import { PlayableAnimationOptions } from './PlayableAnimationOptions';

export interface MovingDashLineOptions extends PlayableAnimationOptions{
    /** The length of the dashed part of the line. Default: 4 */
    dashLength: number;
    
    /** The length of the gap part of the line. Default: 4 */
    gapLength: number;
}