// Categories Page JavaScript

// Check if user is logged in
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
if (!loggedInUser) {
    window.location.href = 'index.html';
}

// Initialize
let categories = JSON.parse(localStorage.getItem(`categories_${loggedInUser.email}`)) || [];
let editingCategoryId = null;

// Default categories if none exist
const defaultIncomeCategories = ['Salary', 'Freelance'];
const defaultExpenseCategories = ['Food', 'Entertainment', 'Transportation', 'Utilities'];

// DOM Elements
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryModal = document.getElementById('categoryModal');
const closeCategoryModal = document.getElementById('closeCategoryModal');
const categoryForm = document.getElementById('categoryForm');
const categoryModalTitle = document.getElementById('categoryModalTitle');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const incomeCategoriesList = document.getElementById('incomeCategoriesList');
const expenseCategoriesList = document.getElementById('expenseCategoriesList');
const incomeCountEl = document.getElementById('incomeCount');
const expenseCountEl = document.getElementById('expenseCount');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    userNameEl.textContent = loggedInUser.username || 'User';
    userEmailEl.textContent = loggedInUser.email;
    
    // Initialize default categories if empty
    if (categories.length === 0) {
        initializeDefaultCategories();
    }
    
    loadCategories();
    
    // Type toggle buttons
    const categoryExpenseBtn = document.getElementById('categoryExpenseBtn');
    const categoryIncomeBtn = document.getElementById('categoryIncomeBtn');
    
    categoryExpenseBtn.addEventListener('click', () => {
        categoryExpenseBtn.classList.add('active');
        categoryIncomeBtn.classList.remove('active');
        document.getElementById('categoryType').value = 'expense';
    });
    
    categoryIncomeBtn.addEventListener('click', () => {
        categoryIncomeBtn.classList.add('active');
        categoryExpenseBtn.classList.remove('active');
        document.getElementById('categoryType').value = 'income';
    });
    
    // Color picker preview
    const categoryColor = document.getElementById('categoryColor');
    const colorPreview = document.getElementById('colorPreview');
    
    categoryColor.addEventListener('input', function() {
        colorPreview.style.backgroundColor = this.value;
    });
    
    // Modal handlers
    addCategoryBtn.addEventListener('click', () => {
        editingCategoryId = null;
        categoryModalTitle.textContent = 'Add Category';
        categoryForm.reset();
        document.getElementById('categoryColor').value = '#0fb16e';
        colorPreview.style.backgroundColor = '#0fb16e';
        cancelCategoryBtn.style.display = 'none';
        categoryForm.querySelector('.btn-submit').textContent = 'Add Category';
        // Reset type toggle to income
        categoryIncomeBtn.classList.add('active');
        categoryExpenseBtn.classList.remove('active');
        document.getElementById('categoryType').value = 'income';
        categoryModal.classList.add('active');
    });
    
    closeCategoryModal.addEventListener('click', () => {
        categoryModal.classList.remove('active');
    });
    
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) {
            categoryModal.classList.remove('active');
        }
    });
    
    // Category form submit
    categoryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const type = document.getElementById('categoryType').value;
        const name = document.getElementById('categoryName').value.trim();
        const color = document.getElementById('categoryColor').value;
        
        if (!name) {
            alert('Please enter a category name');
            return;
        }
        
        // Check if category name already exists for this type
        const existing = categories.find(c => 
            c.name.toLowerCase() === name.toLowerCase() && 
            c.type === type &&
            c.id !== editingCategoryId
        );
        
        if (existing) {
            alert('This category already exists for this type');
            return;
        }
        
        if (editingCategoryId !== null) {
            // Update existing category
            const index = categories.findIndex(c => c.id === editingCategoryId);
            if (index !== -1) {
                categories[index] = {
                    id: editingCategoryId,
                    type,
                    name,
                    color
                };
            }
            editingCategoryId = null;
        } else {
            // Add new category
            const category = {
                id: Date.now().toString(),
                type,
                name,
                color
            };
            categories.push(category);
        }
        
        saveCategories();
        loadCategories();
        categoryModal.classList.remove('active');
        categoryForm.reset();
    });
    
    // Cancel button
    cancelCategoryBtn.addEventListener('click', function() {
        editingCategoryId = null;
        this.style.display = 'none';
        categoryForm.reset();
        categoryModalTitle.textContent = 'Add Category';
        categoryForm.querySelector('.btn-submit').textContent = 'Add Category';
        categoryIncomeBtn.classList.add('active');
        categoryExpenseBtn.classList.remove('active');
        document.getElementById('categoryType').value = 'income';
    });
});

// Initialize default categories
function initializeDefaultCategories() {
    const defaultColors = {
        income: ['#0fb16e', '#3b82f6'],
        expense: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4']
    };
    
    defaultIncomeCategories.forEach((name, index) => {
        categories.push({
            id: `income_${index}`,
            type: 'income',
            name,
            color: defaultColors.income[index] || '#0fb16e'
        });
    });
    
    defaultExpenseCategories.forEach((name, index) => {
        categories.push({
            id: `expense_${index}`,
            type: 'expense',
            name,
            color: defaultColors.expense[index] || '#ef4444'
        });
    });
    
    saveCategories();
}

// Load and display categories
function loadCategories() {
    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');
    
    incomeCountEl.textContent = incomeCategories.length;
    expenseCountEl.textContent = expenseCategories.length;
    
    // Display income categories
    if (incomeCategories.length === 0) {
        incomeCategoriesList.innerHTML = '<p class="empty-category">No income categories yet</p>';
    } else {
        incomeCategoriesList.innerHTML = incomeCategories.map(category => `
            <div class="category-item">
                <div class="category-dot" style="background: ${category.color}"></div>
                <span class="category-name">${category.name}</span>
                <span class="category-badge income-badge">Income</span>
                <div class="category-actions">
                    <button class="action-btn-category edit-category-btn" onclick="editCategory('${category.id}')" title="Edit">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="action-btn-category delete-category-btn" onclick="deleteCategory('${category.id}')" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Display expense categories
    if (expenseCategories.length === 0) {
        expenseCategoriesList.innerHTML = '<p class="empty-category">No expense categories yet</p>';
    } else {
        expenseCategoriesList.innerHTML = expenseCategories.map(category => `
            <div class="category-item">
                <div class="category-dot" style="background: ${category.color}"></div>
                <span class="category-name">${category.name}</span>
                <span class="category-badge expense-badge">Expense</span>
                <div class="category-actions">
                    <button class="action-btn-category edit-category-btn" onclick="editCategory('${category.id}')" title="Edit">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="action-btn-category delete-category-btn" onclick="deleteCategory('${category.id}')" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// Edit Category
function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    const categoryExpenseBtn = document.getElementById('categoryExpenseBtn');
    const categoryIncomeBtn = document.getElementById('categoryIncomeBtn');
    
    editingCategoryId = id;
    categoryModalTitle.textContent = 'Edit Category';
    document.getElementById('categoryType').value = category.type;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryColor').value = category.color;
    document.getElementById('colorPreview').style.backgroundColor = category.color;
    cancelCategoryBtn.style.display = 'block';
    categoryForm.querySelector('.btn-submit').textContent = 'Update Category';
    
    // Update type toggle buttons
    if (category.type === 'expense') {
        categoryExpenseBtn.classList.add('active');
        categoryIncomeBtn.classList.remove('active');
    } else {
        categoryIncomeBtn.classList.add('active');
        categoryExpenseBtn.classList.remove('active');
    }
    
    categoryModal.classList.add('active');
}

// Delete Category
function deleteCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    // Check if category is used in transactions
    const transactions = JSON.parse(localStorage.getItem(`transactions_${loggedInUser.email}`)) || [];
    const isUsed = transactions.some(t => t.category === category.name);
    
    if (isUsed) {
        if (!confirm(`This category is used in ${transactions.filter(t => t.category === category.name).length} transaction(s). Are you sure you want to delete it?`)) {
            return;
        }
    } else {
        if (!confirm('Are you sure you want to delete this category?')) {
            return;
        }
    }
    
    categories = categories.filter(c => c.id !== id);
    saveCategories();
    loadCategories();
}

// Save categories to localStorage
function saveCategories() {
    localStorage.setItem(`categories_${loggedInUser.email}`, JSON.stringify(categories));
}

// Logout
logoutBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    }
});

