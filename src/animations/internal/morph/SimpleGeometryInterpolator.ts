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
        if(this._areSame){
            return this._toGeometry;
        }

        if(progress === 0){
            return this._fromGeometry;
        } else if (progress === 1){
            return this._toGeometry;
        }

        var c = this._runInterpolators(progress);
        var g:any = { type: this._toGeometry.type };

        switch(this._toGeometry.type){
            case 'Point':
                //If morphing to a point, keep the from shape for as long a possible.
                if(this._fromGeometry.type === 'LineString' || 
                    this._fromGeometry.type === 'MultiPoint'){
                    //Grab sample points.
                    g = { 
                        type: this._fromGeometry.type,
                        coordinates: this._sampleMultiPoint(c, this._fromGeometry.coordinates.length)
                    };
                } else if(this._fromGeometry.type === 'Polygon' || 
                    this._fromGeometry.type === 'MultiLineString') {
                    g = { 
                        type: this._fromGeometry.type,
                        coordinates: c
                    };
                } else {
                    g.coordinates = c[0][0];
                }
                break;
            case 'LineString':
                //Remove extra points when transitioning from a polygon.
                if(this._fromGeometry.type === 'Polygon' && this._fromGeometry.coordinates.length > this._toGeometry.coordinates.length){
                    var numRemove = Math.floor(c[0].length/(this._toGeometry.coordinates.length - 1));

                    for(let i=numRemove;i>= 0;i--){
                        c[0].pop();
                    }
                }

                g.coordinates = c[0];
                break;
            case 'MultiPoint':
                //If morphing to a MultiPoint, keep the from shape for as long a possible.
                if(this._fromGeometry.type === 'Point'){
                    //Grab sample points.                   
                    g.coordinates = this._sampleMultiPoint(c, this._toGeometry.coordinates.length);
                } else if(this._fromGeometry.type !== 'MultiPoint') {
                    g = { 
                        type: this._fromGeometry.type,
                        coordinates: (this._fromGeometry.type === 'LineString')? c[0]: c
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
        if(!this._areSame && this._fromGeometry && this._fromGeometry.coordinates.length > 0 && 
            this._toGeometry && this._toGeometry.coordinates.length > 0){

            var fromCoords: azmaps.data.Position[][] = [];
            var toCoords: azmaps.data.Position[][] = [];

            switch(this._fromGeometry.type) {
                case 'Point':
                    var fc = <azmaps.data.Position>this._fromGeometry.coordinates;
                    fromCoords = [[fc, fc, fc]];
                    break;
                case 'LineString':
                case 'MultiPoint':
                    var fc2 = <azmaps.data.Position[]>this._fromGeometry.coordinates;
                    fromCoords = [fc2];
                    break;
                case 'Polygon':
                case 'MultiLineString':
                    if(typeof this._fromGeometry.coordinates[0] === 'number'){
                        fromCoords = [<azmaps.data.Position[]>this._fromGeometry.coordinates];
                    } else {
                        fromCoords = <azmaps.data.Position[][]>this._fromGeometry.coordinates;
                    }
                    break;
            }

            switch(this._toGeometry.type) {
                case 'Point':
                    var tc = <azmaps.data.Position>this._toGeometry.coordinates;
                    toCoords = [[tc, tc, tc]];
                    break;
                case 'LineString':
                case 'MultiPoint':
                    var tc2 = <azmaps.data.Position[]>this._toGeometry.coordinates;
                    toCoords = [tc2];
                    break;
                case 'Polygon':
                case 'MultiLineString':
                    if(typeof this._toGeometry.coordinates[0] === 'number'){
                        toCoords = [<azmaps.data.Position[]>this._toGeometry.coordinates];
                    } else {
                        toCoords = <azmaps.data.Position[][]>this._toGeometry.coordinates;
                    }
                    break;
            }

            //Fill gap of geometries transitioning from.
            if(fromCoords.length < toCoords.length){
                for(var i = fromCoords.length, len = toCoords.length; i < len; i++){
                    fromCoords.push([fromCoords[0][0],fromCoords[0][0],fromCoords[0][0]]);
                }
            } 

            for(var i = 0; i < toCoords.length; i++){
                this._interpolators.push(new RingInterpolator(fromCoords[i], toCoords[i]));
            }       
        }
    }

    private _runInterpolators(progress: number): azmaps.data.Position[][] {
        var c: azmaps.data.Position[][] = [];

        for(var i = 0; i < this._interpolators.length; i++){
            c.push(this._interpolators[i].interpolate(progress));
        }

        return c;
    }

    private _sampleMultiPoint(c: azmaps.data.Position[][], targetSize: number): azmaps.data.Position[] {
        var step = Math.min(Math.ceil(c[0].length/targetSize), targetSize);
        var p = [];
        for(let i = 0; i < targetSize; i++){
            p.push(c[0][i* step]);
        }

        return p;
    }
}
