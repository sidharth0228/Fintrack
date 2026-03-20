const express = require('express');
const router = express.Router();
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Loan = require('../models/Loan');
const CreditCard = require('../models/CreditCard');
const Stock = require('../models/Stock');
const User = require('../models/User'); // Import User for base income fallback
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/health-score
// @desc    Calculate and return the user's Financial Health Score using backend data and provided local expenses
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const localExpenses = req.body.localExpenses || [];

        // Fetch all data in parallel
        const [userDoc, incomes, backendExpenses, loans, cards, stocks] = await Promise.all([
            User.findById(userId),
            Income.find({ userId }),
            Expense.find({ userId }),
            Loan.find({ userId }),
            CreditCard.find({ userId }),
            Stock.find({ userId })
        ]);

        let incomeTotal = incomes.reduce((acc, curr) => acc + curr.amount, 0);
        // Fallback to User's base expected income if no specific income records exist
        if (incomeTotal === 0 && userDoc) {
            incomeTotal = userDoc.baseExpectedIncome;
        }
        if (incomeTotal === 0) incomeTotal = 1; // Prevent division by zero

        // Merge backend expenses with frontend localExpenses
        const allExpenses = [...backendExpenses, ...localExpenses];

        // Pillar 1: Expenditure & Discretionary
        const needsCategories = ['Housing', 'Utilities', 'Groceries', 'Fixed Expenses', 'Food', 'Rent'];
        let needsTotal = 0;
        let discretionaryTotal = 0;
        allExpenses.forEach(exp => {
            if (needsCategories.includes(exp.category) || (exp.title && exp.title.toLowerCase().includes('emi'))) {
                needsTotal += exp.amount;
            } else {
                discretionaryTotal += exp.amount;
            }
        });
        const expensesTotal = needsTotal + discretionaryTotal;

        // Pillar 2: Loans & Debt
        // Filter active loans only
        const now = new Date();
        const activeLoans = loans.filter(loan => {
            const startDate = new Date(loan.startDate);
            const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
            return monthsDiff < loan.tenure;
        });

        let monthlyDebtObligations = activeLoans.reduce((sum, l) => sum + l.monthlyEMI, 0);
        let highInterestDebt = 0;
        
        cards.forEach(c => {
            monthlyDebtObligations += c.minimumPayment;
            if (c.totalDue > 0) highInterestDebt += c.totalDue;
        });
        
        activeLoans.forEach(l => {
            if (l.interestRate >= 12 && (l.monthlyEMI * l.tenure - l.remainingAmount) < (l.monthlyEMI * l.tenure)) {
                highInterestDebt += l.remainingAmount;
            }
        });

        // Pillar 3: Savings
        const netBalance = incomeTotal - expensesTotal;
        const savingsRatio = Math.max(0, (netBalance / incomeTotal) * 100);
        
        // Pillar 4: Debt-to-Income
        const dtiRatio = (monthlyDebtObligations / incomeTotal) * 100;

        // Pillar 5: Investments
        // Calculate total value of stocks: quantity * currentPrice or totalValue if schema defines it differently.
        // Based on Stock schema: quantity * currentPrice
        const totalInvestments = stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
        const uniqueSectors = new Set(stocks.map(s => s.sector || s.symbol)).size;
        const diversificationRating = Math.min(10, uniqueSectors * 2);

        // --- Calculate 0-100 Score ---
        let score = 0;
        score += Math.min(20, (savingsRatio / 20) * 20); // target > 20%
        
        let dtiPoints = dtiRatio <= 30 ? 20 : Math.max(0, 20 - ((dtiRatio - 30) / 2));
        score += dtiPoints; // target < 30%
        
        const discRatio = (discretionaryTotal / incomeTotal) * 100;
        score += discRatio <= 30 ? 20 : Math.max(0, 20 - ((discRatio - 30) / 2)); // target < 30%
        
        let debtPoints = 20 - Math.min(20, (highInterestDebt / (incomeTotal * 2)) * 20);
        score += Math.max(0, debtPoints);
        
        let invPoints = Math.min(10, (totalInvestments / incomeTotal) * 10) + Math.min(10, diversificationRating);
        score += invPoints;

        score = Math.round(Math.max(0, Math.min(100, score)));

        res.json({
            score,
            incomeTotal,
            expensesTotal,
            needsTotal,
            discretionaryTotal,
            netBalance,
            savingsRatio,
            dtiRatio,
            highInterestDebt,
            totalInvestments,
            diversificationRating,
            uniqueSectors,
            monthlyDebtObligations
        });
    } catch (err) {
        console.error('Health Score Aggregation Error:', err);
        res.status(500).json({ error: 'Server Error during Health Score calculation' });
    }
});

module.exports = router;
