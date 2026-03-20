const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');

    // Safe replacements for currency
    // 1. $ followed by a number
    content = content.replace(/\$([0-9])/g, '₹$1');
    // 2. +$ and -$
    content = content.replace(/\+\$/g, '+₹');
    content = content.replace(/-\$/g, '-₹');
    // 3. 'USD' and 'en-US'
    content = content.replace(/USD \(\$\)/g, 'INR (₹)');
    content = content.replace(/USD/g, 'INR');
    content = content.replace(/en-US/g, 'en-IN');
    
    // Date formatting localization
    content = content.replace(/\.toLocaleDateString\(\)/g, ".toLocaleDateString('en-IN')");

    fs.writeFileSync(path.join(dir, file), content);
    console.log(`Updated ${file}`);
});
