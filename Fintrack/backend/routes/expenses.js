const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/expenses
// @desc    Get user's expenses
router.get('/', authMiddleware, async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user.id });
        res.json(expenses);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/expenses
// @desc    Add a new expense
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, amount, category, date } = req.body;
        const newExpense = new Expense({
            userId: req.user.id,
            title,
            amount,
            category,
            date
        });
        const expense = await newExpense.save();
        res.json(expense);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, amount, category, date } = req.body;
        let expense = await Expense.findById(req.params.id);
        
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Check if user owns the expense
        if (expense.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        expense = await Expense.findByIdAndUpdate(
            req.params.id,
            { $set: { title, amount, category, date } },
            { new: true }
        );

        res.json(expense);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Check if user owns the expense
        if (expense.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/expenses/category/:category
// @desc    Delete all expenses for a category
router.delete('/category/:category', authMiddleware, async (req, res) => {
    try {
        await Expense.deleteMany({ userId: req.user.id, category: req.params.category });
        res.json({ message: 'Expenses deleted for category' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
