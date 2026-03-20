const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/budget
// @desc    Get user's budgets
router.get('/', authMiddleware, async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.user.id });
        res.json(budgets);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/budget
// @desc    Create or update a budget limit for a category
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { category, monthlyLimit, type } = req.body;

        // Find if budget for this category exists
        let budget = await Budget.findOne({ userId: req.user.id, category });

        if (budget) {
            budget.monthlyLimit = monthlyLimit;
            if (type) budget.type = type;
            await budget.save();
        } else {
            budget = new Budget({
                userId: req.user.id,
                category,
                monthlyLimit,
                type: type || 'Variable'
            });
            await budget.save();
        }

        res.json(budget);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/budget/category/:category
// @desc    Delete a budget limit for a category
router.delete('/category/:category', authMiddleware, async (req, res) => {
    try {
        await Budget.findOneAndDelete({ userId: req.user.id, category: req.params.category });
        res.json({ message: 'Budget deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
