

// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const Message = require('../models/message'); // ✅ REQUIRED for unseen logic

// const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';
// const COOKIE_NAME = 'token';

// // ✅ Get all users (optional endpoint)
// router.get('/users', async (req, res) => {
//   try {
//     const users = await User.find().sort({ updatedAt: -1 });
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // ✅ Login or register user
// router.post('/login', async (req, res) => {
//   const { username, photoURL } = req.body;

//   if (!username) return res.status(400).json({ error: 'Username is required' });

//   try {
//     let user = await User.findOne({ username });

//     if (!user) {
//       user = await User.create({ username, photoURL });
//     } else if (photoURL && user.photoURL !== photoURL) {
//       user.photoURL = photoURL;
//       await user.save();
//     }

//     const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

//     res.cookie(COOKIE_NAME, token, {
//       httpOnly: true,
//       secure: false, // ✅ Only true in production
//       sameSite: 'Lax',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     const users = await User.find({ username: { $ne: username } });
//     res.status(200).json({ message: 'Logged in', user, users });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // ✅ Logout
// router.get('/logout', (req, res) => {
//   res.clearCookie(COOKIE_NAME);
//   res.json({ message: 'Logged out' });
// });

// // ✅ Auth check on reload
// router.get('/me', async (req, res) => {
//   try {
//     const token = req.cookies[COOKIE_NAME];
//     if (!token) return res.status(401).json({ error: 'Unauthorized' });

//     const decoded = jwt.verify(token, JWT_SECRET);
//     const currentUser = await User.findById(decoded.id);
//     if (!currentUser) return res.status(404).json({ error: 'User not found' });

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

// module.exports = router;
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/message'); // ✅ REQUIRED for unseen logic

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';
const COOKIE_NAME = 'token';

// ✅ Get all users (optional endpoint)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ updatedAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Login or register user
router.post('/login', async (req, res) => {
  const { username, photoURL } = req.body;

  if (!username) return res.status(400).json({ error: 'Username is required' });

  try {
    let user = await User.findOne({ username });

    if (!user) {
      user = await User.create({ username, photoURL });
    } else if (photoURL && user.photoURL !== photoURL) {
      user.photoURL = photoURL;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: false, // ✅ Only true in production
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const users = await User.find({ username: { $ne: username } });
    res.status(200).json({ message: 'Logged in', user, users });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Logout
router.get('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ message: 'Logged out' });
});

// ✅ Auth check on reload
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

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

module.exports = router;
