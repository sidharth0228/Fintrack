const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const CreditCard = require('../models/CreditCard');
const Budget = require('../models/Budget');
const authMiddleware = require('../middleware/authMiddleware');

// Helper to check if a loan is active
const isLoanActive = (loan) => {
    const now = new Date();
    const startDate = new Date(loan.startDate);
    const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    return monthsDiff < loan.tenure;
};

// @route   GET /api/loans
// @desc    Get active loans and credit cards for a user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const allLoans = await Loan.find({ userId: req.user.id });
        const activeLoans = allLoans.filter(isLoanActive);
        const cards = await CreditCard.find({ userId: req.user.id });
        res.json({ loans: activeLoans, cards });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/loans/add
// @desc    Add a new loan and update Fixed Expenses budget
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { loanName, totalAmount, interestRate, monthlyEMI, tenure } = req.body;
        const totalContractualValue = monthlyEMI * tenure;
        const newLoan = new Loan({
            userId: req.user.id,
            loanName,
            totalAmount,
            remainingAmount: totalContractualValue,
            interestRate,
            monthlyEMI,
            tenure
        });
        const loan = await newLoan.save();

        // Automatically update "Fixed Expenses" budget
        let fixedBudget = await Budget.findOne({ userId: req.user.id, category: 'Fixed Expenses' });
        if (fixedBudget) {
            fixedBudget.monthlyLimit += monthlyEMI;
            await fixedBudget.save();
        } else {
            await new Budget({
                userId: req.user.id,
                category: 'Fixed Expenses',
                monthlyLimit: monthlyEMI,
                type: 'Fixed'
            }).save();
        }

        res.json(loan);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/cards/add
router.post('/cards/add', authMiddleware, async (req, res) => {
    try {
        const { cardName, totalDue, minimumPayment, dueDate } = req.body;
        const newCard = new CreditCard({
            userId: req.user.id,
            cardName,
            totalDue,
            minimumPayment,
            dueDate
        });
        const card = await newCard.save();
        res.json(card);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/loans/:id/pay
// @desc    Manually record an extra principal payment
router.post('/:id/pay', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid payment amount is required' });
        }

        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        loan.remainingAmount = Math.max(0, loan.remainingAmount - amount);
        await loan.save();

        res.json({ message: 'Payment recorded successfully', loan });
    } catch (err) {
        console.error('Manual payment error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/loans/:id/edit
// @desc    Edit loan with Total Amount Paid and recalculate amortization
router.put('/:id/edit', authMiddleware, async (req, res) => {
    try {
        const { totalPaid } = req.body;
        if (totalPaid === undefined || totalPaid < 0) {
            return res.status(400).json({ message: 'Valid total amount paid is required' });
        }

        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        const totalContractualValue = loan.monthlyEMI * loan.tenure;
        const validPaid = Math.min(totalPaid, totalContractualValue);

        // Standard Amortization
        // Amount Outstanding = Total Contractual Value - Total Amount Paid
        const amountOutstanding = totalContractualValue - validPaid;
        
        // Update the loan's recorded remaining amount to the exact outstanding debt
        loan.remainingAmount = amountOutstanding;
        await loan.save();

        res.json({ message: 'Loan edited successfully', loan });
    } catch (err) {
        console.error('Edit loan error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/loans/cards/:id/edit
// @desc    Edit credit card with current due and amount paid
router.put('/cards/:id/edit', authMiddleware, async (req, res) => {
    try {
        const { currentDue, amountPaid } = req.body;
        
        if (currentDue === undefined || amountPaid === undefined || currentDue < 0 || amountPaid < 0) {
            return res.status(400).json({ message: 'Valid negative/positive numbers are required' });
        }

        const card = await CreditCard.findOne({ _id: req.params.id, userId: req.user.id });
        if (!card) return res.status(404).json({ message: 'Credit card not found' });

        // Update card details
        card.totalDue = currentDue;
        card.amountPaid = amountPaid;
        await card.save();

        res.json({ message: 'Credit card edited successfully', card });
    } catch (err) {
        console.error('Edit card error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/loans/cards/:id/pay
// @desc    Pay specific amount towards credit card due
router.post('/cards/:id/pay', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid positive payment amount is required' });
        }

        const card = await CreditCard.findOne({ _id: req.params.id, userId: req.user.id });
        if (!card) return res.status(404).json({ message: 'Credit card not found' });

        if (amount > card.totalDue) {
            return res.status(400).json({ message: 'Payment amount cannot exceed total due' });
        }

        card.totalDue = card.totalDue - amount;
        card.amountPaid = (card.amountPaid || 0) + amount;
        await card.save();

        res.json({ message: 'Payment recorded successfully', card });
    } catch (err) {
        console.error('Pay card error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/loans/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
        if (loan) {
            // Subtract EMI from Fixed Expenses budget before deleting
            let fixedBudget = await Budget.findOne({ userId: req.user.id, category: 'Fixed Expenses' });
            if (fixedBudget) {
                fixedBudget.monthlyLimit = Math.max(0, fixedBudget.monthlyLimit - loan.monthlyEMI);
                await fixedBudget.save();
            }
            await Loan.findByIdAndDelete(req.params.id);
        }
        res.json({ message: 'Loan deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/loans/cards/:id
router.delete('/cards/:id', authMiddleware, async (req, res) => {
    try {
        await CreditCard.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Credit card deletion successful' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
