import * as azmaps from "azure-maps-control";
import flubber from "flubber";

export class RingInterpolator  {
    private _interpolator: any;
    private _constantPositions: azmaps.data.Position[];

    constructor(fromRing: azmaps.data.Position[], toRing: azmaps.data.Position[]) {
        //If positions arrays are identical, don't use interpolate progress as it may add artifacts.
        var areEqual = true;

        if(fromRing.length !== toRing.length){
            areEqual = false;
        } 

        if(areEqual){
            fromRing.forEach((val, idx) => {
                areEqual = areEqual && azmaps.data.Position.areEqual(val, toRing[idx]);
            });
        }
        
        if(areEqual){
            this._constantPositions = toRing;
        } else {
            this._interpolator = flubber.interpolate(<[number, number][]>fromRing, <[number, number][]>toRing, {
                string: false
            });
        }
    }

    public interpolate(progress: number): azmaps.data.Position[] {
        if(this._constantPositions){
            return this._constantPositions;
        }

        return <azmaps.data.Position[]>this._interpolator(progress);
    }
}