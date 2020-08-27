import * as azmaps from "azure-maps-control";
import { RingInterpolator } from './RingInterpolator';

export class SimpleGeometryInterpolator  {
    private _interpolators: RingInterpolator[] = [];
    private _fromGeometry: azmaps.data.Geometry;
    private _toGeometry: azmaps.data.Geometry;

    private _areSame = false;

    constructor(fromGeometry: azmaps.data.Geometry, toGeometry: azmaps.data.Geometry) {
        if(fromGeometry.type === 'MultiPolygon'){
            throw 'Only simple geometries supported.';
        }

        this._fromGeometry = fromGeometry;
        this._toGeometry = toGeometry;

        this._areSame = (this._fromGeometry.type === this._toGeometry.type && JSON.parse(JSON.stringify(this._fromGeometry.coordinates)) === JSON.parse(JSON.stringify(this._toGeometry.coordinates)));

        this._initInterpolators();
    }

    public interpolate(progress: number): azmaps.data.Geometry {        

        let fg = this._fromGeometry;
        let tg = this._toGeometry;

        if(this._areSame){
            return tg;
        }

        if(progress === 0){
            return fg;
        } else if (progress === 1){
            return tg;
        }

        let c = this._runInterpolators(progress);
        let g:any = { type: tg.type };

        switch(tg.type){
            case 'Point':
                //If morphing to a point, keep the from shape for as long a possible.
                if(fg.type === 'LineString' || 
                    fg.type === 'MultiPoint'){
                    //Grab sample points.
                    g = { 
                        type: fg.type,
                        coordinates: this._sampleMultiPoint(c, fg.coordinates.length)
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
                if(fg.type === 'Polygon' && fg.coordinates.length > tg.coordinates.length){
                    let numRemove = Math.floor(c[0].length/(tg.coordinates.length - 1));

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
                    g.coordinates = this._sampleMultiPoint(c, tg.coordinates.length);
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

    private _initInterpolators(): void {
        let fg = this._fromGeometry;
        let tg = this._toGeometry;

        if(!this._areSame && fg && fg.coordinates.length > 0 && 
            tg && tg.coordinates.length > 0){

            let fromCoords: azmaps.data.Position[][] = [];
            let toCoords: azmaps.data.Position[][] = [];

            switch(fg.type) {
                case 'Point':
                    let fc = <azmaps.data.Position>fg.coordinates;
                    fromCoords = [[fc, fc, fc]];
                    break;
                case 'LineString':
                case 'MultiPoint':
                    let fc2 = <azmaps.data.Position[]>fg.coordinates;
                    fromCoords = [fc2];
                    break;
                case 'Polygon':
                case 'MultiLineString':
                    if(typeof fg.coordinates[0] === 'number'){
                        fromCoords = [<azmaps.data.Position[]>fg.coordinates];
                    } else {
                        fromCoords = <azmaps.data.Position[][]>fg.coordinates;
                    }
                    break;
            }

            switch(tg.type) {
                case 'Point':
                    let tc = <azmaps.data.Position>tg.coordinates;
                    toCoords = [[tc, tc, tc]];
                    break;
                case 'LineString':
                case 'MultiPoint':
                    let tc2 = <azmaps.data.Position[]>tg.coordinates;
                    toCoords = [tc2];
                    break;
                case 'Polygon':
                case 'MultiLineString':
                    if(typeof tg.coordinates[0] === 'number'){
                        toCoords = [<azmaps.data.Position[]>tg.coordinates];
                    } else {
                        toCoords = <azmaps.data.Position[][]>tg.coordinates;
                    }
                    break;
            }

            let i: number;
            let len = toCoords.length;

            //Fill gap of geometries transitioning from.
            if(fromCoords.length < toCoords.length){
                for(i = fromCoords.length; i < len; i++){
                    fromCoords.push([fromCoords[0][0],fromCoords[0][0],fromCoords[0][0]]);
                }
            } 

            for(i = 0; i < len; i++){
                this._interpolators.push(new RingInterpolator(fromCoords[i], toCoords[i]));
            }       
        }
    }

    private _runInterpolators(progress: number): azmaps.data.Position[][] {
        let c: azmaps.data.Position[][] = [];

        let int = this._interpolators;
        for(let i = 0; i < int.length; i++){
            c.push(int[i].interpolate(progress));
        }

        return c;
    }

    private _sampleMultiPoint(c: azmaps.data.Position[][], targetSize: number): azmaps.data.Position[] {
        let step = Math.min(Math.ceil(c[0].length/targetSize), targetSize);
        let p = [];
        for(let i = 0; i < targetSize; i++){
            p.push(c[0][i* step]);
        }

        return p;
    }
}
