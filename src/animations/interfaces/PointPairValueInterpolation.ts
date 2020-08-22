
/** Defines how the value of property in two points is extrapolated. */
export interface PointPairValueInterpolation {
    /**
     * How the interpolation is performed. Certain interpolations require the data to be a certain value.
     * - `linear`,`min`, `max`, `avg`: `number` or `Date`
     * - `nearest`: `any`
     * Default: `linear`
     */
    interpolation: 'linear' | 'nearest' | 'min' | 'max' | 'avg';

     /**
     * The path to the property with each sub-property separated with a forward slash "/", for example "property/subproperty1/subproperty2".
     * Array indices can be added as subproperties as well, for example "property/0".
     */
    propertyPath: string;
}