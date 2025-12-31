require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

async function createAdminUser() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const defaultEmail = 'chuahadmin';
    const defaultPassword = 'chuahchuah';

    // Check if user already exists
    const existing = await User.findOne({ email: defaultEmail });
    if (existing) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email:', existing.email);
      console.log('   Display Name:', existing.display_name);
      console.log('\n   If you want to reset the password, delete the user first.');
      process.exit(0);
    }

    // Create new admin user
    const hashed = await bcrypt.hash(defaultPassword, 10);
    const user = await User.create({
      email: defaultEmail,
      password: hashed,
      display_name: 'Admin',
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('   Email/User ID:', user.email);
    console.log('   Password:', defaultPassword);
    console.log('   Display Name:', user.display_name);
    console.log('\n   You can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdminUser();

