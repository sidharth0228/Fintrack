const nodemailer = require('nodemailer');

// Ensure environment variables are loaded
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // Standard service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const info = await transporter.sendMail({
            from: `"FinTrack Advisor" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
        });
        console.log(`Email sent successfully to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending email: ', error);
        return false;
    }
};

// --- Templates --- //

const getBudgetAlertTemplate = (userName, category, spent, limit, isExceeded = false) => {
    const remaining = limit - spent;
    const dateStr = new Date().toLocaleDateString('en-IN');
    const color = isExceeded ? '#EF4444' : '#F59E0B'; // Red for exceeded, Amber for approaching
    const title = isExceeded ? 'Budget Exceeded Alert' : 'Approaching Budget Limit';
    const message = isExceeded 
        ? `You have exceeded your monthly budget for <strong>${category}</strong>.`
        : `You are approaching your monthly budget limit for <strong>${category}</strong>.`;

    return `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 2rem; border-radius: 12px; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #4F46E5; color: white; font-weight: bold; border-radius: 12px; font-size: 24px;">F</div>
            <h2 style="margin: 10px 0 0 0; color: #111827;">FinTrack</h2>
        </div>
        
        <h3 style="color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 0.5rem;">${title}</h3>
        <p style="color: #374151; line-height: 1.6;">Hello ${userName},</p>
        <p style="color: #374151; line-height: 1.6;">${message}</p>
        
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 0.5rem 0; color: #6b7280;">Category:</td>
                    <td style="padding: 0.5rem 0; font-weight: bold; text-align: right;">${category}</td>
                </tr>
                <tr>
                    <td style="padding: 0.5rem 0; color: #6b7280;">Monthly Limit:</td>
                    <td style="padding: 0.5rem 0; font-weight: bold; text-align: right;">₹${limit.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <td style="padding: 0.5rem 0; color: #6b7280;">Amount Spent:</td>
                    <td style="padding: 0.5rem 0; font-weight: bold; color: ${color}; text-align: right;">₹${spent.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="padding: 0.5rem 0; color: #6b7280; padding-top: 1rem;">Remaining Balance:</td>
                    <td style="padding: 0.5rem 0; font-weight: bold; text-align: right; padding-top: 1rem;">₹${remaining < 0 ? 0 : remaining.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
            </table>
        </div>
        
        <p style="color: #6b7280; font-size: 0.875rem; text-align: center; margin-top: 2rem;">Date generated: ${dateStr}</p>
        <div style="text-align: center; margin-top: 1rem;">
            <a href="http://localhost:5000/budget.html" style="background: #4F46E5; color: white; font-weight: 500; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; display: inline-block;">Review Budget</a>
        </div>
    </div>
    `;
};

const getMonthlySummaryTemplate = (userName, totalIncome, totalExpenses) => {
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0;
    const dateStr = new Date().toLocaleDateString('en-IN');
    
    return `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 2rem; border-radius: 12px; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #4F46E5; color: white; font-weight: bold; border-radius: 12px; font-size: 24px;">F</div>
            <h2 style="margin: 10px 0 0 0; color: #111827;">FinTrack Monthly Summary</h2>
        </div>
        
        <h3 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 0.5rem;">Your Financial Overview</h3>
        <p style="color: #374151; line-height: 1.6;">Hello ${userName},</p>
        <p style="color: #374151; line-height: 1.6;">Here is a quick snapshot of your finances for the past month.</p>
        
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 0.5rem 0; color: #6b7280;">Total Income:</td>
                    <td style="padding: 0.5rem 0; font-weight: bold; color: #10B981; text-align: right;">+₹${totalIncome.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <td style="padding: 0.5rem 0; color: #6b7280;">Total Spending:</td>
                    <td style="padding: 0.5rem 0; font-weight: bold; color: #EF4444; text-align: right;">-₹${totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="padding: 0.5rem 0; color: #6b7280; padding-top: 1rem;">Net Savings:</td>
                    <td style="padding: 0.5rem 0; font-weight: bold; color: ${savings >= 0 ? '#10B981' : '#EF4444'}; text-align: right; padding-top: 1rem;">₹${savings.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <td style="padding: 0.5rem 0; color: #6b7280;">Savings Rate:</td>
                    <td style="padding: 0.5rem 0; font-weight: bold; text-align: right;">${savingsRate}%</td>
                </tr>
            </table>
        </div>
        
        <p style="color: #6b7280; font-size: 0.875rem; text-align: center; margin-top: 2rem;">Date generated: ${dateStr}</p>
        <div style="text-align: center; margin-top: 1rem;">
            <a href="http://localhost:5000/dashboard.html" style="background: #4F46E5; color: white; font-weight: 500; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
        </div>
    </div>
    `;
};

module.exports = {
    sendEmail,
    getBudgetAlertTemplate,
    getMonthlySummaryTemplate
};
