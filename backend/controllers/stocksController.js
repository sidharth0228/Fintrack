const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const MutualFund = require('../models/MutualFund');
const Property = require('../models/Property');
const { getAngelOneHoldings } = require('../utils/angelOne');
const { generateAIReport } = require('../utils/aiReport');

exports.syncPortfolio = async (req, res) => {
    try {
        const { apiKey } = req.body || {};
        const holdingsData = await getAngelOneHoldings(apiKey);
        let portfolio = await Portfolio.findOne({ userId: req.user.id });
        if (portfolio) {
            portfolio.stocks = holdingsData;
            portfolio.lastSynced = new Date();
        } else {
            portfolio = new Portfolio({
                userId: req.user.id,
                stocks: holdingsData,
                lastSynced: new Date()
            });
        }
        await portfolio.save();
        res.json({ message: 'Portfolio synced successfully', portfolio });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPortfolio = async (req, res) => {
    try {
        const synced = await Portfolio.findOne({ userId: req.user.id });
        const manualStocks = await Stock.find({ userId: req.user.id });
        const mutualFunds = await MutualFund.find({ userId: req.user.id });
        const properties = await Property.find({ userId: req.user.id });

        res.json({
            syncedStocks: synced ? synced.stocks : [],
            manualStocks,
            mutualFunds,
            properties
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addManualStock = async (req, res) => {
    try {
        const { name, symbol, invested, currentValue, quantity, sector } = req.body;
        const newStock = new Stock({
            userId: req.user.id,
            name,
            symbol: symbol || name,
            purchasePrice: invested,
            currentPrice: currentValue,
            quantity: quantity || 1,
            sector: sector || 'Other'
        });
        await newStock.save();
        res.status(201).json(newStock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addMutualFund = async (req, res) => {
    try {
        const { name, invested, currentValue, type } = req.body;
        const newFund = new MutualFund({
            userId: req.user.id,
            name,
            investedAmount: invested,
            currentValue,
            type: type || 'Equity'
        });
        await newFund.save();
        res.status(201).json(newFund);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addProperty = async (req, res) => {
    try {
        const { name, invested, currentValue, type, location } = req.body;
        const newProperty = new Property({
            userId: req.user.id,
            name,
            purchasePrice: invested,
            estimatedValue: currentValue,
            propertyType: type || 'Residential',
            location: location || ''
        });
        await newProperty.save();
        res.status(201).json(newProperty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAIReport = async (req, res) => {
    try {
        const synced = await Portfolio.findOne({ userId: req.user.id });
        const manualStocks = await Stock.find({ userId: req.user.id });
        const mutualFunds = await MutualFund.find({ userId: req.user.id });
        const properties = await Property.find({ userId: req.user.id });

        const allHoldings = {
            syncedStocks: synced ? synced.stocks : [],
            manualStocks: manualStocks.map(s => ({ tradingsymbol: s.name, quantity: s.quantity, averageprice: s.purchasePrice, ltp: s.currentPrice })),
            mutualFunds,
            properties
        };
        
        const report = await generateAIReport(allHoldings);
        res.json({ report });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
