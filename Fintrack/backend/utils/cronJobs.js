const cron = require('node-cron');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Income = require('../models/Income');
const { sendEmail, getBudgetAlertTemplate, getMonthlySummaryTemplate } = require('../utils/emailService');

// Helper to get current month period
const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
};

// 1. Daily Job: Monitor Spending Thresholds
// Runs every day at 08:00 AM ('0 8 * * *')
const startMonitorSpendingCron = () => {
    cron.schedule('0 8 * * *', async () => {
        console.log('--- Running Daily Spending Monitor Cron ---');
        try {
            const { start, end } = getCurrentMonthRange();
            const now = new Date();
            const currentMonthStr = `${now.getFullYear()}-${now.getMonth() + 1}`; // e.g. "2026-3"

            // Get all budgets with their populated Users
            const budgets = await Budget.find().populate('userId');

            for (const budget of budgets) {
                if (!budget.userId || !budget.userId.email) continue;
                
                // Aggregate total expenses for this user and category in the current month
                const expenses = await Expense.aggregate([
                    {
                        $match: {
                            userId: budget.userId._id,
                            category: budget.category,
                            date: { $gte: start, $lte: end }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$amount' }
                        }
                    }
                ]);

                const spent = expenses.length > 0 ? expenses[0].total : 0;
                const limit = budget.monthlyLimit;
                const ratio = spent / limit;

                let alertSent = false;

                // Check 100% threshold
                const exceedKey = `100-${currentMonthStr}`;
                if (ratio >= 1.0 && !budget.alertsTrack.includes(exceedKey)) {
                    const html = getBudgetAlertTemplate(budget.userId.name, budget.category, spent, limit, true);
                    const sent = await sendEmail(budget.userId.email, `Budget Exceeded Alert: ${budget.category}`, html);
                    if (sent) {
                        budget.alertsTrack.push(exceedKey);
                        alertSent = true;
                    }
                }

                // Check 80% threshold (only if 100% hasn't been sent/triggered just now)
                const warningKey = `80-${currentMonthStr}`;
                if (ratio >= 0.8 && ratio < 1.0 && !budget.alertsTrack.includes(warningKey)) {
                    const html = getBudgetAlertTemplate(budget.userId.name, budget.category, spent, limit, false);
                    const sent = await sendEmail(budget.userId.email, `Approaching Budget Limit: ${budget.category}`, html);
                    if (sent) {
                        budget.alertsTrack.push(warningKey);
                        alertSent = true;
                    }
                }

                // Save budget if tracking updated
                if (alertSent) {
                    await budget.save();
                }
            }
        } catch (error) {
            console.error('Error in Daily Spending Monitor:', error);
        }
    });
};

// 2. Monthly Job: Financial Summary Email
// Runs on the last day of the month at 18:00 (6:00 PM) ('0 18 28-31 * *')
// A slight trick is needed for accurate last-day-of-month cron, but we'll check inside the job.
const startMonthlySummaryCron = () => {
    cron.schedule('0 18 * * *', async () => {
        // Validate if today is actually the last day of the month
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDate() !== 1) {
            return; // Not the last day of the month, do nothing
        }

        console.log('--- Running Monthly Financial Summary Cron ---');
        try {
            const { start, end } = getCurrentMonthRange();
            const users = await User.find();

            for (const user of users) {
                // Get Total Income
                const incomes = await Income.aggregate([
                    { $match: { userId: user._id, date: { $gte: start, $lte: end } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]);
                const totalIncome = incomes.length > 0 ? incomes[0].total : 0;

                // Get Total Expenses
                const expenses = await Expense.aggregate([
                    { $match: { userId: user._id, date: { $gte: start, $lte: end } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]);
                const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;

                // Only send if there was some activity
                if (totalIncome > 0 || totalExpenses > 0) {
                    const html = getMonthlySummaryTemplate(user.name, totalIncome, totalExpenses);
                    await sendEmail(user.email, `Your Monthly Financial Summary - FinTrack`, html);
                }
            }
        } catch (error) {
            console.error('Error in Monthly Financial Summary Cron:', error);
        }
    });
};

module.exports = {
    startMonitorSpendingCron,
    startMonthlySummaryCron
};
