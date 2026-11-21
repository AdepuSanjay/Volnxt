const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/providers', require('./routes/providerRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/charging', require('./routes/chargingRoutes'));
// app.use('/api/payments', require('./routes/paymentRoutes'));
// app.use('/api/ratings', require('./routes/ratingRoutes'));
// app.use('/api/disputes', require('./routes/disputeRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => {
  res.send('VOLNXT API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
