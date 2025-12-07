// Analytics Page JavaScript

// Check if user is logged in
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
if (!loggedInUser) {
    window.location.href = 'index.html';
}

// Initialize
let transactions = JSON.parse(localStorage.getItem(`transactions_${loggedInUser.email}`)) || [];

// DOM Elements
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const topCategoryEl = document.getElementById('topCategory');
const totalIncomeYTDEl = document.getElementById('totalIncomeYTD');
const totalExpenseYTDEl = document.getElementById('totalExpenseYTD');

// Charts
let incomeExpenseBarChart = null;
let spendingCategoryChart = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    userNameEl.textContent = loggedInUser.username || 'User';
    userEmailEl.textContent = loggedInUser.email;
    
    updateSummary();
    initializeCharts();
});

// Get Year to Date transactions
function getYTDTransactions() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === currentYear;
    });
}

// Update Summary Cards
function updateSummary() {
    const ytdTransactions = getYTDTransactions();
    
    // Calculate YTD Income and Expense
    const ytdIncome = ytdTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const ytdExpense = ytdTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Find top spending category
    const expenseTransactions = ytdTransactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    
    expenseTransactions.forEach(t => {
        if (categoryTotals[t.category]) {
            categoryTotals[t.category] += t.amount;
        } else {
            categoryTotals[t.category] = t.amount;
        }
    });
    
    let topCategory = { name: 'N/A', amount: 0 };
    if (Object.keys(categoryTotals).length > 0) {
        const topCategoryName = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b
        );
        topCategory = {
            name: topCategoryName,
            amount: categoryTotals[topCategoryName]
        };
    }
    
    totalIncomeYTDEl.textContent = `$${ytdIncome.toFixed(2)}`;
    totalExpenseYTDEl.textContent = `$${ytdExpense.toFixed(2)}`;
    topCategoryEl.textContent = topCategory.amount > 0 ? `$${topCategory.amount.toFixed(2)}` : '$0.00';
}

// Initialize Charts
function initializeCharts() {
    // Income vs Expense Bar Chart
    const ctx1 = document.getElementById('incomeExpenseBarChart').getContext('2d');
    incomeExpenseBarChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Income',
                    data: [],
                    backgroundColor: '#0fb16e',
                    borderRadius: 8
                },
                {
                    label: 'Expense',
                    data: [],
                    backgroundColor: '#ef4444',
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        },
                        stepSize: 2500
                    },
                    grid: {
                        color: '#f3f4f6'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Spending by Category Pie Chart
    const ctx2 = document.getElementById('spendingCategoryChart').getContext('2d');
    spendingCategoryChart = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#0fb16e',
                    '#3b82f6',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6',
                    '#06b6d4',
                    '#ec4899',
                    '#14b8a6'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: $${value.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
    
    updateCharts();
}

// Update Charts
function updateCharts() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Get current year transactions
    const yearTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === currentYear;
    });
    
    // Prepare monthly data (Jan to Jun or current month)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = Math.min(now.getMonth(), 5); // Cap at June (index 5)
    const displayMonths = months.slice(0, currentMonth + 1);
    
    const monthlyIncome = [];
    const monthlyExpense = [];
    
    displayMonths.forEach((monthLabel, index) => {
        const monthTransactions = yearTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === index;
        });
        
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        monthlyIncome.push(income);
        monthlyExpense.push(expense);
    });
    
    // Update Income vs Expense Bar Chart
    incomeExpenseBarChart.data.labels = displayMonths;
    incomeExpenseBarChart.data.datasets[0].data = monthlyIncome;
    incomeExpenseBarChart.data.datasets[1].data = monthlyExpense;
    incomeExpenseBarChart.update();
    
    // Prepare category spending data
    const expenseTransactions = yearTransactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    
    expenseTransactions.forEach(t => {
        if (categoryTotals[t.category]) {
            categoryTotals[t.category] += t.amount;
        } else {
            categoryTotals[t.category] = t.amount;
        }
    });
    
    // Sort categories by amount (descending) and take top 5
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const categoryLabels = sortedCategories.map(([name]) => name);
    const categoryAmounts = sortedCategories.map(([, amount]) => amount);
    
    // Update Spending by Category Pie Chart
    spendingCategoryChart.data.labels = categoryLabels;
    spendingCategoryChart.data.datasets[0].data = categoryAmounts;
    spendingCategoryChart.update();
}

// Logout
logoutBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    }
});

