const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    loanName: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    remainingAmount: {
        type: Number,
        required: true
    },
    interestRate: {
        type: Number,
        required: true
    },
    monthlyEMI: {
        type: Number,
        required: true
    },
    tenure: {
        type: Number, // in months
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Loan', LoanSchema);
