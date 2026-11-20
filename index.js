import { MongoClient, ObjectId } from 'mongodb';
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
    return;
  }
}

const MongoDB = await connectToMongoDB();
const db = MongoDB.db("assignment-projects");
const UserProfiles = db.collection("Profile");
const TeachersAddress = db.collection("Teacher-Address")
const tuitionsCollection = db.collection("Tuitions")
//========================================================
//All Sign UP member Profile
//===============================================
// ১. POST: UserProfiles কালেকশনে ডেটা সেভ করা
app.post("/UserProfiles", async (req, res) => {
  try {
    const { verified, ...Profile } = req.body; // verified এখানে রাখা হচ্ছে না
    const result = await UserProfiles.insertOne({
      ...Profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(201).send(result);
  } catch (err) {
    console.error("POST /UserProfile error:", err);
    res.status(500).send({ message: "Error saving profile" });
  }
});

// ২. PATCH: UserProfiles কালেকশনের ডেটা _id দিয়ে আপডেট করা
app.patch("/UsersUpdate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, verified, ...UpdateUsers } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid profile ID" });
    }

    const result = await UserProfiles.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...UpdateUsers,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Profile not found" });
    }

    res.status(200).send(result);
  } catch (err) {
    console.error("PATCH /UsersUpdate/:id error:", err);
    res.status(500).send({ message: "Error updating profile" });
  }
});

// ৩. GET: email অনুযায়ী UserProfiles থেকে ডেটা আনা
app.get("/UsersGet/:email", async (req, res) => {
  try {
    const email = String(req.params.email || "").trim();

    // টপ-লেভেল email অথবা addedBy.email—যেকোনোটিতে মিললেই আনবে
    const result = await UserProfiles.find({
      $or: [{ email }, { "addedBy.email": email }],
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    res.status(200).send(result);
  } catch (err) {
    console.error("GET /UsersGet/:email error:", err);
    res.status(500).send({ message: "Error fetching user profile" });
  }
});
//================================================
//Only Teachers Profile
//================================================
// ১. POST: Teacher profile সেভ করা
app.post("/TeachersProfile", async (req, res) => {
  try {
    const TeacherProfile = req.body;
    const result = await TeachersAddress.insertOne({
      ...TeacherProfile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(201).send(result);
  } catch (err) {
    console.error("POST /TeachersProfile error:", err);
    res.status(500).send({ message: "Error saving teacher profile" });
  }
});

// ২. PATCH: Teacher profile _id দিয়ে আপডেট করা
app.patch("/TeachersUpdate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, ...UpdateTeachers } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid teacher profile ID" });
    }

    const result = await TeachersAddress.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...UpdateTeachers,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Teacher profile not found" });
    }

    res.status(200).send(result);
  } catch (err) {
    console.error("PATCH /TeachersUpdate/:id error:", err);
    res.status(500).send({ message: "Error updating teacher profile" });
  }
});

// ৩. GET: email অনুযায়ী teacher profile আনা
app.get("/TeachersProfile/:email", async (req, res) => {
  try {
    const email = String(req.params.email || "").trim();

    const result = await TeachersAddress.find({
      $or: [{ email }, { "addedBy.email": email }],
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    res.status(200).send(result);
  } catch (err) {
    console.error("GET /TeachersProfile/:email error:", err);
    res.status(500).send({ message: "Error fetching teacher profile" });
  }
});

//======================================================
//Teachers Dashboard 
//=====================================================
// POST: Teacher নতুন Tuition পোস্ট করবে
app.post("/TuitionsPost", async (req, res) => {
  try {
    const {
      _id,
      status,
      verificationStatus,
      Name,
      Email,
      ...tuitionData
    } = req.body;

    if (!tuitionData.title || !String(tuitionData.title).trim()) {
      return res.status(400).send({ message: "Title is required" });
    }

    const newTuition = {
      ...tuitionData,
      // Purono frontend `Name` / `Email` (capital) pathato.
      // Ekhon lowercase `name` / `email` e save kori, jate email diye GET kaj kore.
      name: tuitionData.name || Name || "",
      email: tuitionData.email || Email || "",
      title: String(tuitionData.title).trim(),
      monthlyFee: Number(tuitionData.monthlyFee || 0),
      status: "active", // Teacher পরবর্তীতে "active" বা "closed" করবে
      verificationStatus: "pending", // Admin পরবর্তীতে "verified" বা "rejected" করবে
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tuitionsCollection.insertOne(newTuition);

    res.status(201).send({
      message: "Tuition created successfully",
      insertedId: result.insertedId,
      tuition: { _id: result.insertedId, ...newTuition },
    });
  } catch (error) {
    console.error("POST /Tuitions error:", error);
    res.status(500).send({ message: "Failed to create tuition" });
  }
});

// GET: Teacher-এর email দিয়ে তার পোস্ট করা সব Tuition আনা
app.get("/TeacherTeutionsGet/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email || "").trim();

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const tuitions = await tuitionsCollection
      .find({
        // Notun data te `email`; purono data te `Email` thakte pare.
        $or: [{ mentorEmail: email }, { email: email }, { Email: email }],
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).send(tuitions);
  } catch (error) {
    console.error("GET /tuitions/:email error:", error);
    res.status(500).send({ message: "Failed to fetch teacher tuitions" });
  }
});

// GET: সব Tuition আনা
// GET: সব Tuition অথবা search ও filter query দিয়ে আনা
app.get("/Tuitions", async (req, res) => {
  try {
    const query = {};
    const {
      search,
      subject,
      classLevel,
      deliveryMode,
      location,
      status,
      verificationStatus,
    } = req.query;

    // সার্চ কিওয়ার্ড (title, subject, classLevel, location দিয়ে ম্যাচ করবে)
    if (search && String(search).trim()) {
      const keyword = String(search).trim();
      const regex = new RegExp(keyword, "i");

      query.$or = [
        { title: regex },
        { subject: regex },
        { classLevel: regex },
        { location: regex },
      ];
    }

    if (subject && subject !== "all") {
      query.subject = new RegExp(`^${String(subject).trim()}$`, "i");
    }

    if (classLevel && classLevel !== "all") {
      query.classLevel = new RegExp(`^${String(classLevel).trim()}$`, "i");
    }

    if (deliveryMode && deliveryMode !== "all") {
      query.deliveryMode = new RegExp(`^${String(deliveryMode).trim()}$`, "i");
    }

    if (location && String(location).trim()) {
      query.location = new RegExp(String(location).trim(), "i");
    }

    if (status) {
      query.status = String(status).trim();
    }

    if (verificationStatus) {
      query.verificationStatus = String(verificationStatus).trim();
    }

    const tuitions = await tuitionsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).send(tuitions);
  } catch (error) {
    console.error("GET /Tuitions error:", error);
    res.status(500).send({ message: "Failed to fetch tuitions" });
  }
});

// GET: সব Tuition অথবা filter query দিয়ে আনা
app.get("/AllTuitions", async (req, res) => {
  try {
    const query = {};

    if (req.query.mentorEmail) {
      query.mentorEmail = String(req.query.mentorEmail).trim();
    }

    if (req.query.status) {
      query.status = String(req.query.status).trim();
    }

    if (req.query.verificationStatus) {
      query.verificationStatus = String(req.query.verificationStatus).trim();
    }

    const tuitions = await tuitionsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).send(tuitions);
  } catch (error) {
    console.error("GET /Tuitions error:", error);
    res.status(500).send({ message: "Failed to fetch tuitions" });
  }
});


// Teacher: নিজের Tuition "active" বা "closed" করবে
app.patch("/Tuitions/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "closed"].includes(status)) {
      return res.status(400).send({ message: "Use 'active' or 'closed'" });
    }

    const result = await tuitionsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Tuition not found" });
    }

    res.status(200).send({ message: `Status changed to ${status}`, status, result });
  } catch (error) {
    console.error("Status error:", error);
    res.status(500).send({ message: "Failed to update status" });
  }
});

// PATCH (Teacher): id দিয়ে Tuition এডিট করা
app.patch("/TuitionsEdit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, status, verificationStatus, ...updateData } = req.body;

    if (updateData.monthlyFee !== undefined) {
      updateData.monthlyFee = Number(updateData.monthlyFee);
    }

    const result = await tuitionsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Tuition not found" });
    }

    res.status(200).send({ message: "Tuition updated", result });
  } catch (error) {
    console.error("Edit error:", error);
    res.status(500).send({ message: "Failed to update tuition" });
  }
});

// Admin: Tuition "verified" বা "rejected" করবে
app.patch("/Tuitions/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    if (!["pending", "verified", "rejected"].includes(verificationStatus)) {
      return res.status(400).send({
        message: "Use 'pending', 'verified', or 'rejected'",
      });
    }

    const result = await tuitionsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          verificationStatus,
          verifiedAt: verificationStatus === "verified" ? new Date() : null,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Tuition not found" });
    }

    res.status(200).send({
      message: `Tuition ${verificationStatus}`,
      verificationStatus,
      result,
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).send({ message: "Failed to verify tuition" });
  }
});

// "use client";

// import React, { useState } from "react";

// interface AdminVerifyButtonsProps {
//   tuitionId: string;
//   currentStatus?: string;
//   onSuccess?: (newStatus: "verified" | "rejected") => void;
// }

// export default function AdminVerifyButtons({
//   tuitionId,
//   currentStatus = "pending",
//   onSuccess,
// }: AdminVerifyButtonsProps) {
//   const [loading, setLoading] = useState(false);

//   const backendUrl =
//     process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

//   const handleVerifyAction = async (
//     nextStatus: "verified" | "rejected"
//   ) => {
//     try {
//       setLoading(true);

//       const res = await fetch(`${backendUrl}/Tuitions/${tuitionId}/verify`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ verificationStatus: nextStatus }),
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         throw new Error(data?.message || "Failed to update verification");
//       }

//       onSuccess?.(nextStatus);
//     } catch (error) {
//       console.error("Admin verify error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center gap-2">
//       <button
//         type="button"
//         disabled={loading || currentStatus === "verified"}
//         onClick={() => handleVerifyAction("verified")}
//         className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
//       >
//         Verify
//       </button>

//       <button
//         type="button"
//         disabled={loading || currentStatus === "rejected"}
//         onClick={() => handleVerifyAction("rejected")}
//         className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
//       >
//         Reject
//       </button>
//     </div>
//   );
// }
// DELETE (Teacher or Admin): টিচার অথবা অ্যাডমিন Tuition ডিলিট করতে পারবে
// Teacher বা Admin: Tuition ডিলিট করবে
app.delete("/TuitionsDelete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await tuitionsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Tuition not found" });
    }

    res.status(200).send({ message: "Tuition deleted", result });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).send({ message: "Failed to delete tuition" });
  }
});


app.listen(PORT, () => {
  console.log("This Backend Port is", PORT)
})

export default app;
