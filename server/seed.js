const mongoose = require('mongoose');
const Book = require('./models/Book');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const seedFromFile = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Wipe the current collection to ensure a clean start
    await Book.deleteMany({});
    console.log("Database cleared.");

    // 2. Resolve the path to books.json
    const filePath = path.join(__dirname, 'books.json');

    // 3. Check if the file exists before reading
    if (!fs.existsSync(filePath)) {
      throw new Error("books.json not found! Please create it in the server folder.");
    }

    // 4. Read and parse the JSON data
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // 5. Map defaults to all books
    const preparedData = rawData.map(book => ({
      ...book,
      isAvailable: book.isAvailable ?? true, // Keep original if exists, otherwise true
      isDeleted: false,      // All seeded books start as active
      holds: [],             // Empty waitlist
      borrowedBy: null,      // No one has it yet
      dueDate: null,         // No due date yet
      holdStartedAt: null    // No active 48hr timers
    }));

    // 6. Bulk insert into Atlas
    await Book.insertMany(preparedData);
    
    console.log(`\n✅ SUCCESS!`);
    console.log(`Synchronized ${preparedData.length} books from books.json to MongoDB with full system defaults.`);
    
    process.exit();
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
    process.exit(1);
  }
};

seedFromFile();