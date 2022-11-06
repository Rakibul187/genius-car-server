const express = require('express');
const cors = require('cors');
const app = express();
var jwt = require('jsonwebtoken')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.Port || 5000;
require("dotenv").config()


app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.farjvzi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "unAuthorized access" })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden access" })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {
        const serviceCollection = client.db('geniusCar').collection('services');
        const orderCollection = client.db('geniusCar').collection('orders')

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray()
            res.send(services)
        });


        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token })
        })

        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }

            const service = await serviceCollection.findOne(query);
            res.send(service)
        })

        // create orders api
        app.post("/orders", async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })

        // create orders data get api
        app.get("/orders", verifyJWT, async (req, res) => {
            // console.log(req.headers.authorization.split(' ')[1])
            const decoded = req.decoded;
            console.log('inside order api', decoded)
            if (decoded.email !== req.query?.email) {
                return res.status(403).send({ message: "unAuthorized access" })
            }


            let query = {}

            if (req.query?.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders)
        })

        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: status
                }
            }
            const result = await orderCollection.updateOne(query, updatedDoc)
            res.send(result)
        })

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })

    }
    finally {

    }
}

run().catch(e => console.error(e))

app.get('/', (req, res) => {
    res.send("Genius car server is running")
})

app.listen(port, () => {
    console.log(`Genius car server running on port ${port}`)
})