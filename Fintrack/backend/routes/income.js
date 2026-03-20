const express = require('express');
const router = express.Router();
const Income = require('../models/Income');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/income
// @desc    Get user's income
router.get('/', authMiddleware, async (req, res) => {
    try {
        const income = await Income.find({ userId: req.user.id });
        res.json(income);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/income
// @desc    Add a new income source
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, amount, category, date } = req.body;
        const newIncome = new Income({
            userId: req.user.id,
            title,
            amount,
            category,
            date
        });
        const income = await newIncome.save();
        res.json(income);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/income/:id
// @desc    Delete an income record
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const income = await Income.findById(req.params.id);
        if (!income) {
            return res.status(404).json({ message: 'Income not found' });
        }

        if (income.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await Income.findByIdAndDelete(req.params.id);
        res.json({ message: 'Income deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
