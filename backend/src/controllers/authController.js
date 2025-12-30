const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const TOKEN_PREFIX = 'Token';

function createToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

function formatUser(user) {
  return {
    id: user._id,
    email: user.email,
    display_name: user.display_name || '',
    profile_picture: user.profile_picture || '',
  };
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, display_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashed,
      display_name: display_name || '',
    });

    const token = createToken(user._id);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Support both email and userid login
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { email: email } // For userid like 'chuahadmin'
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user._id);
    const safeUser = await User.findById(user._id);

    res.json({ token, user: formatUser(safeUser) });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (_req, res) => {
  res.json({ message: 'Logged out' });
};

exports.checkAuth = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true });
};

exports.TOKEN_PREFIX = TOKEN_PREFIX;

