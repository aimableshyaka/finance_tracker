// Settings Page JavaScript

// Check if user is logged in
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
if (!loggedInUser) {
    window.location.href = 'index.html';
}

// DOM Elements
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const settingsTabs = document.querySelectorAll('.settings-tab');
const settingsContents = document.querySelectorAll('.settings-content');
const profileForm = document.getElementById('profileForm');
const preferencesForm = document.getElementById('preferencesForm');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const passwordModal = document.getElementById('passwordModal');
const closePasswordModal = document.getElementById('closePasswordModal');
const passwordForm = document.getElementById('passwordForm');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');

// Load user preferences
let userPreferences = JSON.parse(localStorage.getItem(`preferences_${loggedInUser.email}`)) || {
    currency: 'USD',
    emailNotifications: true
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadPreferences();
    
    // Tab switching
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            switchTab(targetTab);
        });
    });
    
    // Profile form submit
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProfile();
    });
    
    // Preferences form submit
    preferencesForm.addEventListener('submit', function(e) {
        e.preventDefault();
        savePreferences();
    });
    
    // Change password button
    changePasswordBtn.addEventListener('click', () => {
        passwordModal.classList.add('active');
    });
    
    closePasswordModal.addEventListener('click', () => {
        passwordModal.classList.remove('active');
        passwordForm.reset();
    });
    
    passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            passwordModal.classList.remove('active');
            passwordForm.reset();
        }
    });
    
    cancelPasswordBtn.addEventListener('click', () => {
        passwordModal.classList.remove('active');
        passwordForm.reset();
    });
    
    // Password form submit
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        changePassword();
    });
    
    // Delete account button
    deleteAccountBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
            if (confirm('This is your last warning. All transactions, categories, and settings will be deleted. Type "DELETE" to confirm.')) {
                deleteAccount();
            }
        }
    });
});

// Load user data
function loadUserData() {
    userNameEl.textContent = loggedInUser.username || 'User';
    userEmailEl.textContent = loggedInUser.email;
    
    document.getElementById('fullName').value = loggedInUser.username || '';
    document.getElementById('email').value = loggedInUser.email || '';
}

// Load preferences
function loadPreferences() {
    document.getElementById('currency').value = userPreferences.currency || 'USD';
    document.getElementById('emailNotifications').checked = userPreferences.emailNotifications !== false;
}

// Switch tab
function switchTab(tabName) {
    // Update tab buttons
    settingsTabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update content
    settingsContents.forEach(content => {
        if (content.id === `${tabName}Content`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Save profile
function saveProfile() {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!fullName || !email) {
        alert('Please fill in all fields');
        return;
    }
    
    // Update user in users array
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.email === loggedInUser.email);
    
    if (userIndex !== -1) {
        users[userIndex].username = fullName;
        users[userIndex].email = email;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Update logged in user
    loggedInUser.username = fullName;
    loggedInUser.email = email;
    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    
    // Update display
    userNameEl.textContent = fullName;
    userEmailEl.textContent = email;
    
    alert('Profile updated successfully!');
}

// Save preferences
function savePreferences() {
    const currency = document.getElementById('currency').value;
    const emailNotifications = document.getElementById('emailNotifications').checked;
    
    userPreferences = {
        currency,
        emailNotifications
    };
    
    localStorage.setItem(`preferences_${loggedInUser.email}`, JSON.stringify(userPreferences));
    
    alert('Preferences saved successfully!');
}

// Change password
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate current password
    if (currentPassword !== loggedInUser.password) {
        alert('Current password is incorrect');
        return;
    }
    
    // Validate new password
    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    // Update password in users array
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.email === loggedInUser.email);
    
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Update logged in user
    loggedInUser.password = newPassword;
    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    
    passwordModal.classList.remove('active');
    passwordForm.reset();
    alert('Password updated successfully!');
}

// Delete account
function deleteAccount() {
    // Delete user from users array
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.filter(u => u.email !== loggedInUser.email);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Delete user data
    localStorage.removeItem(`transactions_${loggedInUser.email}`);
    localStorage.removeItem(`categories_${loggedInUser.email}`);
    localStorage.removeItem(`preferences_${loggedInUser.email}`);
    localStorage.removeItem('loggedInUser');
    
    alert('Account deleted successfully. You will be redirected to the login page.');
    window.location.href = 'index.html';
}

// Logout
logoutBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    }
});

