const mongoose = require('mongoose');

const goldSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, default: 'Physical Gold' }, // e.g. Physical, SGB, Digital
    quantityGrams: { type: Number, required: true },
    purchasePricePerGram: { type: Number, required: true },
    totalInvested: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gold', goldSchema);
