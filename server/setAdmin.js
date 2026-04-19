require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = 'bookworm@library.com';

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { role: 'admin', email } },
    { upsert: true, returnDocument: 'after' }
  );

  console.log(`✅ ${email} is now an admin.`);
  process.exit();
}).catch(err => {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
});
