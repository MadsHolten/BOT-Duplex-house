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
var files = conf.files;
var namedGraph = conf.namedGraph;
var queries = conf.queries;
var conn = new Connection({
    username: conf.store.username,
    password: conf.store.password,
    endpoint: conf.store.endpoint,
});

async function loadTriples(dbName,triples,dbOptions){
    await db.create(conn, dbName, dbOptions);

    // Load files in store
    var t1 = Date.now();

    // Load triples in store
    await db.graph.doPut(conn, dbName, triples, namedGraph, 'text/turtle')

    var t2 = Date.now();
    var dt = (t2-t1)/1000;

    // Count how many triples were stored
    let res = await query.execute(conn, dbName, `select (count(?s) as ?count) where { graph <${namedGraph}> {?s ?p ?o}}`);
    var count = res.body.results.bindings[0].count.value;

    console.log(`Wrote ${count} triples to store in ${dt} seconds`);

    return;
}

async function main() {
    try {
        // Use current time stamp as db-name and wipe log
        var dbName = 'test_'+Date.now();
        var logFile = `./${dbName}.csv`;
        var jsonLog = `./${dbName}.json`;
        var results = [];

        // Create database and read triples
        var dbOptions = {reasoning: {type: "SL"}};
        if(conf["reasoning-profile"]) dbOptions.reasoning.type = conf["reasoning-profile"];
        console.log("Profile: "+dbOptions.reasoning.type);

        // Load triples in memory
        var triples = "";
        if(files){
            // Load turtle files
            for(file of files){
                var filePath = path.resolve(path.join(conf.directory,file));
                triples += await readFile(filePath, 'utf-8');
                triples += "\n";
            }
        }

        // Add ontology to triples
        triples += await readFile(path.resolve("./bot.ttl"), 'utf-8');

        // For warm start, only load once
        if(conf.warm){
            await loadTriples(dbName,triples,dbOptions);
        }

        // Performing test set n times
        for(i = 1; i <= loops; i++){

            console.log(`Beginning loop ${i}`);
                        
            // For cold start, load for every loop
            if(!conf.warm){
                await loadTriples(dbName,triples,dbOptions);
            }

            var iteration = 1;
            for (q of queries){
                var t1 = Date.now();
                var params = q.reasoning ? {reasoning: true} : undefined;
                var res2 = await query.execute(conn, dbName, q.query, undefined, params);
                var t2 = Date.now();
                var dt = (t2-t1)/1000;

                // Push result to array
                results.push({name: q.name, time: dt});
                
                console.log(`Finished query ${iteration} in ${dt} seconds`);

                // Log result
                if(q.count){
                    var count2 = res2.body.results.bindings.length;
                    console.log(`${count2} results`);
                }
                iteration++;
            }

            // Wipe db if cold start
            if(!conf.warm){
                await db.drop(conn, dbName);
            }
        }
        // Wipe db if warm start
        if(conf.warm){
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

        // Calculate min
        var mins = _.chain(results)
            .groupBy('name')
            .flatMap(x => {
                var min = _.min(_.map(x, y => y.time));
                return {name: x[0].name, min: min}
            })
            .value();

        // Write results to JSON file
        await writeFile(jsonLog, JSON.stringify({results: results, means: means, mins: mins}),  {'flag':'a'});

        // Write to csv-file
        await writeFile(logFile, `Profile: ${dbOptions.reasoning.type}\n`,  {'flag':'a'});
        await writeFile(logFile, `Means\n`,  {'flag':'a'});
        for (m of means){
            var log = `"${m.name}", "${m.mean}"\n`;
            await writeFile(logFile, log,  {'flag':'a'});
        }
        await writeFile(logFile, `Mins\n`,  {'flag':'a'});
        for (m of mins){
            var log = `"${m.name}", "${m.min}"\n`;
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