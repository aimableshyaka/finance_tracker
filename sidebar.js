// Shared Sidebar Component
function loadSidebar() {
    const currentPage = getCurrentPage();
    
    const sidebarHTML = `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-icon">
                    <span class="material-icons">grid_view</span>
                </div>
                <div class="logo-text">
                    <h1>Finance</h1>
                    <p>Personal Tracker</p>
                </div>
            </div>
            
            <nav class="sidebar-nav">
                <a href="dashboard.html" class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
                    <span class="material-icons">grid_view</span>
                    <span>Dashboard</span>
                </a>
                <a href="transactions.html" class="nav-item ${currentPage === 'transactions' ? 'active' : ''}" data-page="transactions">
                    <span class="material-icons">send</span>
                    <span>Transactions</span>
                </a>
                <a href="categories.html" class="nav-item ${currentPage === 'categories' ? 'active' : ''}" data-page="categories">
                    <span class="material-icons">category</span>
                    <span>Categories</span>
                </a>
                <a href="analytics.html" class="nav-item ${currentPage === 'analytics' ? 'active' : ''}" data-page="analytics">
                    <span class="material-icons">bar_chart</span>
                    <span>Analytics</span>
                </a>
                <a href="settings.html" class="nav-item ${currentPage === 'settings' ? 'active' : ''}" data-page="settings">
                    <span class="material-icons">settings</span>
                    <span>Settings</span>
                </a>
            </nav>
            
            <button class="sign-out-btn" id="logoutBtn">
                <span class="material-icons">logout</span>
                <span>Sign Out</span>
            </button>
        </aside>
    `;
    
    // Insert sidebar into the page
    const wrapper = document.querySelector('.dashboard-wrapper');
    if (wrapper) {
        wrapper.insertAdjacentHTML('afterbegin', sidebarHTML);
    }
    
    // Add logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('loggedInUser');
                window.location.href = 'index.html';
            }
        });
    }
}

// Get current page name from URL
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'dashboard.html';
    
    if (page.includes('dashboard')) return 'dashboard';
    if (page.includes('transactions')) return 'transactions';
    if (page.includes('categories')) return 'categories';
    if (page.includes('analytics')) return 'analytics';
    if (page.includes('settings')) return 'settings';
    
    return 'dashboard';
}

// Load sidebar when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
    loadSidebar();
}

