
// // --- routes/users.js ---
// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const { v4: uuidv4 } = require('uuid'); 
// const bcrypt = require('bcryptjs'); // ✅ ADDED: Import bcryptjs for password hashing
// const User = require('../models/User');
// const Message = require('../models/message');

// const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';
// const COOKIE_NAME = 'token';

// // ✅ Login or register user (MODIFIED)
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   if (!username || !password) {
//     return res.status(400).json({ error: 'Username and password are required' });
//   }

//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(401).json({ error: 'Username and password do not match' });
//     }

//     // Compare the provided password with the stored hashed password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ error: 'Username and password do not match' });
//     }

//     const sessionId = uuidv4();
//     user.sessions.push(sessionId);
//     await user.save();

//     const token = jwt.sign({ id: user._id, username: user.username, sessionId }, JWT_SECRET, { expiresIn: '7d' });

//     res.cookie(COOKIE_NAME, token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'Lax',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     const allUsers = await User.find({ username: { $ne: username } });
//     res.status(200).json({ message: 'Logged in', user, users: allUsers });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // ✅ Signup user (NEW ROUTE)
// router.post('/signup', async (req, res) => {
//   const { username, password, photoURL } = req.body;

//   if (!username || !password) {
//     return res.status(400).json({ error: 'Username and password are required' });
//   }

//   try {
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.status(409).json({ error: 'User with this email already exists' });
//     }

//     // Hash the password before saving it to the database
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const user = await User.create({ username, password: hashedPassword, photoURL });

//     res.status(201).json({ message: 'User registered successfully', user });
//   } catch (err) {
//     console.error('Signup error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });


// // ✅ Auth check on reload (MODIFIED for multi-session)
// router.get('/me', async (req, res) => {
//   try {
//     const token = req.cookies[COOKIE_NAME];
//     if (!token) return res.status(401).json({ error: 'Unauthorized' });

//     const decoded = jwt.verify(token, JWT_SECRET);
//     const currentUser = await User.findById(decoded.id);
//     if (!currentUser) return res.status(404).json({ error: 'User not found' });

//     if (!currentUser.sessions.includes(decoded.sessionId)) {
//       res.clearCookie(COOKIE_NAME);
//       return res.status(401).json({ error: 'Session expired or invalidated' });
//     }

//     const allUsers = await User.find({ username: { $ne: currentUser.username } });

//     const usersWithUnseen = await Promise.all(
//       allUsers.map(async (user) => {
//         const unseenCount = await Message.countDocuments({
//           sender: user.username,
//           receiver: currentUser.username,
//           status: { $ne: 'read' },
//         });

//         return {
//           ...user.toObject(),
//           hasUnseen: unseenCount > 0,
//         };
//       })
//     );

//     res.json({ user: currentUser, users: usersWithUnseen });
//   } catch (err) {
//     console.error('Auth error:', err);
//     res.status(401).json({ error: 'Invalid or expired token' });
//   }
// });


// // ✅ Logout (MODIFIED for multi-session)
// router.get('/logout', async (req, res) => {
//   const token = req.cookies[COOKIE_NAME];
//   if (!token) {
//     res.clearCookie(COOKIE_NAME);
//     return res.json({ message: 'Already logged out' });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await User.findById(decoded.id);

//     if (user && decoded.sessionId) {
//       user.sessions = user.sessions.filter(s => s !== decoded.sessionId);
//       await user.save();
//     }
//   } catch (err) {
//     console.error('Logout error:', err);
//   } finally {
//     res.clearCookie(COOKIE_NAME);
//     res.json({ message: 'Logged out' });
//   }
// });

// module.exports = router;

// --- routes/users.js ---
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Message = require('../models/message');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';
const COOKIE_NAME = 'token';

// ✅ Login/Auth route that handles both password and password-less logins
router.post('/login', async (req, res) => {
  const { username, password, photoURL } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    let user = await User.findOne({ username });

    // Handle traditional email/password login
    if (password) {
      if (user && user.password) {
        // User exists and has a password, compare it
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Username and password do not match' });
        }
      } else {
        // New user or existing user without a password, create a new user.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = await User.create({ username, password: hashedPassword, photoURL });
      }
    } 
    // Handle password-less login (e.g., from Firebase Google)
    else {
      // If user doesn't exist, create a new one with no password
      if (!user) {
        user = await User.create({ username, photoURL });
      }
      // If user exists and photoURL has changed, update it
      else if (photoURL && user.photoURL !== photoURL) {
        user.photoURL = photoURL;
        await user.save();
      }
    }

    // After successful auth, create or update the session for both login types
    const sessionId = uuidv4();
    if (!user.sessions) user.sessions = [];
    user.sessions.push(sessionId);
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username, sessionId }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const allUsers = await User.find({ username: { $ne: username } });
    res.status(200).json({ message: 'Logged in', user, users: allUsers });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ✅ Logout route
router.get('/logout', async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    res.clearCookie(COOKIE_NAME);
    return res.json({ message: 'Already logged out' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user && decoded.sessionId) {
      user.sessions = user.sessions.filter(s => s !== decoded.sessionId);
      await user.save();
    }
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    res.clearCookie(COOKIE_NAME);
    res.json({ message: 'Logged out' });
  }
});

// ✅ Auth check on reload
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    if (!currentUser.sessions.includes(decoded.sessionId)) {
      res.clearCookie(COOKIE_NAME);
      return res.status(401).json({ error: 'Session expired or invalidated' });
    }

    const allUsers = await User.find({ username: { $ne: currentUser.username } });

    const usersWithUnseen = await Promise.all(
      allUsers.map(async (user) => {
        const unseenCount = await Message.countDocuments({
          sender: user.username,
          receiver: currentUser.username,
          status: { $ne: 'read' },
        });

        return {
          ...user.toObject(),
          hasUnseen: unseenCount > 0,
        };
      })
    );

    res.json({ user: currentUser, users: usersWithUnseen });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ✅ Get all users route
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().sort({ updatedAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
