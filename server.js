// Require the framework and instantiate it
const fastify = require('fastify')({ logger: false });
const search = require('./google');
const cors = require('@fastify/cors');
const { MongoClient } = require("mongodb");


const client = new MongoClient(`mongodb+srv://tint:${process.env.DB_PWD}@cluster0.upxu80i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);
let DB, DB2;

async function connectDB2() {
    const url = `mongodb+srv://root:${process.env.DB_PWD}@riders.hd4vtve.mongodb.net/admin?authSource=admin&replicaSet=atlas-7ub5o0-shard-0&w=majority&readPreference=primary&appname=riders&retryWrites=true&ssl=true`;
    const client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db("rsearch");
    return db;
}

(async function () {
    try {
        await client.connect();
        DB = client.db("rsearch");
        DB2 = await connectDB2();
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
    const results = await search(request.query.q, request.query.original ? true : false);
    results.reverse();
    const now = Date.now();
    return {
        items: results,
        time: (now - then) / 1000,
        rc: results.length
    };
});


fastify.get('/api/log', async (request, reply) => {
    const collection = await (request.query.db ? DB2 : DB).collection('log');
    const data = await collection.find(request.body);
    return await data.toArray();
});

fastify.post('/api/log', async (request, reply) => {
    const collection = await (request.query.db ? DB2 : DB).collection('log');
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