// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config(); 

// Connect to database
connectDB(); 

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' })); // Increased limit for potential face encoding payload
app.use(cors());

// Basic Test Route
app.get('/', (req, res) => res.send('API is running...'));

// Route imports will go here later
// app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));