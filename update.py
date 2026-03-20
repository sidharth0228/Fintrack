import re

def update_dashboard():
    with open(r'e:\\Fintrack\\dashboard.html', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Inject the initialization script at the end of body
    script_injection = """
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize Income vs Expenses Trendline Chart
            const ctx = document.getElementById('incomeExpenseChart');
            if (ctx) {
                const style = getComputedStyle(document.body);
                const accentColor = style.getPropertyValue('--accent-color').trim() || '#10B981';
                const infoColor = style.getPropertyValue('--info').trim() || '#3B82F6';
                const textColor = style.getPropertyValue('--text-secondary').trim() || '#64748B';
                const gridColor = style.getPropertyValue('--border-color').trim() || '#E2E8F0';

                const ctx2d = ctx.getContext('2d');
                
                const gradientIncome = ctx2d.createLinearGradient(0, 0, 0, 300);
                gradientIncome.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
                gradientIncome.addColorStop(1, 'rgba(16, 185, 129, 0)');

                const gradientExpense = ctx2d.createLinearGradient(0, 0, 0, 300);
                gradientExpense.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
                gradientExpense.addColorStop(1, 'rgba(59, 130, 246, 0)');

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [
                            {
                                label: 'Income',
                                data: [8500, 9200, 8800, 10500, 11200, 12450],
                                borderColor: accentColor,
                                backgroundColor: gradientIncome,
                                borderWidth: 3,
                                pointBackgroundColor: accentColor,
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2,
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                fill: true,
                                tension: 0.4
                            },
                            {
                                label: 'Expenses',
                                data: [4100, 3800, 4200, 4800, 4000, 4230],
                                borderColor: infoColor,
                                backgroundColor: gradientExpense,
                                borderWidth: 3,
                                pointBackgroundColor: infoColor,
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2,
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                fill: true,
                                tension: 0.4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    usePointStyle: true,
                                    padding: 20,
                                    color: textColor,
                                    font: { family: "'Inter', sans-serif", size: 13 }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                titleFont: { family: "'Inter', sans-serif", size: 13 },
                                bodyFont: { family: "'Inter', sans-serif", size: 13 },
                                padding: 10,
                                cornerRadius: 8,
                                displayColors: true,
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) { label += ': '; }
                                        if (context.parsed.y !== null) {
                                            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false, drawBorder: false },
                                ticks: { color: textColor, font: { family: "'Inter', sans-serif" } }
                            },
                            y: {
                                grid: { color: gridColor, drawBorder: false, borderDash: [5, 5] },
                                ticks: {
                                    color: textColor,
                                    font: { family: "'Inter', sans-serif" },
                                    callback: function(value) { return '$' + value / 1000 + 'k'; }
                                },
                                min: 0
                            }
                        }
                    }
                });
            }
        });
    </script>
</body>"""
    if 'new Chart(ctx,' not in content:
        content = content.replace('</body>', script_injection)
        
    with open(r'e:\\Fintrack\\dashboard.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Done")

if __name__ == '__main__':
    update_dashboard()
