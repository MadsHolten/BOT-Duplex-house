const fs = require('fs');
const path = require('path');
const util = require('util');
const { Connection, query, db } = require('stardog');
const _ = require('lodash');
const readFile = util.promisify(fs.readFile);   //promisify
const writeFile = util.promisify(fs.writeFile); //promisify
const conf = require('./config.json');

/**
 * CONFIG
 */
var loops = conf.loops;
var directory = conf.directory;
var files = conf.files;
var namedGraph = conf.namedGraph;
var queries = conf.queries;
var conn = new Connection({
    username: conf.store.username,
    password: conf.store.password,
    endpoint: conf.store.endpoint,
});

async function main() {
    try {
        // Use current time stamp as db-name and wipe log
        var dbName = 'test_'+Date.now();
        var logFile = `./${dbName}.csv`;
        var jsonLog = `./${dbName}.json`;
        var results = [];

        // Performing test set n times
        for(i = 1; i <= loops; i++){

            console.log(`Beginning loop ${i}`);
            
            // Create database and read triples in parallel

            var dbOptions = {reasoning: {type: "SL"}};

            await db.create(conn, dbName, dbOptions);
            
            // Load files in store
            var t1 = Date.now();
            var promises = [];
            if(files){
                for(file of files){
                    var filePath = path.resolve(path.join(directory,file));
                    var triples = await readFile(filePath, 'utf-8');
                    promises.push(db.graph.doPut(conn, dbName, triples, namedGraph, 'text/turtle'));
                }
            }

            // Wait until all triples are loaded into the store
            await Promise.all(promises);
            var t2 = Date.now();
            var dt = (t2-t1)/1000;

            // Count how many triples were stored
            if(i == 1){
                let res = await query.execute(conn, dbName, `select (count(?s) as ?count) where { graph <${namedGraph}> {?s ?p ?o}}`);
                var count = res.body.results.bindings[0].count.value;
            }
            console.log(`Wrote ${count} triples to store in ${dt} seconds`);

            var q = queries;

            for (j in q){
                var t1 = Date.now();
                var params = q[j].reasoning ? {reasoning: true} : undefined;
                var res = await query.execute(conn, dbName, q[j].query, undefined, params);
                var t2 = Date.now();
                var dt = (t2-t1)/1000;

                // Push result to array
                results.push({name: q[j].name, time: dt});
                
                console.log(`Finished query ${parseInt(j)+1} in ${dt} seconds`);

                // Log result
                if(q[j].count){
                    var count = res.body.results.bindings.length;
                    console.log(`${count} results`);
                }
            }

            // Wipe db
            await db.drop(conn, dbName);
        }
        // Calculate means
        var means = _.chain(results)
            .groupBy('name')
            .flatMap(x => {
                var mean = _.mean(_.map(x, y => y.time));
                // var mean = _.meanBy(x.time);
                return {name: x[0].name, mean: mean}
            })
            .value();

        // Write results to JSON file
        await writeFile(jsonLog, JSON.stringify({results: results, means: means}),  {'flag':'a'});

        // Write to csv-file
        for (i in means){
            var log = `"${means[i].name}", "${means[i].mean}"\n`;
            await writeFile(logFile, log,  {'flag':'a'});
        }
        
        console.log('Finished test');
    }
    catch(err) {
        console.log(err.message);
        // Wipe db
        await db.drop(conn, dbName);
    }
}

(async () => {
    await main();
})();