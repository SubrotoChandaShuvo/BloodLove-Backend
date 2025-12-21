const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;
const stripe = require("stripe")(process.env.STRIPE_SECRATR);
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const admin = require("firebase-admin");
const { Query } = require("firebase-admin/firestore");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);

const verifyFBToken = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send({ message: "unauthorize access" });
  }

  try {
    const idToken = token.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    // console.log("decoded info", decoded);
    req.decoded_email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).send({ message: "unauthorize access" });
  }
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri =
  "mongodb+srv://BloodLove:8LZ8o1zW4cGs3Lqs@cluster0.hc6rogn.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db("bloodlove");
    const userCollections = database.collection("user");
    const requestsCollections = database.collection("request");
    const paymentsCollections = database.collection("payments");

    //Users Post
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      userInfo.createdAt = new Date();
      userInfo.role = "donor";
      userInfo.status = "active";
      const result = await userCollections.insertOne(userInfo);
      res.send(result);
    });

    //Users Get
    app.get("/users", verifyFBToken, async (req, res) => {
      const result = await userCollections.find().toArray();
      res.status(200).send(result);
    });

    //user status Update
    app.patch("/update/user/status", verifyFBToken, async (req, res) => {
      const { email, status } = req.query;
      const query = { email: email };

      const updateStatus = {
        $set: {
          status: status,
        },
      };

      const result = await userCollections.updateOne(query, updateStatus);
      res.send(result);
    });

    //Update Profile
    app.patch("/users/update/profile", verifyFBToken, async (req, res) => {
      const { email } = req.query;
      const updatedProfile = req.body;

      const query = { email: email };
      const updateDoc = { $set: updatedProfile };

      const result = await userCollections.updateOne(query, updateDoc);
      res.send(result);
    });

    app.get("/users/role/:email", async (req, res) => {
      const { email } = req.params;

      const query = { email: email };
      const result = await userCollections.findOne(query);
      // console.log(result);
      res.send(result);
    });

    //Request
    app.post("/request", verifyFBToken, async (req, res) => {
      const data = req.body;
      data.createdAt = new Date();
      const result = await requestsCollections.insertOne(data);
      res.send(result);
    });

    // All request
    // app.get("/request", async (req, res) => {
    //   const result = await requestsCollections.find().toArray();
    //   console.log(result);
    //   res.send(result);
    // });
    app.get("/request", async (req, res) => {
      const page = parseInt(req.query.page) || 0; // 0-indexed
      const size = parseInt(req.query.size) || 9; // items per page

      const totalRequests = await requestsCollections.countDocuments();

      const requests = await requestsCollections
        .find()
        .skip(page * size)
        .limit(size)
        .toArray();

      res.send({
        requests,
        totalRequests,
      });
    });

    // get my_request
    app.get("/my-request", verifyFBToken, async (req, res) => {
      const email = req.decoded_email;

      const page = Number(req.query.page) || 0;
      const size = Number(req.query.size) || 10;
      const status = req.query.status;

      // base query
      const query = {
        requesterEmail: email,
      };

      if (status && status !== "all") {
        query.donationStatus = status;
      }

      const result = await requestsCollections
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();

      const totalRequest = await requestsCollections.countDocuments(query);

      res.send({
        request: result,
        totalRequest,
      });
    });

    //main dashboard
    app.get("/myRequest", async (req, res) => {
      const { email, limit } = req.query;
      console.log("hello");

      console.log(email, limit);

      const requests = await requestsCollections
        .find({ requesterEmail: email })
        .sort({ donationDate: -1 })
        .limit(parseInt(limit) || 3)
        .toArray();
      console.log(requests);

      res.send({ requests });
    });

    app.patch("/updateRequest/user/status", async (req, res) => {
      const { requestId, status } = req.query;
      const query = { _id: new ObjectId(requestId) };
      const update = { $set: { donationStatus: status } };
      const result = await requestsCollections.updateOne(query, update);
      res.send(result);
    });

    //Payment
    app.post("/create-payment-checkout", async (req, res) => {
      const information = req.body;
      const amount = parseInt(information.donateAmount) * 100;

      //Stripe er main kaj
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: "Please Donate",
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          donarName: information?.donorName,
        },
        customer_email: information.donorEmail,
        success_url: `${process.env.SITE_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}/payment-cancelled`,
      });

      res.send({ url: session.url });
    });

    // stripe er payment details DB te save
    app.post("/success-payment", async (req, res) => {
      const { session_id } = req.query;
      const session = await stripe.checkout.sessions.retrieve(session_id);
      // console.log(session);

      const transactionId = session.payment_intent;
      if (session.payment_status == "paid") {
        const paymentInfo = {
          amount: session.amount_total / 100,
          currency: session.currency,
          donorEmail: session.customer_email,
          transactionId,
          payment_status: session.payment_status,
          paidAt: new Date(),
        };
        const result = await paymentsCollections.insertOne(paymentInfo);
        return res.send(result);
      }
    });

    // search er Kaj
    app.get("/search-requests", async (req, res) => {
      const { bloodGroup, district, upazila } = req.query;
      const query = {};
      if (!Query) {
        return;
      }
      if (bloodGroup) {
        const fixed = bloodGroup.replace(/ /g, "+").trim();
        query.blood = fixed;
      }
      if (district) {
        query.district = district;
      }
      if (upazila) {
        query.upazila = upazila;
      }

      const result = await userCollections.find(query).toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to Blood Love!");
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
