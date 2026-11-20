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
const AllProfile = db.collection("Profile");
const TeachersAddress = db.collection("Teacher-Address")


// ProfilePost
app.post('/ProfilePost', async (req, res) => {
  try {
    // ফ্রন্টএন্ড থেকে verified এলেও সেটি বাদ দিয়ে ব্যাকএন্ড থেকে verified: false সেট করা হচ্ছে
    const { verified, ...restProfile } = req.body;

    const Profile = {
      ...restProfile,
      verified: false,
      createdAt: new Date(),
    };

    const result = await AllProfile.insertOne(Profile);
    res.status(201).send(result);
  } catch (err) {
    console.error('Error saving profile:', err);
    res.status(500).send({ message: 'Error saving profile' });
  }
});

// Profile Updates
app.patch('/ProfileUpdate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, _id, ...updateFields } = req.body;

    const result = await AllProfile.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    res.status(200).send(result);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send({ message: 'Error updating profile' });
  }
});

app.patch('/AdminVerifyProfile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const result = await AllProfile.updateOne(
      { _id: new ObjectId(id) },
      { $set: { verified: Boolean(verified) } }
    );

    res.status(200).send(result);
  } catch (err) {
    console.error('Error verifying profile:', err);
    res.status(500).send({ message: 'Error verifying profile' });
  }
});

app.post('/TeachersProfile', async (req, res) => {
  try {
    const data = req.body;
    const result = await TeachersAddress.insertOne(data);
    res.send(result  );
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
