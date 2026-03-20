const cron = require('node-cron');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Income = require('../models/Income');
const Loan = require('../models/Loan');
const { sendEmail, getBudgetAlertTemplate, getMonthlySummaryTemplate } = require('../utils/emailService');

// Helper to get current month period
const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
};

// Helper to check if a loan is active
const isLoanActive = (loan) => {
    const now = new Date();
    const startDate = new Date(loan.startDate);
    const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    return monthsDiff < loan.tenure && loan.remainingAmount > 0;
};

// 1. Daily Job: Monitor Spending Thresholds
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

// 3. Automated EMI Deduction Job
// Runs on the first day of every month at 01:00 AM ('0 1 1 * *')
const startLoanEMICron = () => {
    cron.schedule('0 1 1 * *', async () => {
        console.log('--- Running Automated EMI Deduction Cron ---');
        try {
            // Find all active loans
            const allLoans = await Loan.find();
            const activeLoans = allLoans.filter(isLoanActive);

            for (const loan of activeLoans) {
                // Deduct EMI from remaining amount
                loan.remainingAmount = Math.max(0, loan.remainingAmount - loan.monthlyEMI);
                await loan.save();

                // Create a Fixed Expense transaction
                const emiExpense = new Expense({
                    userId: loan.userId,
                    title: `EMI Payment - ${loan.loanName}`,
                    amount: loan.monthlyEMI,
                    category: 'Fixed Expenses',
                    date: new Date()
                });
                await emiExpense.save();
                console.log(`Successfully processed EMI for ${loan.loanName}`);
            }
        } catch (error) {
            console.error('Error processing automated EMI deductions:', error);
        }
    });
};

// 4. Automated Credit Card Payment Job
// Runs daily at 02:00 AM to check for due dates
const CreditCard = require('../models/CreditCard');

const startCreditCardPaymentCron = () => {
    cron.schedule('0 2 * * *', async () => {
                console.log('--- Running Automated Credit Card Payment Cron ---');
                try {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const allCards = await CreditCard.find();

                    for (const card of allCards) {
                        const dueDate = new Date(card.dueDate);
                        dueDate.setHours(0, 0, 0, 0);

                        // If today is the due date and there is a balance
                        if (dueDate.getTime() === today.getTime() && card.totalDue > 0) {
                            const paymentAmount = card.minimumPayment > 0 ? card.minimumPayment : card.totalDue;

                            // Update card balances
                            card.totalDue = Math.max(0, card.totalDue - paymentAmount);
                            card.amountPaid = (card.amountPaid || 0) + paymentAmount;

                            // Increment due date by 1 month for next cycle calculation
                            dueDate.setMonth(dueDate.getMonth() + 1);
                            card.dueDate = dueDate;

                            await card.save();

                            // Create a Fixed Expense transaction
                            const cardExpense = new Expense({
                                userId: card.userId,
                                title: `Credit Card Payment - ${card.cardName}`,
                                amount: paymentAmount,
                                category: 'Fixed Expenses',
                                date: new Date()
                            });
                            await cardExpense.save();
                            console.log(`Successfully processed payment for Credit Card ${card.cardName}`);
                        }
                    }
                } catch (error) {
                    console.error('Error processing automated Credit Card payments:', error);
                }
            });
        };

        module.exports = {
            startMonitorSpendingCron,
            startMonthlySummaryCron,
            startLoanEMICron,
            startCreditCardPaymentCron
        }