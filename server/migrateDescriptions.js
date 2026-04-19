const mongoose = require('mongoose');
const axios = require('axios');
const Book = require('./models/Book');
require('dotenv').config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const books = await Book.find({
      $or: [{ description: { $exists: false } }, { description: "" }]
    });

    console.log(`Searching for descriptions for ${books.length} books...`);

    for (const book of books) {
      try {
        console.log(`Looking up: ${book.title}...`);

        // Use the Open Library "Search" API which is more reliable for titles
        const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&limit=1`;
        const res = await axios.get(searchUrl);

        if (res.data.docs && res.data.docs.length > 0) {
          const key = res.data.docs[0].key; // e.g., /works/OL123W
          
          // Get the actual "Work" data which contains the description
          const workRes = await axios.get(`https://openlibrary.org${key}.json`);
          
          let description = workRes.data.description;

          // Open Library sometimes returns description as an object or a string
          if (description && typeof description === 'object') {
            description = description.value;
          }

          if (description) {
            // Clean up the text (remove some common markdown)
            book.description = description.split('---')[0].substring(0, 500); 
            await book.save();
            console.log(`   ✅ Description Found!`);
          } else {
            console.log(`   ⚠️ No description field for this edition.`);
          }
        }

        // Wait 2 seconds between books to be nice to their servers
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err) {
        console.error(`   ❌ Failed for ${book.title}:`, err.message);
      }
    }

    console.log("Process finished.");
    process.exit(0);
  } catch (err) {
    console.error("Critical Error:", err);
  }
};

migrate();