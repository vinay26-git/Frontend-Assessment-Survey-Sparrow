import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON body

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let eventsCollection;

// Connect to MongoDB once when server starts
async function connectDB() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || "calendar_app");
    eventsCollection = db.collection("events");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

connectDB();

/**
 * Event Schema (example):
 * {
 *   _id: ObjectId,
 *   date: "2025-11-26",        // YYYY-MM-DD
 *   title: "Meeting",
 *   description: "Project discussion",
 *   createdAt: ISODate
 * }
 */

// GET /events?date=2025-11-26  → events for specific date
app.get("/events", async (req, res) => {
  try {
    const { date } = req.query;

    const query = date ? { date } : {};
    const events = await eventsCollection.find(query).sort({ date: 1 }).toArray();
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST /events  → add new event
app.post("/events", async (req, res) => {
  try {
    const { date, title, description } = req.body;

    if (!date || !title) {
      return res.status(400).json({ error: "date and title are required" });
    }

    const doc = {
      date,               // expect "YYYY-MM-DD"
      title,
      description: description || "",
      createdAt: new Date(),
    };

    const result = await eventsCollection.insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error("Error adding event:", err);
    res.status(500).json({ error: "Failed to add event" });
  }
});

// DELETE /events/:id  → delete a specific event
app.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
