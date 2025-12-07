// Dashboard JavaScript

// Check if user is logged in
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
if (!loggedInUser) {
    window.location.href = 'index.html';
}

// Initialize
let transactions = JSON.parse(localStorage.getItem(`transactions_${loggedInUser.email}`)) || [];
let editingId = null;

// Categories
const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
const expenseCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

// DOM Elements
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const transactionForm = document.getElementById('transactionForm');
const transactionList = document.getElementById('transactionList');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const categorySelect = document.getElementById('transactionCategory');
const transactionTypeSelect = document.getElementById('transactionType');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const transactionModal = document.getElementById('transactionModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');

// Summary elements
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');

// Charts
let balanceTrendChart = null;

// Get current month transactions
function getCurrentMonthTransactions() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    userNameEl.textContent = loggedInUser.username || 'User';
    userEmailEl.textContent = loggedInUser.email;
    updateCategories();
    setDefaultDate();
    loadTransactions();
    updateSummary();
    initializeCharts();
    
    // Type toggle buttons
    const expenseBtn = document.getElementById('expenseBtn');
    const incomeBtn = document.getElementById('incomeBtn');
    
    expenseBtn.addEventListener('click', () => {
        expenseBtn.classList.add('active');
        incomeBtn.classList.remove('active');
        transactionTypeSelect.value = 'expense';
        updateCategories();
    });
    
    incomeBtn.addEventListener('click', () => {
        incomeBtn.classList.add('active');
        expenseBtn.classList.remove('active');
        transactionTypeSelect.value = 'income';
        updateCategories();
    });
    
    // Modal handlers
    addTransactionBtn.addEventListener('click', () => {
        editingId = null;
        modalTitle.textContent = 'Add Transaction';
        transactionForm.reset();
        setDefaultDate();
        updateCategories();
        cancelEditBtn.style.display = 'none';
        // Reset type toggle to income
        incomeBtn.classList.add('active');
        expenseBtn.classList.remove('active');
        transactionTypeSelect.value = 'income';
        transactionModal.classList.add('active');
    });
    
    closeModal.addEventListener('click', () => {
        transactionModal.classList.remove('active');
    });
    
    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) {
            transactionModal.classList.remove('active');
        }
    });
});

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
}

// Update categories based on transaction type
transactionTypeSelect.addEventListener('change', function() {
    updateCategories();
});

function updateCategories() {
    const type = transactionTypeSelect.value;
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// Transaction Form Submit
transactionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = transactionTypeSelect.value;
    const name = document.getElementById('transactionName').value.trim();
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const date = document.getElementById('transactionDate').value;
    
    if (!name || !amount || !category || !date) {
        alert('Please fill in all fields');
        return;
    }
    
    if (editingId !== null) {
        // Update existing transaction
        const index = transactions.findIndex(t => t.id === editingId);
        if (index !== -1) {
            transactions[index] = {
                id: editingId,
                type,
                name,
                amount,
                category,
                date
            };
        }
        editingId = null;
    } else {
        // Add new transaction
        const transaction = {
            id: Date.now().toString(),
            type,
            name,
            amount,
            category,
            date
        };
        transactions.push(transaction);
    }
    
    saveTransactions();
    loadTransactions();
    updateSummary();
    updateCharts();
    transactionModal.classList.remove('active');
    transactionForm.reset();
    setDefaultDate();
    updateCategories();
    
    // Reset type toggle
    const expenseBtn = document.getElementById('expenseBtn');
    const incomeBtn = document.getElementById('incomeBtn');
    incomeBtn.classList.add('active');
    expenseBtn.classList.remove('active');
    transactionTypeSelect.value = 'income';
});

// Cancel Edit
cancelEditBtn.addEventListener('click', function() {
    editingId = null;
    this.style.display = 'none';
    transactionForm.reset();
    setDefaultDate();
    updateCategories();
    modalTitle.textContent = 'Add Transaction';
    transactionForm.querySelector('.btn-submit').textContent = 'Add Transaction';
    
    // Reset type toggle
    const expenseBtn = document.getElementById('expenseBtn');
    const incomeBtn = document.getElementById('incomeBtn');
    incomeBtn.classList.add('active');
    expenseBtn.classList.remove('active');
    transactionTypeSelect.value = 'income';
});

// Load and display transactions
function loadTransactions() {
    // Sort by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Show only recent 10 transactions
    const recentTransactions = sortedTransactions.slice(0, 10);
    
    if (recentTransactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">receipt_long</span>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }
    
    // Category icons mapping
    const categoryIcons = {
        'Salary': 'work',
        'Freelance': 'code',
        'Investment': 'trending_up',
        'Gift': 'card_giftcard',
        'Food': 'restaurant',
        'Transport': 'directions_car',
        'Shopping': 'shopping_bag',
        'Bills': 'receipt',
        'Entertainment': 'movie',
        'Health': 'local_hospital',
        'Education': 'school',
        'Other': 'category'
    };
    
    transactionList.innerHTML = recentTransactions.map(transaction => {
        const icon = categoryIcons[transaction.category] || (transaction.type === 'income' ? 'trending_up' : 'shopping_bag');
        return `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <span class="material-icons">${icon}</span>
                </div>
                <div class="transaction-details">
                    <div class="transaction-name">${transaction.name}</div>
                    <div class="transaction-meta">
                        <span>${transaction.category}</span>
                        <span>•</span>
                        <span>${formatDate(transaction.date)}</span>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
}

// Edit Transaction (double click to edit)
transactionList.addEventListener('dblclick', function(e) {
    const transactionItem = e.target.closest('.transaction-item');
    if (!transactionItem) return;
    
    const transactionName = transactionItem.querySelector('.transaction-name').textContent;
    const transaction = transactions.find(t => t.name === transactionName);
    if (!transaction) return;
    
    editTransaction(transaction.id);
});

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    const expenseBtn = document.getElementById('expenseBtn');
    const incomeBtn = document.getElementById('incomeBtn');
    
    editingId = id;
    modalTitle.textContent = 'Edit Transaction';
    transactionTypeSelect.value = transaction.type;
    updateCategories();
    
    // Update type toggle buttons
    if (transaction.type === 'expense') {
        expenseBtn.classList.add('active');
        incomeBtn.classList.remove('active');
    } else {
        incomeBtn.classList.add('active');
        expenseBtn.classList.remove('active');
    }
    
    document.getElementById('transactionName').value = transaction.name;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionDate').value = transaction.date;
    cancelEditBtn.style.display = 'block';
    transactionForm.querySelector('.btn-submit').textContent = 'Update Transaction';
    transactionModal.classList.add('active');
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem(`transactions_${loggedInUser.email}`, JSON.stringify(transactions));
}

// Update Summary Cards
function updateSummary() {
    const currentMonthTransactions = getCurrentMonthTransactions();
    
    const income = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Total balance is all transactions
    const allIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const allExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = allIncome - allExpense;
    
    totalIncomeEl.textContent = `$${income.toFixed(2)}`;
    totalExpenseEl.textContent = `$${expense.toFixed(2)}`;
    totalBalanceEl.textContent = `$${balance.toFixed(2)}`;
    
    // Update balance color
    if (balance < 0) {
        totalBalanceEl.style.color = '#ef4444';
    } else {
        totalBalanceEl.style.color = '#1f2937';
    }
}

// Initialize Balance Trend Chart
function initializeCharts() {
    const ctx = document.getElementById('balanceTrendChart').getContext('2d');
    
    balanceTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Balance',
                data: [],
                borderColor: '#0fb16e',
                backgroundColor: 'rgba(15, 184, 110, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#0fb16e',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
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
    
    updateCharts();
}

// Update Charts
function updateCharts() {
    if (!balanceTrendChart) return;
    
    // Get last 30 days of balance data
    const days = 30;
    const labels = [];
    const balanceData = [];
    const today = new Date();
    
    // Calculate running balance for each day
    let runningBalance = 0;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Format label
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        const label = i === 0 ? 'Today' : `${month} ${day}`;
        labels.push(label);
        
        // Calculate balance up to this date
        const transactionsUpToDate = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate <= date;
        });
        
        const income = transactionsUpToDate
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = transactionsUpToDate
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        runningBalance = income - expense;
        balanceData.push(runningBalance);
    }
    
    balanceTrendChart.data.labels = labels;
    balanceTrendChart.data.datasets[0].data = balanceData;
    balanceTrendChart.update();
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

// Logout
logoutBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    }
});

// Sidebar Navigation - links are handled by HTML href attributes
// No need for JavaScript navigation handlers since all pages are implemented
