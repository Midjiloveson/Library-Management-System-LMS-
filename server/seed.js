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
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // 5. Bulk insert into Atlas
    await Book.insertMany(data);
    
    console.log(`\n✅ SUCCESS!`);
    console.log(`Synchronized ${data.length} real books from books.json to MongoDB.`);
    
    process.exit();
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
    process.exit(1);
  }
};

seedFromFile();