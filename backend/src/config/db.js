const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined. Please set it in your environment.');
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    console.log(`📍 Database: ${mongoose.connection.name}`);

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:');
    console.error('Error:', error.message);

    if (error.message.includes('IP') || error.message.includes('whitelist') || error.name === 'MongooseServerSelectionError') {
      console.error('\n💡 Common fix: IP address not whitelisted in MongoDB Atlas');
      console.error('   1. Go to MongoDB Atlas → Network Access');
      console.error('   2. Click "Add IP Address"');
      console.error('   3. Click "Allow Access from Anywhere" (adds 0.0.0.0/0)');
      console.error('   4. Wait 1-2 minutes for changes to propagate\n');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Authentication failed. Check username and password in MONGODB_URI\n');
    }

    throw error;
  }
}

module.exports = connectDB;

