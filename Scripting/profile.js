// profile.js
const app = {
    data: {
        level: 1,
        xp: 0,
        maxXp: 500,
        totalXp: 0,
        tasksCompleted: [],
    },

    elements: {},

    init() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = '../index.html';
            return;
        }

        // Cache DOM elements
        this.elements = {
            xpFill: document.querySelector(".xp-progress"),
            xpValue: document.querySelector(".xp-value"),
            xpLevel: document.querySelector(".xp-level"),
            totalXP: document.querySelector("#total-xp"),
            profileLevel: document.querySelector("#profile-level"),
            tasksDone: document.querySelector("#tasks-done"),
            avatarCard: document.querySelector(".avatar-wrap"),
            popup: document.getElementById("popup"),
            popupMessage: document.getElementById("popup-message"),
            userName: document.querySelector(".user-name"),
            playerName: document.querySelector(".player-name"),
            streakDisplay: document.getElementById("streak-display"),
        };

        // Update username displays
        if (this.elements.userName) {
            this.elements.userName.textContent = currentUser;
        }
        if (this.elements.playerName) {
            this.elements.playerName.textContent = currentUser;
        }

        this.loadDataFromBackend();
        this.updateUI();
        this.updateActiveItems();
        this.updateActiveItemsHeader();
        
        // Listen for data updates from other pages
        window.addEventListener('playerDataUpdated', () => {
            this.loadDataFromBackend();
            this.updateUI();
            this.updateActiveItems();
            this.updateActiveItemsHeader();
        });
        this.startActiveItemsTimer();
    },

    loadDataFromBackend() {
        if (window.playerAPI && window.playerAPI.loadPlayerData) {
            const data = window.playerAPI.loadPlayerData();
            this.data.level = parseInt(data.level) || 1;
            this.data.xp = parseInt(data.xp) || 0;
            this.data.maxXp = parseInt(data.max_xp) || 500;
            this.data.totalXp = parseInt(data.total_xp) || 0;
            this.data.tasksCompleted = Array.isArray(data.tasks_completed) ? data.tasks_completed : [];
        } else if (window.playerAPI && window.playerAPI.getPlayerData) {
            const data = window.playerAPI.getPlayerData();
            this.data.level = parseInt(data.level) || 1;
            this.data.xp = parseInt(data.xp) || 0;
            this.data.maxXp = parseInt(data.max_xp) || 500;
            this.data.totalXp = parseInt(data.total_xp) || 0;
            this.data.tasksCompleted = Array.isArray(data.tasks_completed) ? data.tasks_completed : [];
        } else {
            window.addEventListener('playerDataLoaded', (event) => {
                const data = event.detail;
                this.data.level = parseInt(data.level) || 1;
                this.data.xp = parseInt(data.xp) || 0;
                this.data.maxXp = parseInt(data.max_xp) || 500;
                this.data.totalXp = parseInt(data.total_xp) || 0;
                this.data.tasksCompleted = Array.isArray(data.tasks_completed) ? data.tasks_completed : [];
                this.updateUI();
            }, { once: true });
        }
    },

    updateUI() {
        // Sync with global playerData to ensure we show the latest values
        if (window.playerAPI) {
            const globalData = window.playerAPI.getPlayerData();
            this.data.level = parseInt(globalData.level) || this.data.level;
            this.data.xp = parseInt(globalData.xp) || this.data.xp;
            this.data.maxXp = parseInt(globalData.max_xp) || this.data.maxXp;
            this.data.totalXp = parseInt(globalData.total_xp) || this.data.totalXp;
            this.data.tasksCompleted = Array.isArray(globalData.tasks_completed) ? globalData.tasks_completed : [];
        }

        const { level, xp, maxXp, totalXp, tasksCompleted } = this.data;

        // Prevent NaN or overflow issues
        const xpPercent = Math.min((xp / maxXp) * 100, 100);

        // Update header XP bar
        if (this.elements.xpFill) {
            this.elements.xpFill.style.width = `${xpPercent}%`;
        }
        if (this.elements.xpLevel) {
            this.elements.xpLevel.textContent = `Level ${level}`;
        }
        if (this.elements.xpValue) {
            this.elements.xpValue.textContent = `${xp} / ${maxXp} XP`;
        }

        // Update stats grid
        if (this.elements.profileLevel) {
            this.elements.profileLevel.textContent = level;
        }
        if (this.elements.totalXP) {
            this.elements.totalXP.textContent = totalXp;
        }
        if (this.elements.tasksDone) {
            // Show total_tasks_completed (NEVER RESET - only increments)
            if (window.playerAPI) {
                const globalData = window.playerAPI.getPlayerData();
                const totalTasksDone = parseInt(globalData.total_tasks_completed) || 0;
                this.elements.tasksDone.textContent = totalTasksDone;
            } else {
                // Fallback to current session if API not available
                const totalTasksDone = tasksCompleted.length;
                this.elements.tasksDone.textContent = totalTasksDone;
            }
        }
        
        // Update streak display
        if (this.elements.streakDisplay) {
            if (window.dailyTracker) {
                const streak = window.dailyTracker.getCurrentStreak();
                this.elements.streakDisplay.textContent = `${streak} day${streak !== 1 ? 's' : ''} 🔥`;
            } else if (window.playerAPI) {
                const globalData = window.playerAPI.getPlayerData();
                const streak = parseInt(globalData.streak) || 0;
                this.elements.streakDisplay.textContent = `${streak} day${streak !== 1 ? 's' : ''} 🔥`;
            }
        }
    },

    gainXp(amount) {
        // Check for XP multiplier effect
        let xpMultiplier = 1;
        if (window.shop && window.shop.getXPMultiplier) {
            xpMultiplier = window.shop.getXPMultiplier();
        }
        
        const adjustedAmount = amount * xpMultiplier;
        this.data.xp += adjustedAmount;
        this.data.totalXp += adjustedAmount;

        // Handle multiple level ups in one go
        while (this.data.xp >= this.data.maxXp) {
            this.data.xp -= this.data.maxXp;
            this.data.level++;
            this.data.maxXp = Math.round(this.data.maxXp * 1.25);
            this.animateLevelUp();
        }

        // Save to localStorage
        if (window.playerAPI) {
            window.playerAPI.updatePlayerData({
                level: this.data.level,
                xp: this.data.xp,
                max_xp: this.data.maxXp,
                total_xp: this.data.totalXp
            });
        }

        this.updateUI();
    },
    
    updateActiveItems() {
        if (!window.shop) return;
        
        const list = document.getElementById('activeItemsList');
        const section = document.getElementById('activeItemsSection');
        if (!list || !section) return;
        
        const activeItems = window.shop.getActiveItems();
        
        if (activeItems.length === 0) {
            list.innerHTML = '<p style="color: var(--text-color); opacity: 0.7; text-align: center; padding: 20px;">No active items</p>';
            return;
        }
        
        list.innerHTML = activeItems.map(item => {
            const timeRemaining = window.shop.formatTimeRemaining(item);
            const time = window.shop.getTimeRemaining(item);
            return `
                <div class="active-item-card">
                    <div class="active-item-icon">${item.icon}</div>
                    <div class="active-item-info">
                        <div class="active-item-name">${item.name}</div>
                        <div class="active-item-time">
                            ${time.days > 0 ? `${time.days}d ` : ''}
                            ${time.hours > 0 ? `${time.hours}h ` : ''}
                            ${time.minutes > 0 ? `${time.minutes}m ` : ''}
                            ${time.seconds}s remaining
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    updateActiveItemsHeader() {
        if (!window.shop) return;
        
        const header = document.getElementById('activeItemsHeader');
        if (!header) return;
        
        const activeItems = window.shop.getActiveItems();
        
        if (activeItems.length === 0) {
            header.innerHTML = '';
            return;
        }
        
        header.innerHTML = activeItems.map(item => {
            const timeRemaining = window.shop.formatTimeRemaining(item);
            return `
                <div class="active-item-badge" title="${item.name}">
                    <div class="active-item-name-small">${item.name}</div>
                    <div class="active-item-timer">
                        <span>${item.icon}</span>
                        <span>${timeRemaining}</span>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    startActiveItemsTimer() {
        // Update active items timer every second
        setInterval(() => {
            this.updateActiveItems();
            this.updateActiveItemsHeader();
        }, 1000);
    },

    animateLevelUp() {
        const card = this.elements.avatarCard;
        if (!card) return;

        card.style.boxShadow = "0 0 30px rgba(255, 216, 79, 0.9)";
        card.style.transition = "box-shadow 0.4s ease";

        setTimeout(() => {
            card.style.boxShadow = "0 0 15px rgba(255, 216, 79, 0.3)";
        }, 900);

        this.showPopup(`🎉 Level Up! You're now Level ${this.data.level}`);
    },

    showPopup(message) {
        const popup = this.elements.popup;
        const msg = this.elements.popupMessage;
        if (!popup || !msg) return;

        msg.textContent = message;
        popup.classList.remove("hidden");

        setTimeout(() => {
            popup.classList.add("hidden");
        }, 3000);
    },
};

// Initialize after DOM loads
document.addEventListener("DOMContentLoaded", () => {
    app.init();
    
    // Add event listener to logout button as backup
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof logout === 'function') {
                logout();
            } else if (typeof window.logout === 'function') {
                window.logout();
            } else {
                // Fallback: manual logout
                localStorage.removeItem('currentUser');
                const currentPath = window.location.pathname;
                const currentHref = window.location.href;
                let loginPath;
                
                if (currentPath.includes('Structure/') || currentPath.includes('Structure\\') || 
                    currentHref.includes('Structure/') || currentHref.includes('Structure\\')) {
                    loginPath = '../index.html';
                } else {
                    loginPath = 'index.html';
                }
                window.location.href = loginPath;
            }
        });
    }
});
