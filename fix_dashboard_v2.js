const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/SIDHARTH/OneDrive/Desktop/Fintrack/dashboard.html';
let content = fs.readFileSync(filePath, 'utf8');

// Regex to find the UI cards update block
const targetRegex = /\/\/ Update UI Cards[\s\S]*?const cards = document\.querySelectorAll\('\.card \.text-2xl\.font-bold'\);[\s\S]*?if \(cards\.length >= 4\) \{[\s\S]*?cards\[1\]\.innerText = `₹\${baseMonthlyIncome\.toLocaleString\('en-IN', \{ minimumFractionDigits: 2 \}\)\}`;[\s\S]*?\}/;

const replacement = `// Update UI Cards
                const cards = document.querySelectorAll('.card .text-2xl.font-bold');
                if (cards.length >= 4) {
                    cards[0].innerText = \`₹\${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\`;
                    
                    // Specific handling for Monthly Income to preserve the span for editing
                    const incomeSpan = document.getElementById('display-monthly-income');
                    if (incomeSpan) {
                        incomeSpan.innerText = baseMonthlyIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                    } else {
                        cards[1].innerHTML = \`₹<span id="display-monthly-income">\${baseMonthlyIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>\`;
                    }
                    
                    cards[2].innerText = \`₹\${monthlyExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\`;
                    cards[3].innerText = \`₹\${monthlySavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\`;
                }`;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Successfully updated dashboard.html using regex');
} else {
    console.error('Target regex not found in dashboard.html');
}
