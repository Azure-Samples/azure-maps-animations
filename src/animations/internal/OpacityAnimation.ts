import * as azmaps from "azure-maps-control";
import { PlayableAnimationOptions } from '../options/PlayableAnimationOptions';
import { PlayableAnimation } from '../PlayableAnimation';

/** Animates the opacity of a feature. */
export class OpacityAnimation extends PlayableAnimation {
    /****************************
    * Private properties
    ***************************/
   
    private _shapes: azmaps.Shape[];
    private _minOpacity: number;
    private _opacityWidth: number;

    /**************************
    * Constructor
    ***************************/

    /**
     * Animates the opacity of a feature.
     * @param shapes An array shapes or HtmlMarkers to animatie opacity.
     * @param initialOpacity The initial opacity of the shape. Default: `0`
     * @param finalOpacity The final opacity of the shape. Default: `1`
     * @param options Options for the animation.
     */
    constructor(shapes: azmaps.Shape[], initialOpacity?: number, finalOpacity?: number, options?: PlayableAnimationOptions) {
        super(options);

        initialOpacity = initialOpacity || 0;
        finalOpacity = finalOpacity || 1

        if(initialOpacity > finalOpacity) {
            var t = finalOpacity;
            finalOpacity = initialOpacity;
            initialOpacity = t;
        }

        this._minOpacity = initialOpacity;
        this._opacityWidth = finalOpacity - initialOpacity;

        if (shapes && shapes.length > 0) {
            const self = this;
            self._shapes = shapes;

            //Extract the offsets for each shape.
            shapes.forEach(s => {
                s.setProperties(Object.assign(s.getProperties(), {
                    opacity: initialOpacity
                }));
            });
                  
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

    public onAnimationProgress(progress: number): any {
        const self = this;
        self._shapes.forEach(s => {
            s.setProperties(Object.assign(s.getProperties(), {
                opacity: self._minOpacity + self._opacityWidth * progress
            }));
        });

        return null;
    }
}