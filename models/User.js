// --- models/User.js ---
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: { 
    type: String,
    required: false, // ✅ Allows users without a password to be stored (e.g., Google logins)
  },
  photoURL: String,
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  sessions: [
    {
      type: String,
    },
  ],
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);


// // --- models/User.js ---
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   photoURL: String,
//   joinedAt: {
//     type: Date,
//     default: Date.now,
//   },
//   // Add an array to store unique session IDs for each login instance
//   sessions: [
//     {
//       type: String,
//     },
//   ],
// }, {
//   timestamps: true, // This is good for tracking updates
// });

// module.exports = mongoose.model('User', userSchema);
