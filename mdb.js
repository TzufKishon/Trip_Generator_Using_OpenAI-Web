const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Environment configuration
require('dotenv').config();

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON bodies

// MongoDB connection string should be stored in environment variables for security
const mongoDBUri = process.env.MONGODB_URI;

// Define the counter schema and model first
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

// Define the Trip schema and model
const TripSchema = new mongoose.Schema({
  counter: Number,
  name: String,
  startLat: Number,
  startLng: Number,
  endLat: Number,
  endLng: Number,
  image: String
});
const Trip = mongoose.model('Trip', TripSchema);

// Initialize counter if it doesn't exist
Counter.findOneAndUpdate(
  { _id: 'tripCounter' },
  { $setOnInsert: { seq: 0 } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
).then(result => {
  console.log("Initialized counter:", result);
}).catch(error => {
  console.error("Error creating counter:", error);
});

// Connect to MongoDB using mongoose
mongoose.connect(mongoDBUri)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 3000; // It seems you might want to use PORT here instead of 3001
    app.listen(3001, () => console.log(`Server running on port ${3001}`));
  })
  .catch(err => {
    console.error("Connection error:", err);
  });

// GET route to fetch the 10 most recent trips
app.get('/recent_trips', async (_req, res) => {
  try {
    const recentTrips = await Trip.find({}).sort({ _id: -1 }).limit(10);
    res.json(recentTrips);
  } catch (error) {
    console.error("Error fetching recent trips:", error);
    res.status(500).send({ message: 'Error fetching recent trips', error: error.toString() });
  }
});

// POST route to save trip data
app.post('/save_trip', async (req, res) => {
  console.log(req.body);
  try {
    const counterUpdate = await Counter.findOneAndUpdate(
      { _id: 'tripCounter' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!counterUpdate) {
      throw new Error('Counter update failed');
    }

    const newTrip = new Trip({
      ...req.body,
      counter: counterUpdate.seq
    });

    const savedTrip = await newTrip.save();
    res.status(200).send({ message: 'Trip saved', data: savedTrip });
  } catch (error) {
    console.error("Failed to save trip:", error);
    res.status(500).send({ message: 'Failed to save trip', error: error.toString() });
  }
});
