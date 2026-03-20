const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    location: { type: String },
    purchasePrice: { type: Number, required: true },
    estimatedValue: { type: Number, required: true },
    propertyType: { type: String, default: 'Residential' }, // Residential, Commercial, Land, Plot
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', propertySchema);
