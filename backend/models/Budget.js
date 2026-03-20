const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    monthlyLimit: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['Fixed', 'Variable'],
        default: 'Variable'
    },
    alertsTrack: {
        type: [String],
        default: [] // e.g., ["80-2026-03", "100-2026-03"]
    }
});

module.exports = mongoose.model('Budget', budgetSchema);
