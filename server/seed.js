const mongoose = require('mongoose');
const Book = require('./models/Book');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const sampleBooks = [
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", category: "Classic" },
  { title: "1984", author: "George Orwell", isbn: "9780451524935", category: "Dystopian" },
  { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "9780547928227", category: "Fantasy" },
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084", category: "Classic" },
  { title: "Dune", author: "Frank Herbert", isbn: "9780441172719", category: "Sci-Fi" }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Book.deleteMany({}); // Clears out the database so you don't get duplicates
    await Book.insertMany(sampleBooks);
    console.log("Database Seeded Successfully! 📚");
    process.exit(); // Closes the script
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
};

seedDB();