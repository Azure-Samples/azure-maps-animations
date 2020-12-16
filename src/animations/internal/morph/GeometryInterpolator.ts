import * as azmaps from "azure-maps-control";
import { SimpleGeometryInterpolator } from './SimpleGeometryInterpolator';

export class GeometryInterpolator  {
    private _interps: SimpleGeometryInterpolator[] = [];
    private _fromGeom: azmaps.data.Geometry;
    private _toGeom: azmaps.data.Geometry;

    constructor(fromGeometry: azmaps.data.Geometry, toGeometry: azmaps.data.Geometry) {
        const self = this;
        self._fromGeom = fromGeometry;
        self._toGeom = toGeometry;

        self._initInterps();
    }

    public interpolate(progress: number): azmaps.data.Geometry {
        const self = this;
        const toGeom = self._toGeom;
        const interps = self._interps;

        if(progress === 0){
            return self._fromGeom;
        } else if (progress === 1){
            return toGeom;
        }

        if(toGeom.type === 'MultiPolygon'){
            const c: azmaps.data.Position[][][] = [];

            interps.forEach(interpolator => {
                c.push(<azmaps.data.Position[][]>interpolator.interpolate(progress).coordinates);
            });

            return {
                type: 'MultiPolygon',
                coordinates: c
            };
        } else if (toGeom.type === 'GeometryCollection'){
            const geoms: azmaps.data.Geometry[] = [];

            interps.forEach(interpolator => {
                geoms.push(interpolator.interpolate(progress));
            });

            //@ts-ignore.
            return <azmaps.data.GeometryCollection>{
                type: 'GeometryCollection',
                geometries: geoms
            };
        }

        return interps[0].interpolate(progress);
    }

    private _initInterps() {
        const self = this;

        const fromGeoms: azmaps.data.Geometry[] = [];
        const toGeoms: azmaps.data.Geometry[] = [];

        self._extractGeoms(self._fromGeom, fromGeoms);
        self._extractGeoms(self._toGeom, toGeoms);

        //Fill gap of geometries transitioning from.
        if(fromGeoms.length < toGeoms.length){

            if(fromGeoms.length > 0){
                const c = azmaps.data.BoundingBox.getCenter(azmaps.data.BoundingBox.fromData(fromGeoms[0]));
                const fillGeom: azmaps.data.Geometry = {
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
                for(let i = fromGeoms.length, len = toGeoms.length; i < len; i++){
                    fromGeoms.push(fillGeom);
                }
            }
        } 
        
        //Crate interpolators
        for(let i = 0; i < toGeoms.length; i++){
            self._interps.push(new SimpleGeometryInterpolator(fromGeoms[i], toGeoms[i]));
        }
    }

    private _extractGeoms(geom: azmaps.data.Geometry, targetArray: azmaps.data.Geometry[]){
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
                    this._extractGeoms(g, targetArray);
                });
                break;
            default:
                targetArray.push(geom);
                break; 
        }
    }
}
