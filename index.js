import { MongoClient } from 'mongodb';
import cors from 'cors'
import express from 'express';
import dotenv from 'dotenv/config';

import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;

const client = new MongoClient(process.env.MONGODB_SECRET_URL);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
     return ;
  }
}

const MongoDB = await connectToMongoDB();
const db = MongoDB.db("assignment-projects");
const booksCollection = db.collection("simple");

app.post('/AmarPost', async (req, res) => {
  try {
    const newBook = req.body;
    const result = await booksCollection.insertOne(newBook);
    res.status(201).send(result);
  } catch (err) {
    res.status(500).send('Error adding book');
  }
});

app.get('/AmarGet', async (req, res) => {
  try {
    const books = await booksCollection.find().toArray();
    res.send(books);
  } catch (err) {
    res.status(500).send('Error fetching books');
  }
});

app.get("/", (req, res) =>{
    res.send("Ami Akhono jani na Assingment ta")
})


app.listen(PORT,() =>{
    console.log("This Backend Port is",PORT)
})
