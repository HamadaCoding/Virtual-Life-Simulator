/* ====================== Virtual Life - Main Script ====================== */
/* ================================ App.js ================================ */

const app = {
    data: {
        level: 1,
        xp: 0,
        maxXp: 500,
        health: 100,
        motivation: 100,
        dayStarted: false,
    },

    elements: {
        xpFill: document.querySelector(".xp-progress"),
        xpLevel: document.querySelector(".xp-level"),
        xpValue: document.querySelector(".xp-value"),
        levelText: document.querySelector(".level"),
        healthFill: document.querySelector(".stat-fill-health"),
        motivationFill: document.querySelector(".stat-fill-motivation"),
        startButton: document.querySelector(".primary-btn"),
        tasksCompletedText: document.getElementById('tasks-completed-text'),
        tasksPoints: document.getElementById('tasks-points'),
        xpEarnedText: document.getElementById('xp-earned-text'),
        xpPoints: document.getElementById('xp-points'),
        streakText: document.getElementById('streak-text'),
        streakPoints: document.getElementById('streak-points'),
    },

    init() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            // Redirect to login if not logged in (index.html)
            window.location.href = 'index.html';
            return;
        }

        // Update username display
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = currentUser;
        }

        // Ensure elements are loaded
        this.elements.xpFill = document.querySelector(".xp-progress");
        this.elements.xpLevel = document.querySelector(".xp-level");
        this.elements.xpValue = document.querySelector(".xp-value");
        this.elements.levelText = document.querySelector(".level");
        this.elements.healthFill = document.querySelector(".stat-fill-health");
        this.elements.motivationFill = document.querySelector(".stat-fill-motivation");
        this.elements.startButton = document.querySelector(".primary-btn");
        this.elements.tasksCompletedText = document.getElementById('tasks-completed-text');
        this.elements.tasksPoints = document.getElementById('tasks-points');
        this.elements.xpEarnedText = document.getElementById('xp-earned-text');
        this.elements.xpPoints = document.getElementById('xp-points');
        this.elements.streakText = document.getElementById('streak-text');
        this.elements.streakPoints = document.getElementById('streak-points');

        if (!this.elements.startButton) return;

        // Load user-specific data from backend
        this.loadDataFromBackend();
        this.loadDayStatus();
        this.updateTodaySummary();
        this.updateShopPreview();
        this.updateActiveItems();
        this.updateUI();
        this.bindEvents();
        this.startActiveItemsTimer();
        
        // Listen for data updates
        window.addEventListener('playerDataUpdated', () => {
            this.updateTodaySummary();
            this.updateShopPreview();
            this.updateActiveItems();
        });
    },

    loadDataFromBackend() {
        // Load from localStorage via playerAPI
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            console.warn("No user logged in");
            return;
        }

        // Try to load user-specific data from playerAPI
        if (window.playerAPI && window.playerAPI.loadPlayerData) {
            const data = window.playerAPI.loadPlayerData(currentUser);
            if (data && data.username === currentUser) {
                // Load user-specific data (XP, level, tasks, etc.)
                this.data.level = parseInt(data.level) || 1;
                this.data.xp = parseInt(data.xp) || 0;
                this.data.maxXp = parseInt(data.max_xp) || 500;
                this.data.health = parseInt(data.health) || 100;
                this.data.motivation = parseInt(data.motivation) || 100;
                this.data.dayStarted = data.day_started || false;
                this.data.last_start_date = data.last_start_date || null;
                console.log(`Loaded data for user: ${currentUser}`, {
                    level: this.data.level,
                    xp: this.data.xp,
                    tasks_done: data.tasks_done || 0,
                    total_tasks_completed: data.total_tasks_completed || 0
                });
            }
        } else if (window.playerAPI && window.playerAPI.getPlayerData) {
            const data = window.playerAPI.getPlayerData();
            if (data && data.username === currentUser) {
                // Load user-specific data
                this.data.level = parseInt(data.level) || 1;
                this.data.xp = parseInt(data.xp) || 0;
                this.data.maxXp = parseInt(data.max_xp) || 500;
                this.data.health = parseInt(data.health) || 100;
                this.data.motivation = parseInt(data.motivation) || 100;
                this.data.dayStarted = data.day_started || false;
                this.data.last_start_date = data.last_start_date || null;
                console.log(`Loaded data for user: ${currentUser}`, {
                    level: this.data.level,
                    xp: this.data.xp,
                    tasks_done: data.tasks_done || 0,
                    total_tasks_completed: data.total_tasks_completed || 0
                });
            }
        } else {
            // Fallback: wait for the event or load directly from localStorage
            const storageKey = `virtual_life_player_data_${currentUser}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    if (data.username === currentUser) {
                        this.data.level = parseInt(data.level) || 1;
                        this.data.xp = parseInt(data.xp) || 0;
                        this.data.maxXp = parseInt(data.max_xp) || 500;
                        this.data.health = parseInt(data.health) || 100;
                        this.data.motivation = parseInt(data.motivation) || 100;
                        this.data.dayStarted = data.day_started || false;
                        this.data.last_start_date = data.last_start_date || null;
                        console.log(`Loaded data directly from localStorage for user: ${currentUser}`);
                    }
                } catch (error) {
                    console.error("Error parsing stored data:", error);
                }
            }
            
            // Also listen for the event in case playerData.js loads later
            window.addEventListener('playerDataLoaded', (event) => {
                const data = event.detail;
                if (data && data.username === currentUser) {
                    this.data.level = parseInt(data.level) || 1;
                    this.data.xp = parseInt(data.xp) || 0;
                    this.data.maxXp = parseInt(data.max_xp) || 500;
                    this.data.health = parseInt(data.health) || 100;
                    this.data.motivation = parseInt(data.motivation) || 100;
                    this.data.dayStarted = data.day_started || false;
                    this.data.last_start_date = data.last_start_date || null;
                    this.updateUI();
                }
            }, { once: true });
        }
    },

    bindEvents() {
        if (this.elements.startButton) {
            this.elements.startButton.addEventListener("click", () => {
                this.startDay();
            });
        }
    },

    loadDayStatus() {
        const today = new Date().toDateString();
        const lastStartDate = this.data.last_start_date ? new Date(this.data.last_start_date).toDateString() : null;

        if (lastStartDate === today) {
            this.data.dayStarted = true;
            this.disableStartButton();
        }
    },

    startDay() {
        const today = new Date().toDateString();

        if (this.data.dayStarted) {
            this.showPopup("You've already started your day! Complete your tasks first.");
            return;
        }

        // Update streak when starting day
        if (window.dailyTracker) {
            window.dailyTracker.updateStreak();
        }

        // Save today's start
        this.data.dayStarted = true;
        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Save to localStorage
        if (window.playerAPI) {
            window.playerAPI.updatePlayerData({
                day_started: true,
                last_start_date: todayDate
            });
        }
        
        this.disableStartButton();
        this.updateTodaySummary();

        // Redirect to Daily Tasks
        window.location.href = "Structure/daily-tasks.html";
    },
    
    updateTodaySummary() {
        if (!window.dailyTracker) return;
        
        // Reset daily data if needed
        window.dailyTracker.resetDailyDataIfNeeded();
        
        // Get daily stats
        const dailyTasks = window.dailyTracker.getDailyTasksCompleted();
        const dailyXp = window.dailyTracker.getDailyXpEarned();
        const streak = window.dailyTracker.getCurrentStreak();
        
        // Calculate points
        const taskPoints = window.dailyTracker.calculateTaskPoints(dailyTasks);
        const xpPoints = window.dailyTracker.calculateXpPoints(dailyXp);
        
        // Update tasks completed
        if (this.elements.tasksCompletedText) {
            this.elements.tasksCompletedText.textContent = `${dailyTasks} Task${dailyTasks !== 1 ? 's' : ''} Completed`;
        }
        if (this.elements.tasksPoints) {
            this.elements.tasksPoints.textContent = `+${taskPoints}P`;
        }
        
        // Update XP earned
        if (this.elements.xpEarnedText) {
            this.elements.xpEarnedText.textContent = `${dailyXp} XP Earned`;
        }
        if (this.elements.xpPoints) {
            this.elements.xpPoints.textContent = `+${xpPoints}P`;
        }
        
        // Update streak
        if (this.elements.streakText) {
            this.elements.streakText.textContent = `${streak}-Day Streak`;
        }
        if (this.elements.streakPoints) {
            // Streak points: 6 points per day of streak
            this.elements.streakPoints.textContent = `+${streak * 6}P`;
        }
    },
    
    updateShopPreview() {
        if (!window.shop || !window.pointsSystem) return;
        
        const preview = document.getElementById('shopItemsPreview');
        if (!preview) return;
        
        // Show first 2-3 shop items as preview
        const previewItems = window.shop.SHOP_ITEMS.slice(0, 3);
        const pointsData = window.pointsSystem.calculateTotalPoints();
        
        preview.innerHTML = previewItems.map(item => {
            const canAfford = pointsData.total >= item.cost;
            return `
                <div class="shop-item-preview">
                    <div class="shop-item-preview-info">
                        <span class="shop-item-preview-icon">${item.icon}</span>
                        <div class="shop-item-preview-details">
                            <div class="shop-item-preview-name">${item.name}</div>
                            <div class="shop-item-preview-cost">💰 ${item.cost} Points</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    updateActiveItems() {
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
        }, 1000);
    },

    disableStartButton() {
        if (!this.elements.startButton) return;
        this.elements.startButton.disabled = true;
        this.elements.startButton.textContent = "Already Started!";
        this.elements.startButton.classList.add("disabled-btn");
    },

    updateUI() {
        const { level, xp, maxXp, health, motivation } = this.data;

        if (this.elements.xpFill)
            this.elements.xpFill.style.width = `${(xp / maxXp) * 100}%`;

        if (this.elements.xpLevel)
            this.elements.xpLevel.textContent = `Level ${level}`;

        if (this.elements.xpValue)
            this.elements.xpValue.textContent = `${xp} / ${maxXp} XP`;

        if (this.elements.healthFill)
            this.elements.healthFill.style.width = `${health}%`;

        if (this.elements.motivationFill)
            this.elements.motivationFill.style.width = `${motivation}%`;

        if (this.elements.levelText)
            this.elements.levelText.textContent = `Level ${level}`;
    },

    gainXp(amount) {
        // Check for XP multiplier effect
        let xpMultiplier = 1;
        if (window.shop && window.shop.getXPMultiplier) {
            xpMultiplier = window.shop.getXPMultiplier();
        }
        
        const adjustedAmount = amount * xpMultiplier;
        this.data.xp += adjustedAmount;

        // Handle multiple level-ups if XP exceeds multiple thresholds
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
                max_xp: this.data.maxXp
            });
        }

        this.updateUI();
    },

    animateLevelUp() {
        const bar = this.elements.xpFill;
        if (!bar) return;

        bar.style.transition = "all 0.5s ease";
        bar.style.boxShadow = "0 0 20px rgba(255, 216, 79, 0.9)";
        setTimeout(() => {
            bar.style.boxShadow = "";
        }, 1000);
    },

    showPopup(message) {
        const popup = document.getElementById("popup");
        const msg = document.getElementById("popup-message");

        if (!popup || !msg) return;

        msg.textContent = message;
        popup.classList.remove("hidden");

        setTimeout(() => {
            popup.classList.add("hidden");
        }, 3000);
    },
};

// Initialize app
document.addEventListener("DOMContentLoaded", () => app.init());
