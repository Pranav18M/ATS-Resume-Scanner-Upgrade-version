// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// ========================================
// POST /api/auth/signup - Create new user
// ========================================
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please enter a valid email address' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email already exists. Please login instead.' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await user.save();
    console.log(`✅ New user registered: ${user.email}`);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      email: user.email,
      userId: user._id
    });

  } catch (error) {
    console.error('🔥 Signup error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Email already exists. Please login instead.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during signup. Please try again.' 
    });
  }
});

// ========================================
// POST /api/auth/login - Login user
// ========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log(`✅ User logged in: ${user.email}`);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      email: user.email,
      userId: user._id
    });

  } catch (error) {
    console.error('🔥 Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login. Please try again.' 
    });
  }
});

// ========================================
// POST /api/auth/verify - Verify JWT token
// ========================================
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      message: 'Token verified',
      email: user.email,
      userId: user._id
    });

  } catch (error) {
    console.error('🔥 Verify error:', error);
    res.status(500).json({ 
      message: 'Server error during verification' 
    });
  }
});

// ========================================
// POST /api/auth/logout - Logout user
// ========================================
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // In JWT, logout is typically handled client-side by removing the token
    // But we can log the action here if needed
    console.log(`✅ User logged out: ${req.userEmail}`);
    
    res.status(200).json({ 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('🔥 Logout error:', error);
    res.status(500).json({ 
      message: 'Server error during logout' 
    });
  }
});

// ========================================
// GET /api/auth/me - Get current user
// ========================================
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      email: user.email,
      userId: user._id,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });

  } catch (error) {
    console.error('🔥 Get user error:', error);
    res.status(500).json({ 
      message: 'Server error fetching user data' 
    });
  }
});

module.exports = router;