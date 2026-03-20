const mongoose = require('mongoose');

const CreditCardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cardName: {
        type: String,
        required: true
    },
    totalDue: {
        type: Number,
        required: true
    },
    minimumPayment: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CreditCard', CreditCardSchema);
