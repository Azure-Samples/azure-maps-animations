import * as azmaps from "azure-maps-control";
import { RingInterpolator } from './RingInterpolator';

export class SimpleGeometryInterpolator  {
    private _interps: RingInterpolator[] = [];
    private _fromGeom: azmaps.data.Geometry;
    private _toGeom: azmaps.data.Geometry;

    private _areSame = false;

    constructor(fromGeometry: azmaps.data.Geometry, toGeometry: azmaps.data.Geometry) {
        const self = this;
        if(fromGeometry.type === 'MultiPolygon'){
            throw 'Only simple geometries supported.';
        }

        self._fromGeom = fromGeometry;
        self._toGeom = toGeometry;

        self._areSame = (fromGeometry.type === toGeometry.type && JSON.parse(JSON.stringify(fromGeometry.coordinates)) === JSON.parse(JSON.stringify(toGeometry.coordinates)));

        self._initInterps();
    }

    public interpolate(progress: number): azmaps.data.Geometry {    
        const self = this;    

        let fg = self._fromGeom;
        let tg = self._toGeom;

        if(self._areSame){
            return tg;
        }

        if(progress === 0){
            return fg;
        } else if (progress === 1){
            return tg;
        }

        const fgPos = fg.coordinates;
        const tgPos = tg.coordinates;

        const c = self._runInterps(progress);
        let g:any = { type: tg.type };

        switch(tg.type){
            case 'Point':
                //If morphing to a point, keep the from shape for as long a possible.
                if(fg.type === 'LineString' || 
                    fg.type === 'MultiPoint'){
                    //Grab sample points.
                    g = { 
                        type: fg.type,
                        coordinates: self._sampleMultiPoint(c, fgPos.length)
                    };
                } else if(fg.type === 'Polygon' || 
                    fg.type === 'MultiLineString') {
                    g = { 
                        type: fg.type,
                        coordinates: c
                    };
                } else {
                    g.coordinates = c[0][0];
                }
                break;
            case 'LineString':
                //Remove extra points when transitioning from a polygon.
                if(fg.type === 'Polygon' && fgPos.length > tgPos.length){
                    let numRemove = Math.floor(c[0].length/(tgPos.length - 1));

                    for(let i=numRemove;i>= 0;i--){
                        c[0].pop();
                    }
                }

                g.coordinates = c[0];
                break;
            case 'MultiPoint':
                //If morphing to a MultiPoint, keep the from shape for as long a possible.
                if(fg.type === 'Point'){
                    //Grab sample points.                   
                    g.coordinates = self._sampleMultiPoint(c, tgPos.length);
                } else if(fg.type !== 'MultiPoint') {
                    g = { 
                        type: fg.type,
                        coordinates: (fg.type === 'LineString')? c[0]: c
                    };
                } else {
                    g.coordinates = c[0];
                }
                break;
            case 'Polygon':
            case 'MultiLineString':
                g.coordinates = c;
                break;
        }

        return g;
    }

    private _initInterps(): void {
        const self = this;    
        let fg = self._fromGeom;
        let tg = self._toGeom;

        if(!self._areSame && fg && fg.coordinates.length > 0 && 
            tg && tg.coordinates.length > 0){

            const fgPos = fg.coordinates;
            const tgPos = tg.coordinates;

            let fromCoords: azmaps.data.Position[][] = [];
            let toCoords: azmaps.data.Position[][] = [];

            switch(fg.type) {
                case 'Point':
                    const fc = <azmaps.data.Position>fgPos;
                    fromCoords = [[fc, fc, fc]];
                    break;
                case 'LineString':
                case 'MultiPoint':
                    const fc2 = <azmaps.data.Position[]>fgPos;
                    fromCoords = [fc2];
                    break;
                case 'Polygon':
                case 'MultiLineString':
                    if(typeof fgPos[0] === 'number'){
                        fromCoords = [<azmaps.data.Position[]>fgPos];
                    } else {
                        fromCoords = <azmaps.data.Position[][]>fgPos;
                    }
                    break;
            }

            switch(tg.type) {
                case 'Point':
                    const tc = <azmaps.data.Position>tgPos;
                    toCoords = [[tc, tc, tc]];
                    break;
                case 'LineString':
                case 'MultiPoint':
                    const tc2 = <azmaps.data.Position[]>tgPos;
                    toCoords = [tc2];
                    break;
                case 'Polygon':
                case 'MultiLineString':
                    if(typeof tgPos[0] === 'number'){
                        toCoords = [<azmaps.data.Position[]>tgPos];
                    } else {
                        toCoords = <azmaps.data.Position[][]>tgPos;
                    }
                    break;
            }

            let i: number;
            const len = toCoords.length;

            //Fill gap of geometries transitioning from.
            if(fromCoords.length < toCoords.length){
                for(i = fromCoords.length; i < len; i++){
                    fromCoords.push([fromCoords[0][0],fromCoords[0][0],fromCoords[0][0]]);
                }
            } 

            for(i = 0; i < len; i++){
                self._interps.push(new RingInterpolator(fromCoords[i], toCoords[i]));
            }       
        }
    }

    private _runInterps(progress: number): azmaps.data.Position[][] {
        const c: azmaps.data.Position[][] = [];

        const interps = this._interps;
        for(let i = 0; i < interps.length; i++){
            c.push(interps[i].interpolate(progress));
        }

        return c;
    }

    private _sampleMultiPoint(c: azmaps.data.Position[][], targetSize: number): azmaps.data.Position[] {
        const step = Math.min(Math.ceil(c[0].length/targetSize), targetSize);
        const p = [];
        for(let i = 0; i < targetSize; i++){
            p.push(c[0][i* step]);
        }

        return p;
    }
}
