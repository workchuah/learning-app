const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedDefaultUser() {
  try {
    const defaultEmail = 'chuahadmin';
    const defaultPassword = 'chuahchuah';

    const existing = await User.findOne({ email: defaultEmail });
    if (existing) {
      console.log('✅ Default admin user already exists');
      return;
    }

    const hashed = await bcrypt.hash(defaultPassword, 10);
    await User.create({
      email: defaultEmail,
      password: hashed,
      display_name: 'Admin',
    });

    console.log('✅ Default admin user created (chuahadmin / chuahchuah)');
  } catch (error) {
    console.error('⚠️  Could not seed default user:', error.message);
  }
}

module.exports = seedDefaultUser;

