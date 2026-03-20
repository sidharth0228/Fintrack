const mongoose = require('mongoose');

const mutualFundSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    investedAmount: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    type: { type: String, default: 'Equity' }, // Equity, Debt, Hybrid
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MutualFund', mutualFundSchema);
