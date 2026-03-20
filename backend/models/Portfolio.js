const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stocks: [{
        tradingsymbol: String,
        exchange: String,
        symboltoken: String,
        isin: String,
        quantity: Number,
        realisedprofitloss: Number,
        unrealisedprofitloss: Number,
        averageprice: Number,
        ltp: Number,
        close: Number,
        pnlPercentage: Number
    }],
    lastSynced: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', PortfolioSchema);
