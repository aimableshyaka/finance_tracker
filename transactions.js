// Transactions Page JavaScript

// Wait for Firebase to initialize
let currentUser = null;
let transactions = [];
let editingId = null;
let filteredTransactions = [];

// Check Firebase auth state
function waitForFirebase(callback) {
    if (window.firebaseAuth && window.firebaseDb) {
        const { onAuthStateChanged } = window.firebaseAuthFunctions;
        onAuthStateChanged(window.firebaseAuth, (user) => {
            if (user) {
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    username: user.displayName || user.email
                };
                callback();
            } else {
                window.location.href = 'index.html';
            }
        });
    } else {
        setTimeout(() => waitForFirebase(callback), 100);
    }
}

// Load transactions from Firestore
async function loadTransactionsFromFirestore() {
    const { doc, getDoc } = window.firebaseFirestoreFunctions;
    const db = window.firebaseDb;
    
    try {
        const transactionsDoc = await getDoc(doc(db, `transactions_${currentUser.uid}`, "data"));
        if (transactionsDoc.exists()) {
            transactions = transactionsDoc.data().transactions || [];
        } else {
            transactions = [];
        }
        filteredTransactions = [...transactions];
    } catch (error) {
        console.error("Error loading transactions:", error);
        transactions = [];
        filteredTransactions = [];
    }
}

// Save transactions to Firestore
async function saveTransactionsToFirestore() {
    const { doc, setDoc } = window.firebaseFirestoreFunctions;
    const db = window.firebaseDb;
    
    try {
        await setDoc(doc(db, `transactions_${currentUser.uid}`, "data"), {
            transactions: transactions
        });
    } catch (error) {
        console.error("Error saving transactions:", error);
    }
}

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
const exportBtn = document.getElementById('exportBtn');

// Filter elements
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const categoryFilter = document.getElementById('categoryFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// Summary elements
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const netBalanceEl = document.getElementById('netBalance');
const incomeCountEl = document.getElementById('incomeCount');
const expenseCountEl = document.getElementById('expenseCount');
const totalCountEl = document.getElementById('totalCount');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    waitForFirebase(async () => {
        userNameEl.textContent = currentUser.username || 'User';
        userEmailEl.textContent = currentUser.email;
        await loadTransactionsFromFirestore();
        updateCategories();
        setDefaultDate();
        populateCategoryFilter();
        loadTransactions();
        updateSummary();
    
    // Type toggle buttons
    const expenseBtn = document.getElementById('expenseBtn');
    const incomeBtn = document.getElementById('incomeBtn');
    
    if (expenseBtn && incomeBtn) {
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
    }
    
    // Modal handlers
    addTransactionBtn.addEventListener('click', () => {
        editingId = null;
        modalTitle.textContent = 'Add Transaction';
        transactionForm.reset();
        setDefaultDate();
        updateCategories();
        cancelEditBtn.style.display = 'none';
        // Reset type toggle to income
        if (incomeBtn && expenseBtn) {
            incomeBtn.classList.add('active');
            expenseBtn.classList.remove('active');
            transactionTypeSelect.value = 'income';
        }
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
    
    // Filter handlers
    searchInput.addEventListener('input', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Export CSV
    exportBtn.addEventListener('click', exportToCSV);
    });
});

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
}

// Populate category filter dropdown
function populateCategoryFilter() {
    const allCategories = [...new Set([...incomeCategories, ...expenseCategories])];
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
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
    applyFilters();
    updateSummary();
    transactionModal.classList.remove('active');
    transactionForm.reset();
    setDefaultDate();
    updateCategories();
    
    // Reset type toggle
    const expenseBtn = document.getElementById('expenseBtn');
    const incomeBtn = document.getElementById('incomeBtn');
    if (incomeBtn && expenseBtn) {
        incomeBtn.classList.add('active');
        expenseBtn.classList.remove('active');
        transactionTypeSelect.value = 'income';
    }
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
    if (incomeBtn && expenseBtn) {
        incomeBtn.classList.add('active');
        expenseBtn.classList.remove('active');
        transactionTypeSelect.value = 'income';
    }
});

// Apply filters
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const typeValue = typeFilter.value;
    const categoryValue = categoryFilter.value;
    
    filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.name.toLowerCase().includes(searchTerm) ||
                            transaction.category.toLowerCase().includes(searchTerm);
        const matchesType = typeValue === 'all' || transaction.type === typeValue;
        const matchesCategory = categoryValue === 'all' || transaction.category === categoryValue;
        
        return matchesSearch && matchesType && matchesCategory;
    });
    
    loadTransactions();
}

// Clear filters
function clearFilters() {
    searchInput.value = '';
    typeFilter.value = 'all';
    categoryFilter.value = 'all';
    applyFilters();
}

// Load and display transactions
function loadTransactions() {
    // Sort by date (newest first)
    const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedTransactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">receipt_long</span>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }
    
    transactionList.innerHTML = sortedTransactions.map(transaction => {
        const statusColor = transaction.type === 'income' ? '#0fb16e' : '#ef4444';
        const amountColor = transaction.type === 'income' ? '#0fb16e' : '#ef4444';
        const formattedDate = formatDate(transaction.date);
        
        return `
            <div class="transaction-item-full">
                <div class="transaction-status" style="background: ${statusColor}"></div>
                <div class="transaction-info-full">
                    <div class="transaction-name-full">${transaction.name}</div>
                    <div class="transaction-meta-full">
                        <span>${transaction.category}</span>
                        <span>•</span>
                        <span>${formattedDate}</span>
                    </div>
                </div>
                <div class="transaction-amount-full" style="color: ${amountColor}">
                    ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                </div>
                <div class="transaction-actions-full">
                    <button class="action-btn-full edit-btn-full" onclick="editTransaction('${transaction.id}')" title="Edit">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="action-btn-full delete-btn-full" onclick="deleteTransaction('${transaction.id}')" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Edit Transaction
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
    if (incomeBtn && expenseBtn) {
        if (transaction.type === 'expense') {
            expenseBtn.classList.add('active');
            incomeBtn.classList.remove('active');
        } else {
            incomeBtn.classList.add('active');
            expenseBtn.classList.remove('active');
        }
    }
    
    document.getElementById('transactionName').value = transaction.name;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionDate').value = transaction.date;
    cancelEditBtn.style.display = 'block';
    transactionForm.querySelector('.btn-submit').textContent = 'Update Transaction';
    transactionModal.classList.add('active');
}

// Delete Transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        applyFilters();
        updateSummary();
    }
}

// Save transactions to Firestore
function saveTransactions() {
    saveTransactionsToFirestore();
}

// Update Summary Cards
function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    
    const incomeCount = transactions.filter(t => t.type === 'income').length;
    const expenseCount = transactions.filter(t => t.type === 'expense').length;
    const totalCount = transactions.length;
    
    totalIncomeEl.textContent = `$${income.toFixed(2)}`;
    totalExpenseEl.textContent = `$${expense.toFixed(2)}`;
    netBalanceEl.textContent = `$${balance.toFixed(2)}`;
    
    incomeCountEl.textContent = `+${incomeCount}`;
    expenseCountEl.textContent = expenseCount;
    totalCountEl.textContent = `${totalCount} total`;
    
    // Update balance color
    if (balance < 0) {
        netBalanceEl.style.color = '#ef4444';
    } else {
        netBalanceEl.style.color = '#3b82f6';
    }
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// Export to CSV
function exportToCSV() {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }
    
    const headers = ['Type', 'Name', 'Category', 'Amount', 'Date'];
    const rows = transactions.map(t => [
        t.type,
        t.name,
        t.category,
        t.amount.toFixed(2),
        formatDate(t.date)
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Logout
logoutBtn.addEventListener('click', async function() {
    if (confirm('Are you sure you want to logout?')) {
        const { signOut } = window.firebaseAuthFunctions;
        if (signOut) {
            await signOut(window.firebaseAuth);
        }
        localStorage.removeItem('firebaseUser');
        window.location.href = 'index.html';
    }
});

