// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// require('dotenv').config();

// const messageRoutes = require('./routes/messages');
// const userRoutes = require('./routes/users');

// const app = express();

// app.use(cors({
//   origin: '[http://localhost:8080,https://preview--talk-thru.lovable.app/]',
//   credentials: true,
// }));
// app.use(express.json());
// app.use(cookieParser());

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => console.error('❌ MongoDB connection error:', err));

// app.use('/api', messageRoutes);
// app.use('/api', userRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

const app = express();

// ✅ Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:8080',
  'https://preview--talk-thru.lovable.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Routes
app.use('/api', messageRoutes);
app.use('/api', userRoutes);

// ✅ Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
