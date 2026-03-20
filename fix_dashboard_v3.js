const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/SIDHARTH/OneDrive/Desktop/Fintrack/dashboard.html';
let content = fs.readFileSync(filePath, 'utf8');

const updatedLogic = `        window.editMonthlyIncome = async function() {
            const displayEl = document.getElementById('display-monthly-income');
            if (!displayEl) return;
            
            const currentVal = localStorage.getItem('userMonthlyIncome') || 100000;
            const container = displayEl.parentElement;
            const originalHTML = container.innerHTML;
            
            container.innerHTML = \`
                <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                    <input type="number" id="income-input" class="form-control" value="\${currentVal}" style="width: 140px; font-size: 1.25rem; font-weight: bold; padding: 4px 8px;">
                    <button id="save-income" class="btn btn-primary" style="padding: 4px 12px;">Save</button>
                    <button id="cancel-income" class="btn btn-ghost" style="padding: 4px 8px;">✕</button>
                </div>
            \`;
            
            const input = document.getElementById('income-input');
            input.focus();
            input.select();
            
            const saveBtn = document.getElementById('save-income');
            saveBtn.onclick = async () => {
                const newValue = parseFloat(input.value);
                if (isNaN(newValue)) {
                    alert('Please enter a valid number');
                    return;
                }
                
                saveBtn.disabled = true;
                saveBtn.innerText = '...';
                
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('/api/user/income', {
                        method: 'PATCH',
                        headers: {
                            'Authorization': \`Bearer \${token}\`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ income: newValue })
                    });
                    
                    const data = await response.json();

                    if (response.ok) {
                        localStorage.setItem('userMonthlyIncome', newValue);
                        // Update local user object too
                        let user = JSON.parse(localStorage.getItem('user') || '{}');
                        user.baseExpectedIncome = newValue;
                        localStorage.setItem('user', JSON.stringify(user));
                        
                        await fetchDashboardData();
                    } else {
                        alert('Error from server: ' + data.message);
                        container.innerHTML = originalHTML;
                    }
                } catch (err) {
                    console.error('Save error:', err);
                    alert('Could not connect to server. Ensure backend is running.');
                    container.innerHTML = originalHTML;
                }
            };
            
            document.getElementById('cancel-income').onclick = () => {
                container.innerHTML = originalHTML;
            };
            
            input.onkeydown = (e) => {
                if (e.key === 'Enter') saveBtn.click();
                if (e.key === 'Escape') document.getElementById('cancel-income').click();
            };
        };`;

const logicRegex = /window\.editMonthlyIncome = async function\(\) \{[\s\S]*?\};/;
content = content.replace(logicRegex, updatedLogic);

fs.writeFileSync(filePath, content);
console.log('Improved dashboard.html save feedback');
