import { Injectable } from '@angular/core';
import * as rdfstore from 'rdfstore';
import { Observable, from } from "rxjs";
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import * as THREE from 'three';
import * as parse from 'wellknown';
import * as _ from 'lodash';

@Injectable()
export class AppService {

    private filePaths = [
        "./assets/duplex.ttl"
    ];

    private store;

    constructor( public http: HttpClient ) { }

    public getQuery(query): Observable<any> {

        return from(this._loadAndQuery(query));
        // return this.http.get(this.filePaths[0], {responseType: 'text'})

    }

    public getType(uri): Observable<any> {
        var q = `SELECT ?type WHERE {<${uri}> a ?type}`;

        return from(this._loadAndQuery(q))
            .pipe(
                map(data => {
                    var sp = data.filter(d => {
                        return d.type.value == "https://w3id.org/bot#Space";
                    });
                    if(sp.length != 0){
                        return "Space";
                    }else{
                        return "Element";
                    }
                })
            );
    }

    public getLevels(): Observable<any> {
        const q = `
        PREFIX bot:     <https://w3id.org/bot#>
        PREFIX props:   <https://w3id.org/props#>
        PREFIX seas:    <https://w3id.org/seas/>
        PREFIX opm:     <https://w3id.org/opm#>
        PREFIX schema:  <http://schema.org/>
        SELECT DISTINCT ?uri ?name
        WHERE {
            ?uri a bot:Storey ;
                props:identityDataName/opm:hasPropertyState ?ps .
            ?ps a opm:CurrentPropertyState ;
                schema:value ?name .
            # Must have a space with a 2D boundary
            ?uri bot:hasSpace ?sp .
            ?sp props:hasSimple2DBoundary ?geometry2d .
        }`;

        return from(this._loadAndQuery(q))
                .pipe(
                    map(data => {
                        return {data: data, query: q};
                    })
                );
    }

    public getElements3D(): Observable<any> {
        var q = `
        PREFIX bot:    <https://w3id.org/bot#>
        PREFIX props:  <https://w3id.org/props#>
        PREFIX opm:    <https://w3id.org/opm#>
        PREFIX schema: <http://schema.org/>
        SELECT ?uri ?name ?geometry
        WHERE {
            ?uri a bot:Element ;
                bot:hasSimple3DModel ?geometry .
        }`;

        return from(this._loadAndQuery(q))
                .pipe(
                    map(data => {
                        var d = data.map(item => {
                            return {
                                name: "none", 
                                uri: item.uri.value,
                                geometry: item.geometry.value,
                                type: "Element"
                            }
                        });
                        return {data: d, query: q};
                    })
                );
    }

    public getContainedIn3D(): Observable<any> {
        var q = `
        PREFIX bot:    <https://w3id.org/bot#>
        PREFIX props:  <https://w3id.org/props#>
        PREFIX opm:    <https://w3id.org/opm#>
        PREFIX schema: <http://schema.org/>
        SELECT ?uri ?name ?geometry
        WHERE {
            ?sp bot:containsElement ?uri .
            ?uri bot:hasSimple3DModel ?geometry .
        }`;

        return from(this._loadAndQuery(q))
                .pipe(
                    map(data => {
                        var d = data.map(item => {
                            return {
                                name: "none", 
                                uri: item.uri.value,
                                geometry: item.geometry.value,
                                type: "Element"
                            }
                        });
                        return {data: d, query: q};
                    })
                );
    }

    public getAdjElements(spaceURI): Observable<any> {
        var q1 = `
        PREFIX bot:    <https://w3id.org/bot#>\n
        PREFIX props:  <https://w3id.org/props#>\n
        PREFIX opm:    <https://w3id.org/opm#>\n
        PREFIX schema: <http://schema.org/>\n
        SELECT ?uri ?name ?geometry\n
        WHERE {\n
            <${spaceURI}> bot:adjacentElement ?uri .
            ?uri props:identityDataName/opm:hasPropertyState ?ns ;
                bot:hasSimple3DModel ?geometry .
            ?ns a opm:CurrentPropertyState ;
                schema:value ?name .
        }`;

        var q2 = `
        PREFIX bot:    <https://w3id.org/bot#>\n
        PREFIX props:  <https://w3id.org/props#>\n
        PREFIX opm:    <https://w3id.org/opm#>\n
        PREFIX schema: <http://schema.org/>\n
        SELECT ?name ?geometry\n
        WHERE {\n
            <${spaceURI}> props:identityDataName/opm:hasPropertyState ?ns ;
                bot:hasSimple3DModel ?geometry .
            ?ns a opm:CurrentPropertyState ;
                schema:value ?name .
        }`;

        var results;;

        // First perform q1 to get elements
        var promise = this._loadAndQuery(q1).then(d => {

            // save results to variable results
            results = d.map(item => {
                return {
                    name: item.name.value, 
                    uri: item.uri.value,
                    geometry: item.geometry.value,
                    type: "Element"
                }
            });

            // Then perform q2 to get the zone's geometry
            return this._loadAndQuery(q2).then(d => {

                // Append result to variable results
                results.push({
                    name: d[0].name.value,
                    uri: spaceURI,
                    geometry: d[0].geometry.value,
                    type: "Zone"
                });

                // Return results and query
                return {data: results, query: q1};
            }) 
        })

        return from(promise);
    }

    public getRooms3D(): Observable<any> {

        var q = `
        PREFIX bot:    <https://w3id.org/bot#>
        PREFIX props:  <https://w3id.org/props#>
        PREFIX opm:    <https://w3id.org/opm#>
        PREFIX schema: <http://schema.org/>
        SELECT ?uri ?name ?geometry
        WHERE {
            ?uri a bot:Space ;
                props:identityDataName/opm:hasPropertyState ?ns ;
                bot:hasSimple3DModel ?geometry .
            ?ns a opm:CurrentPropertyState ;
                schema:value ?name .
        }
        `;

        return from(this._loadAndQuery(q))
                .pipe(
                    map(data => {
                        var d = data.map(item => {
                            return {
                                name: item.name.value, 
                                uri: item.uri.value,
                                geometry: item.geometry.value,
                                type: "Zone",
                                opacity: 0.3
                            }
                        });
                        return {data: d, query: q};
                    })
                );

    }

    public getWindows3D(): Observable<any> {
        
        var q = `
        PREFIX bot:    <https://w3id.org/bot#>
        PREFIX props:  <https://w3id.org/props#>
        PREFIX prod:   <https://w3id.org/product#>
        PREFIX opm:    <https://w3id.org/opm#>
        PREFIX schema: <http://schema.org/>
        SELECT ?uri ?name ?geometry
        WHERE {
            ?uri a prod:Window ;
                props:identityDataName/opm:hasPropertyState ?ns ;
                bot:hasSimple3DModel ?geometry .
            ?ns a opm:CurrentPropertyState ;
                schema:value ?name .
        }`;
    
        return from(this._loadAndQuery(q))
                .pipe(
                    map(data => {
                        var d = data.map(item => {
                            return {
                                name: item.name.value, 
                                uri: item.uri.value,
                                geometry: item.geometry.value,
                                type: "Element"
                            }
                        });
                        return {data: d, query: q};
                    })
                );
        
    }

    public getRooms2D(levelURI): Observable<any> {
        const q = `
        PREFIX bot:     <https://w3id.org/bot#>
        PREFIX opm:     <https://w3id.org/opm#>
        PREFIX schema:  <http://schema.org/>
        PREFIX props:   <https://w3id.org/props#>
        PREFIX geo:     <http://www.opengis.net/ont/geosparql#>
        PREFIX inst:    <https://w3id.org/ibp/bot4osh/>
        SELECT DISTINCT ?uri ?name ?geometry2d
        WHERE {
            <${levelURI}> bot:hasSpace ?uri .
            ?uri props:identityDataName/opm:hasPropertyState ?ns ;
                props:hasSimple2DBoundary ?geometry2d .
            ?ns a opm:CurrentPropertyState ;
                schema:value ?name .
        }`;

        return from(this._loadAndQuery(q))
                .pipe(
                    map(res => {
                        var data = this._resToGeoJSON(res);
                        return {data: data, query: q};
                    })
                );
    }

    public getElements2D(): Observable<any> {
        const q = `
        PREFIX bot:     <https://w3id.org/bot#>
        PREFIX opm:     <https://w3id.org/opm#>
        PREFIX schema:  <http://schema.org/>
        PREFIX props:   <https://w3id.org/props#>
        PREFIX geo:     <http://www.opengis.net/ont/geosparql#>
        PREFIX inst:    <https://w3id.org/ibp/bot4osh/>
        SELECT DISTINCT ?uri ?name ?geometry2d
        WHERE {
            ?x a bot:Space ;
                bot:adjacentElement ?uri .
            ?uri props:identityDataName/opm:hasPropertyState ?ns ;
                props:hasSimple2DBoundary ?geometry2d .
            ?ns a opm:CurrentPropertyState ;
                schema:value ?name .
        }`;

        return from(this._loadAndQuery(q))
                .pipe(
                    map(res => {
                        var data = this._resToGeoJSON(res);
                        return {data: data, query: q};
                    })
                );
    }

    private _resToGeoJSON(res){
        var geoJSON = {type: "FeatureCollection", features: []};

        _.each(res, d => {
            var uri: string = d.uri.value;
            var name: string = d.name.value;
            var geometry2d: any = parse(d.geometry2d.value);
            geometry2d.coordinates = [geometry2d.coordinates];

            // var properties = {name: name, uri: uri, color: '#eee'};
            var properties = {name: name, uri: uri, color: '#eee'};
            var obj = {type: "Feature", id: uri, geometry: geometry2d, properties: properties};
            geoJSON.features.push(obj);
        });

        return geoJSON;
    }

    private async _loadAndQuery(query): Promise<any> {

        // Create store and load triples if it does not already exist
        if(!this.store){

            var createStorePromise = this._createStore();
            
            // Get file content
            var promises = [];
            for(var p of this.filePaths){
                var promise = this.http.get(p, {responseType: 'text'}).toPromise();
                promises.push(promise);
            }
    
            // Continue when all triples are available and store is created
            var triples = await Promise.all(promises);
            this.store = await createStorePromise;

            // Load triples into store
            var counter = 0;
            for(var t of triples){
                var inserted = await this._loadTriplesInStore(this.store, t);
                counter+= Number(inserted);
            }

            console.log("Added " + counter + " triples to memory.");

        }

        // Query the store
        var qResPromise = this._executeQuery(this.store, query);
        
        return qResPromise;

    }

    private _createStore(){
        return new Promise( (resolve, reject) => {
            rdfstore.create((err, store) => {
                if(err) reject(err);
                resolve(store);
            });
        })
    }

    private _loadTriplesInStore(store, triples, mimeType?){
        if(!mimeType) mimeType = 'text/turtle';
        return new Promise((resolve, reject) => {
            store.load(mimeType, triples, (err, size) => {
                if(err) reject(err);
                resolve(size);
            })
        })
    }

    private _executeQuery(store, query){
        return new Promise((resolve, reject) => {
            store.execute(query, (err, res) => {
                if(err) reject(err);
                resolve(res);
            })
        })
    }

    private _getGraphSize(){
        return new Promise((resolve, reject) => {
            this.store.graph((err, graph) => {
                if(err) reject(err);
                resolve(graph.x);
            });
        })
    }

}