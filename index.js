const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 3000

const app = express();
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://BloodLove:8LZ8o1zW4cGs3Lqs@cluster0.hc6rogn.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const database=client.db('bloodlove')
    const userCollections = database.collection('user')
    const productCollections = database.collection('product')

    app.post('/users',async(req,res)=>{
      const userInfo = req.body;
      userInfo.createdAt = new Date();

      const result = await userCollections.insertOne(userInfo);
      res.send(result)
    })

    app.get('/users/role/:email', async(req,res)=>{
      const {email} =req.params
      console.log(email);

      const query = {email:email}
      const result = await userCollections.findOne(query)
      console.log(result);
      res.send(result)
    })

    //Products
    app.post('/products', async(req,res)=>{
      const data = req.body;
      data.createdAt= new Date();
      const result = await productCollections.insertOne(data);
      res.send(result);
    })


    // get Product detales
    app.get('/manager/products/:email', async(req, res)=>{
      const email = req.params.email;   
      const query = {managerEmail: email};
      
      const result = await productCollections.find(query).toArray();
      console.log(result);
      
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send("Welcome to Blood Love!")
})

app.listen(port,()=>{
    console.log(`Server is running on ${port}`);
})

