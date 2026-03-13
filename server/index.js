require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const Book = require('./models/Book'); 

// IMPORT ROUTES
const bookRoutes = require('./routes/bookRoutes'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ATTACH ROUTES
app.use('/api/books', bookRoutes); 
app.use('/api/auth', require('./routes/authRoutes'));

const uri = process.env.MONGO_URI || "mongodb+srv://admin:Password123@cluster0.9qikogm.mongodb.net/?appName=Cluster0";

mongoose.connect(uri)
  .then(() => {
    console.log("MongoDB database connection established successfully");
    
    // 2. START THE TIMER (Runs every 1 hour)
    setInterval(checkExpiredHolds, 60 * 60 * 1000); 
    console.log("Hold cleanup task started...");
  })
  .catch(err => console.log("MongoDB connection error:", err));

const checkExpiredHolds = async () => {
  try {
    const expirationLimit = 48 * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - expirationLimit);

    const expiredBooks = await Book.find({
      isAvailable: false,
      borrowedBy: null,
      holdStartedAt: { $lt: cutoffTime },
      "holds.0": { $exists: true } 
    });

    for (let book of expiredBooks) {
      book.holds.shift(); 

      if (book.holds.length > 0) {
        book.holdStartedAt = new Date(); 
      } else {
        book.isAvailable = true;
        book.holdStartedAt = null;
      }
      await book.save();
      console.log(`Hold expired for book: ${book.title}. Window passed to next user.`);
    }
  } catch (err) {
    console.error("Hold cleanup error:", err);
  }
};

app.get('/', (req, res) => {
  res.send("The server is alive and routes are connected!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});