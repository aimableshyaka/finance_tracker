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
    waitForFirebase(async () => {
        await loadPreferencesFromFirestore();
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
});

// Load user data
function loadUserData() {
    userNameEl.textContent = currentUser.username || 'User';
    userEmailEl.textContent = currentUser.email;
    
    document.getElementById('fullName').value = currentUser.username || '';
    document.getElementById('email').value = currentUser.email || '';
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
async function saveProfile() {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!fullName || !email) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const { updateProfile, updateEmail } = window.firebaseAuthFunctions;
        const { doc, setDoc } = window.firebaseFirestoreFunctions;
        const auth = window.firebaseAuth;
        const db = window.firebaseDb;
        const user = auth.currentUser;
        
        if (user) {
            // Update display name
            await updateProfile(user, { displayName: fullName });
            
            // Update email if changed
            if (email !== user.email) {
                await updateEmail(user, email);
            }
            
            // Update user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                username: fullName,
                email: email,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            // Update current user
            currentUser.username = fullName;
            currentUser.email = email;
            localStorage.setItem('firebaseUser', JSON.stringify({
                uid: user.uid,
                email: email,
                displayName: fullName
            }));
            
            // Update display
            userNameEl.textContent = fullName;
            userEmailEl.textContent = email;
            
            alert('Profile updated successfully!');
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        alert('Error updating profile: ' + error.message);
    }
}

// Save preferences
async function savePreferences() {
    const currency = document.getElementById('currency').value;
    const emailNotifications = document.getElementById('emailNotifications').checked;
    
    userPreferences = {
        currency,
        emailNotifications
    };
    
    await savePreferencesToFirestore();
    alert('Preferences saved successfully!');
}

// Change password
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate new password
    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    try {
        const { signInWithEmailAndPassword, updatePassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        const auth = window.firebaseAuth;
        const user = auth.currentUser;
        
        if (user) {
            // Re-authenticate user
            const credential = await signInWithEmailAndPassword(auth, user.email, currentPassword);
            
            // Update password
            await updatePassword(credential.user, newPassword);
            
            passwordModal.classList.remove('active');
            passwordForm.reset();
            alert('Password updated successfully!');
        }
    } catch (error) {
        console.error("Error changing password:", error);
        if (error.code === 'auth/wrong-password') {
            alert('Current password is incorrect');
        } else {
            alert('Error changing password: ' + error.message);
        }
    }
}

// Delete account
async function deleteAccount() {
    try {
        const { deleteUser } = window.firebaseAuthFunctions;
        const { doc, deleteDoc } = window.firebaseFirestoreFunctions;
        const auth = window.firebaseAuth;
        const db = window.firebaseDb;
        const user = auth.currentUser;
        
        if (user) {
            // Delete user data from Firestore
            await deleteDoc(doc(db, `transactions_${user.uid}`, "data"));
            await deleteDoc(doc(db, `categories_${user.uid}`, "data"));
            await deleteDoc(doc(db, `preferences_${user.uid}`, "data"));
            await deleteDoc(doc(db, "users", user.uid));
            
            // Delete Firebase Auth user
            await deleteUser(user);
            
            localStorage.removeItem('firebaseUser');
            alert('Account deleted successfully. You will be redirected to the login page.');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error("Error deleting account:", error);
        alert('Error deleting account: ' + error.message);
    }
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

