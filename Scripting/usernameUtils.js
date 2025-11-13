// usernameUtils.js - Utility to update username displays across all pages

/**
 * Updates username displays across all pages based on logged-in user
 */
function updateUsernameDisplays() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        // If no user logged in, redirect to login (index.html) (but not if already on login page)
        if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
            const isInStructure = window.location.pathname.includes('Structure');
            const loginPath = isInStructure ? '../index.html' : 'index.html';
            window.location.href = loginPath;
        }
        return;
    }

    // Update username in header (common selectors across pages)
    const usernameSelectors = [
        '.user-name',           // profile.html, rewards.html, Structure/home.html
        '#userName',             // Structure/home.html
        '.username',             // daily-tasks.html
        '.player-name'           // profile.html (avatar section)
    ];

    usernameSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element) {
                element.textContent = currentUser;
            }
        });
    });
}

// Auto-update on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateUsernameDisplays);
} else {
    updateUsernameDisplays();
}

// Also update when player data is loaded
window.addEventListener('playerDataLoaded', updateUsernameDisplays);

