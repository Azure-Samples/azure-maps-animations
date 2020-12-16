import * as azmaps from "azure-maps-control";
import flubber from "flubber";

export class RingInterpolator  {
    private _interp: any;
    private _constPos: azmaps.data.Position[];

    constructor(fromRing: azmaps.data.Position[], toRing: azmaps.data.Position[]) {
        //If positions arrays are identical, don't use interpolate progress as it may add artifacts.
        let areEqual = true;

        if(fromRing.length !== toRing.length){
            areEqual = false;
        } 

        if(areEqual){
            fromRing.forEach((val, idx) => {
                areEqual = areEqual && azmaps.data.Position.areEqual(val, toRing[idx]);
            });
        }
        
        if(areEqual){
            this._constPos = toRing;
        } else {
            this._interp = flubber.interpolate(<[number, number][]>fromRing, <[number, number][]>toRing, {
                string: false
            });
        }
    }

    public interpolate(progress: number): azmaps.data.Position[] {
        const self = this;
        if(self._constPos){
            return self._constPos;
        }

        return <azmaps.data.Position[]>self._interp(progress);
    }
}