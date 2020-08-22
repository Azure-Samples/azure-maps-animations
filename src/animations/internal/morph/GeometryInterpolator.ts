import * as azmaps from "azure-maps-control";
import { SimpleGeometryInterpolator } from './SimpleGeometryInterpolator';

export class GeometryInterpolator  {
    private _interpolators: SimpleGeometryInterpolator[] = [];
    private _fromGeometry: azmaps.data.Geometry;
    private _toGeometry: azmaps.data.Geometry;

    constructor(fromGeometry: azmaps.data.Geometry, toGeometry: azmaps.data.Geometry) {
        this._fromGeometry = fromGeometry;
        this._toGeometry = toGeometry;

        this._initInterpolators();
    }

    public interpolate(progress: number): azmaps.data.Geometry {
        if(progress === 0){
            return this._fromGeometry;
        } else if (progress === 1){
            return this._toGeometry;
        }

        if(this._toGeometry.type === 'MultiPolygon'){
            var c: azmaps.data.Position[][][] = [];

            this._interpolators.forEach(interpolator => {
                c.push(<azmaps.data.Position[][]>interpolator.interpolate(progress).coordinates);
            });

            return {
                type: 'MultiPolygon',
                coordinates: c
            };
        } else if (this._toGeometry.type === 'GeometryCollection'){
            var geoms: azmaps.data.Geometry[] = [];

            this._interpolators.forEach(interpolator => {
                geoms.push(interpolator.interpolate(progress));
            });

            //@ts-ignore.
            return <azmaps.data.GeometryCollection>{
                type: 'GeometryCollection',
                geometries: geoms
            };
        }

        return this._interpolators[0].interpolate(progress);
    }

    private _initInterpolators() {
        var fromGeoms: azmaps.data.Geometry[] = [];
        var toGeoms: azmaps.data.Geometry[] = [];

        this.extractGeometries(this._fromGeometry, fromGeoms);
        this.extractGeometries(this._toGeometry, toGeoms);

        //Fill gap of geometries transitioning from.
        if(fromGeoms.length < toGeoms.length){

            if(fromGeoms.length > 0){
                var c = azmaps.data.BoundingBox.getCenter(azmaps.data.BoundingBox.fromData(fromGeoms[0]));
                var fillGeom: azmaps.data.Geometry = {
                    type: fromGeoms[0].type,
                    coordinates: []
                };

                switch(fromGeoms[0].type){
                    case 'Point':
                        fillGeom.coordinates = c;
                        break;
                    case 'LineString':
                    case 'MultiPoint':
                        fillGeom.coordinates = [c, c];
                        break;
                    case 'MultiLineString':
                    case 'Polygon':
                        fillGeom.coordinates = [[c, c, c]];
                        break;
                }

                //Transitioning "from" less geometries to more, expand from a point near the center of the "from" geometry and expand to the "to" geometry.
                for(var i = fromGeoms.length, len = toGeoms.length; i < len; i++){
                    fromGeoms.push(fillGeom);
                }
            }
        } 
        
        //Crate interpolators
        for(var i = 0; i < toGeoms.length; i++){
            this._interpolators.push(new SimpleGeometryInterpolator(fromGeoms[i], toGeoms[i]));
        }
    }

    private extractGeometries(geom: azmaps.data.Geometry, targetArray: azmaps.data.Geometry[]){
        switch(geom.type){
            case 'MultiPolygon':
                geom.coordinates.forEach(p => {
                    targetArray.push({
                        type: 'Polygon',
                        coordinates: <azmaps.data.Position[][]>p
                    });
                });
            break;
            case 'GeometryCollection':
                //@ts-ignore
                (<azmaps.data.GeometryCollection>geom).geometries.forEach(g => {
                    this.extractGeometries(g, targetArray);
                });
            break;
            default:
                targetArray.push(geom);
            break; 
        }
    }
}
