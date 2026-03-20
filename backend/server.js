const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/income', require('./routes/income'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/user', require('./routes/user'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/health-score', require('./routes/healthScore'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully to:', process.env.MONGO_URI))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('TIP: Make sure MongoDB service is running (mongod) and the MONGO_URI in .env is correct.');
    });

// Initialize Cron Jobs for Email Notifications and EMI Automation
const { startMonitorSpendingCron, startMonthlySummaryCron, startLoanEMICron, startCreditCardPaymentCron } = require('./utils/cronJobs');
startMonitorSpendingCron();
startMonthlySummaryCron();
startLoanEMICron();
startCreditCardPaymentCron();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
