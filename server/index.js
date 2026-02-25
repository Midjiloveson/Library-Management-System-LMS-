const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

// IMPORT ROUTES
const bookRoutes = require('./routes/bookRoutes'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // This allows the server to read JSON data sent by the frontend

// ATTACH ROUTES
app.use('/api/books', bookRoutes); 

const uri = process.env.MONGO_URI || "mongodb+srv://admin:Password123@cluster0.9qikogm.mongodb.net/?appName=Cluster0";

mongoose.connect(uri)
  .then(() => console.log("MongoDB database connection established successfully"))
  .catch(err => console.log("MongoDB connection error:", err));

app.get('/', (req, res) => {
  res.send("The server is alive and routes are connected!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});