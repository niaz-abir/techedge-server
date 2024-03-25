const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
// app.use(cors(Credential:true));
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("techEdge");
    const collection = db.collection("users");
    const flashSale = db.collection("flashSale");
    const products = db.collection("products");
    const reverie = db.collection("reverie");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // get flash-sale data
    app.get("/api/v1/flash-sale", async (req, res) => {
      const query = {};
      const result = await flashSale.find(query).toArray();

      res.send(result);
    });
    app.get("/api/v1/all-products", async (req, res) => {
      const query = {};
      const result = await products.find(query).toArray();

      res.send(result);
    });

    app.get("/api/v1/all-products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await products.findOne(query);
      res.send(result);
    });

    app.get("/api/v1/all-products/:brand", async (req, res) => {
      const brand = req.params.brand.toLowerCase();
      console.log(brand);
      try {
        const filteredProducts = products.filter(
          (product) => product.brands.toLowerCase() === brand
        );
        res.json(filteredProducts);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/api/v1/reverie", async (req, res) => {
      const query = {};
      const result = await reverie.find(query).toArray();
      res.send(result);
    });

    app.post("/api/v1/create-reverie", async (req, res) => {
      const newReverie = req.body;
      console.log(newReverie);
      const response = await reverie.insertOne(newReverie);
      res.send(response);
    });

    // Start the server

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
