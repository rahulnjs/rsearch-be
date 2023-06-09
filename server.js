// Require the framework and instantiate it
const fastify = require('fastify')({ logger: false });
const search = require('./google');
const cors = require('@fastify/cors');
const { MongoClient } = require("mongodb");


const client = new MongoClient(`mongodb+srv://tint:${process.env.DB_PWD}@cluster0.upxu80i.mongodb.net/admin?authSource=admin&replicaSet=atlas-1228dx-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true`);
let DB;

(async function () {
    try {
        await client.connect();
        DB = client.db("rsearch");
        console.log("Connected to DB too...");
    } catch (e) {
        console.log("DB Connection failed", e);
    }
})();

fastify.register(cors, {
    // put your options here
});

// Declare a route
fastify.get('/api/search', async (request, reply) => {
    const then = Date.now();
    const results = await search(request.query.q);
    results.reverse();
    const now = Date.now();
    return {
        items: results,
        time: (now - then) / 1000,
        rc: results.length
    };
});


fastify.get('/api/log', async (request, reply) => {
    const collection = await DB.collection('log');
    const data = await collection.find(request.body);
    return await data.toArray();
});

fastify.post('/api/log', async (request, reply) => {
    const collection = await DB.collection('log');
    await collection.insertOne(request.body);
    return {
        ok: 1
    };
});


// Run the server!
const start = async () => {
    try {
        await fastify.listen({ port: 9311 })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()